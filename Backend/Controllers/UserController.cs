using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Backend.Data;
using Backend.Models;
using Backend.DTO;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
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

            bool passwordValid = false;

            try
            {
                string hash = user.PasswordHash;

                if (hash.StartsWith("$2a$"))
                    hash = "$2b$" + hash.Substring(4);

                passwordValid = BCrypt.Net.BCrypt.Verify(dto.Password, hash);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erro ao verificar hash: {ex.Message}");
                return StatusCode(500, "Erro interno ao processar login.");
            }

            if (!passwordValid)
                return Unauthorized("Email ou senha incorretos.");

            if (user.PasswordHash.StartsWith("$2a$"))
            {
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
                await _context.SaveChangesAsync();
            }

            // Gera token JWT
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

            // Gera refresh token
            string GenerateRefreshToken()
            {
                var randomNumber = new byte[64];
                using var rng = RandomNumberGenerator.Create();
                rng.GetBytes(randomNumber);
                return Convert.ToBase64String(randomNumber);
            }

            var refreshToken = GenerateRefreshToken();
            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(30);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                token = tokenString,
                refreshToken,
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

        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken([FromBody] TokenRequestDto tokenRequest)
        {
            if (tokenRequest is null)
                return BadRequest("Requisição inválida.");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.RefreshToken == tokenRequest.RefreshToken);
            if (user == null || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
                return Unauthorized("Refresh token inválido ou expirado.");

            // Verifica se o token e o refresh pertencem ao mesmo usuário
            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtToken = tokenHandler.ReadJwtToken(tokenRequest.Token);
            var userId = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

            if (userId == null || user.Id.ToString() != userId)
                return Unauthorized("Token e RefreshToken não correspondem ao mesmo usuário.");

            // Gera novo JWT
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

            var newJwt = tokenHandler.CreateToken(tokenDescriptor);
            var jwtString = tokenHandler.WriteToken(newJwt);

            // Atualiza refresh token
            string GenerateRefreshToken()
            {
                var randomNumber = new byte[64];
                using var rng = RandomNumberGenerator.Create();
                rng.GetBytes(randomNumber);
                return Convert.ToBase64String(randomNumber);
            }

            user.RefreshToken = GenerateRefreshToken();
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(30);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                token = jwtString,
                refreshToken = user.RefreshToken
            });
        }
        // [HttpPost("update-password")]
        // public async Task<IActionResult> UpdatePassword([FromBody] UpdatePasswordDto dto)
        // {
        //     var user = await _context.Users.FirstOrDefaultAsync(u =>
        //         u.Id == dto.UserId || u.Email == dto.Email);

        //     if (user == null)
        //         return NotFound("Usuário não encontrado.");

        //     bool valid = false;
        //     try
        //     {
        //         valid = BCrypt.Net.BCrypt.Verify(dto.OldPassword, user.PasswordHash);
        //     }
        //     catch
        //     {
        //         valid = false;
        //     }

        //     if (!valid)
        //         return Unauthorized("Senha antiga incorreta.");

        //     user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        //     user.NeedsPasswordUpdate = false;
        //     await _context.SaveChangesAsync();

        //     return Ok("Senha atualizada com sucesso.");
        // }


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
                user.Instagram,
                user.GitHub,
                user.Linkedin,
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
                user.Instagram,
                user.Linkedin,
                user.GitHub,
                user.UltimoPagamento,
                user.Ativo
            });
        }

        // Atualizando dados do usuário e retornando assinatura também
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

            if (!string.IsNullOrWhiteSpace(dto.NewPassword))
            {
                if (string.IsNullOrWhiteSpace(dto.CurrentPassword))
                    return BadRequest(new { message = "Senha atual é obrigatória para alterar a senha." });

                bool currentPasswordValid = BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash);
                if (!currentPasswordValid)
                    return BadRequest(new { message = "Senha atual incorreta." });

                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            }

            // Atualiza outros campos se fornecidos
            if (!string.IsNullOrWhiteSpace(dto.Email)) user.Email = dto.Email;
            if (!string.IsNullOrWhiteSpace(dto.Cpf)) user.Cpf = dto.Cpf;
            if (!string.IsNullOrWhiteSpace(dto.Telefone)) user.Telefone = dto.Telefone;
            if (!string.IsNullOrWhiteSpace(dto.Instagram)) user.Instagram = dto.Instagram;
            if (!string.IsNullOrWhiteSpace(dto.Linkedin)) user.Linkedin = dto.Linkedin;
            if (!string.IsNullOrWhiteSpace(dto.GitHub)) user.GitHub = dto.GitHub;

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
                        user.Telefone,
                        user.Instagram,
                        user.Linkedin,
                        user.GitHub,
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
