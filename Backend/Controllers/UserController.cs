using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Backend.Data;
using Backend.Models;
using Backend.DTO;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using Microsoft.AspNetCore.Authorization;

namespace SaaS_Aluno.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        public UserController(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                return BadRequest("Email já cadastrado.");

            var user = new User
            {
                Name = dto.Name,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = "Aluno",
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { user.Id, user.Name, user.Email, user.Role });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                return Unauthorized("Email ou senha incorretos.");

            // 🔹 Verifica se o plano expirou
            if (user.PlanoExpiraEm.HasValue && user.PlanoExpiraEm.Value <= DateTime.UtcNow)
            {
                user.Plano = "Gratuito";
                user.Ativo = false;
                await _context.SaveChangesAsync();
            }

            // 🔹 Gera o token JWT normalmente
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_config["Jwt:Key"]);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role)
        }),
                Expires = DateTime.UtcNow.AddDays(7),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature),
                Issuer = _config["Jwt:Issuer"],
                Audience = _config["Jwt:Audience"]
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            // 🔹 Retorna dados completos pro frontend
            return Ok(new
            {
                token = tokenString,
                user = new
                {
                    user.Id,
                    user.Name,
                    user.Email,
                    user.Role,
                    user.Plano,
                    user.Ativo,
                    PlanoExpiraEm = user.PlanoExpiraEm?.ToString("yyyy-MM-ddTHH:mm:ssZ")
                }
            });
        }

        [Authorize]
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var user = await _context.Users.FindAsync(int.Parse(userId));
            if (user == null)
                return NotFound("Usuário não encontrado.");

            return Ok(new
            {
                user.Id,
                user.Name,
                user.Email,
                user.Role,
                user.Cpf,
                user.Telefone,
                user.CreatedAt
            });
        }

        [Authorize]
        [HttpGet("meus-dados")]
        public async Task<IActionResult> MeusDados()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var user = await _context.Users.FindAsync(int.Parse(userId));
            if (user == null)
                return NotFound("Usuário não encontrado.");

            return Ok(new
            {
                user.Id,
                user.Name,
                user.Email,
                user.Cpf,
                user.Telefone,
                user.Plano,
                user.UltimoPagamento,
                user.Ativo
            });
        }

        // Atualizando dados do usuário e retornando assinatura também
        [Authorize]
        [HttpPost("atualizar-dados")]
        public async Task<IActionResult> AtualizarDados([FromBody] UpdateUserDataDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var user = await _context.Users.FindAsync(int.Parse(userId));
            if (user == null)
                return NotFound("Usuário não encontrado.");

            user.Cpf = dto.Cpf ?? user.Cpf;
            user.Telefone = dto.Telefone ?? user.Telefone;

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Dados atualizados com sucesso!",
                user.Cpf,
                user.Telefone,
                user.Plano,
                user.UltimoPagamento,
                user.Ativo
            });
        }

        [Authorize]
        [HttpPut("atualizar-perfil")]
        public async Task<IActionResult> AtualizarPerfil([FromBody] UpdateUserProfileDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "Usuário não autenticado." });

            var user = await _context.Users.FindAsync(int.Parse(userId));
            if (user == null)
                return NotFound(new { message = "Usuário não encontrado." });

            // Só valida senha se estiver tentando alterar
            if (!string.IsNullOrWhiteSpace(dto.NewPassword))
            {
                if (string.IsNullOrWhiteSpace(dto.CurrentPassword))
                    return BadRequest(new { message = "Senha atual é obrigatória para alterar a senha." });

                if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
                    return BadRequest(new { message = "Senha atual incorreta." });

                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            }

            // Atualiza outros campos se fornecidos
            if (!string.IsNullOrWhiteSpace(dto.Name)) user.Name = dto.Name;
            if (!string.IsNullOrWhiteSpace(dto.Email)) user.Email = dto.Email;
            if (!string.IsNullOrWhiteSpace(dto.Cpf)) user.Cpf = dto.Cpf;
            if (!string.IsNullOrWhiteSpace(dto.Telefone)) user.Telefone = dto.Telefone;

            try
            {
                _context.Users.Update(user);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Perfil atualizado com sucesso!",
                    user = new
                    {
                        user.Name,
                        user.Email,
                        user.Cpf,
                        user.Telefone
                    }
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Erro ao atualizar perfil: " + ex.Message });
            }
        }

        [Authorize]
        [HttpDelete("deletar-conta")]
        public async Task<IActionResult> DeletarConta([FromBody] DeleteAccountDto dto)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { message = "Usuário não autenticado." });

                var user = await _context.Users.FindAsync(int.Parse(userId));
                if (user == null)
                    return NotFound(new { message = "Usuário não encontrado." });

                // Valida a senha antes de permitir a exclusão
                if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                    return BadRequest(new { message = "Senha incorreta. Por favor, confirme sua senha." });

                // Remove registros relacionados (ajuste conforme suas tabelas)
                var resumos = await _context.Resumos.Where(r => r.UserId == user.Id).ToListAsync();
                var simulados = await _context.Simulados.Where(s => s.Resumo.UserId == user.Id).ToListAsync();
                var assinaturas = await _context.Assinaturas.Where(a => a.UserId == user.Id).ToListAsync();

                _context.Resumos.RemoveRange(resumos);
                _context.Simulados.RemoveRange(simulados);
                _context.Assinaturas.RemoveRange(assinaturas);
                _context.Users.Remove(user);

                await _context.SaveChangesAsync();

                return Ok(new { message = "Conta excluída com sucesso." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Erro ao excluir conta: " + ex.Message });
            }
        }
    }
}
