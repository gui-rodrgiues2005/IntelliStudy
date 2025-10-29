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

        private readonly string[] NomesProibidos = new string[]
    {
        "xxx", "porn", "porno", "sex", "sexo", "nude", "nudes", "boobs", "tetas", "peitos", "puta", "foda", "fuck", "shit", "bitch", "slut", "cock", "dick", "pussy", "ass", "boobies",
            "merda", "caralho", "cu", "burro", "idiota", "estupido", "imbecil", "otario", "babaca", "viado", "gayzinho", "gay", "retard", "bastard", "moron",
            "admin", "moderator", "mod", "staff", "god", "root", "null", "undefined", "test", "teste", "user", "guest", "anonymous", "anon", "bot", "robot",
            "noob", "hacker", "loli", "pedo", "pedophile", "pedofilo", "incest", "incestuoso", "kill", "murder", "terror", "fuckboy", "fuckgirl",
            "p0rn", "x0x", "s3x", "f0d4", "b1tch", "c0ck", "d1ck", "pu55y"
    };

        private async Task<(bool valido, string mensagem)> ValidarNomeAsync(string nome, int? usuarioId = null)
        {
            if (string.IsNullOrWhiteSpace(nome))
                return (false, "Nome não pode ser vazio.");

            string nomeNormalizado = nome.Trim().ToLower();

            // 1️⃣ Verifica nomes proibidos
            if (NomesProibidos.Contains(nomeNormalizado))
                return (false, "Nome não permitido.");

            // 2️⃣ Verifica duplicação
            bool existe = await _context.Users
                .AnyAsync(u => u.Name.ToLower() == nomeNormalizado && u.Id != usuarioId);

            if (existe)
                return (false, "Nome já está em uso.");

            // 3️⃣ Verifica caracteres inválidos (somente letras e números, opcional)
            if (!System.Text.RegularExpressions.Regex.IsMatch(nome, @"^[a-zA-Z0-9 ]+$"))
                return (false, "Nome contém caracteres inválidos.");

            return (true, null);
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            // Validar nome
            var (valido, mensagem) = await ValidarNomeAsync(dto.Name);
            if (!valido) return BadRequest(mensagem);

            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                return BadRequest("Email já cadastrado.");

            var user = new User
            {
                Name = dto.Name.Trim(),
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
            if (user == null)
                return Unauthorized("Email ou senha incorretos.");

            bool passwordValid;
            bool isLegacyHash = false;

            try
            {
                passwordValid = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
            }
            catch (BCrypt.Net.SaltParseException)
            {
                // Hash antigo detectado
                isLegacyHash = true;
                passwordValid = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash, true);
            }

            if (!passwordValid)
                return Unauthorized("Email ou senha incorretos.");

            // Se hash antigo e usuário ainda não atualizou, sinaliza para frontend
            if (isLegacyHash && !user.NeedsPasswordUpdate)
            {
                user.NeedsPasswordUpdate = true;
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    requiresPasswordUpdate = true,
                    message = "Por questões de segurança, precisamos que você confirme sua senha."
                });
            }

            // Caso hash antigo, mas já atualizado, rehash normal
            if (passwordValid && user.PasswordHash.StartsWith("$2a$"))
            {
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
                await _context.SaveChangesAsync();
            }

            // 🔹 Gera token JWT normalmente
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
                    user.NeedsPasswordUpdate,
                    PlanoExpiraEm = user.PlanoExpiraEm?.ToString("yyyy-MM-ddTHH:mm:ssZ")
                }
            });
        }

        [HttpPost("update-password")]
        public async Task<IActionResult> UpdatePassword([FromBody] UpdatePasswordDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == dto.UserId);
            if (user == null)
                return NotFound();

            // Valida senha antiga (legacy mode se necessário)
            bool valid = false;
            try
            {
                valid = BCrypt.Net.BCrypt.Verify(dto.OldPassword, user.PasswordHash);
            }
            catch (BCrypt.Net.SaltParseException)
            {
                valid = BCrypt.Net.BCrypt.Verify(dto.OldPassword, user.PasswordHash, true);
            }

            if (!valid)
                return Unauthorized("Senha incorreta.");

            // Salva nova senha
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            user.NeedsPasswordUpdate = false; // remove o flag
            await _context.SaveChangesAsync();

            return Ok("Senha atualizada com sucesso.");
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

            if (!string.IsNullOrWhiteSpace(dto.Name))
            {
                var (valido, mensagem) = await ValidarNomeAsync(dto.Name, user.Id);
                if (!valido) return BadRequest(new { message = mensagem });

                user.Name = dto.Name.Trim();
            }

            // Só valida senha se estiver tentando alterar
            if (!string.IsNullOrWhiteSpace(dto.NewPassword))
            {
                if (string.IsNullOrWhiteSpace(dto.CurrentPassword))
                    return BadRequest(new { message = "Senha atual é obrigatória para alterar a senha." });

                bool currentPasswordValid;
                try
                {
                    currentPasswordValid = BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash);
                }
                catch (BCrypt.Net.SaltParseException)
                {
                    currentPasswordValid = false;
                }

                if (!currentPasswordValid)
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
                bool deletePasswordValid;
                try
                {
                    deletePasswordValid = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
                }
                catch (BCrypt.Net.SaltParseException)
                {
                    deletePasswordValid = false;
                }

                if (!deletePasswordValid)
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
