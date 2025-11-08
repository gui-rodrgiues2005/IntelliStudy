using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Backend.Data;
using Backend.DTO;
using Backend.Models;
using Backend.Services;
using System.Text.Json;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ResumoController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly GeminiService _geminiService;
        private readonly PlanoService _planoService;
        private readonly ConquistaService _conquistaService;
        private readonly TempoEstudoService _tempoEstudoService;

        public ResumoController(
            AppDbContext context,
            GeminiService geminiService,
            PlanoService planoService,
            ConquistaService conquistaService,
            TempoEstudoService tempoEstudoService)
        {
            _context = context;
            _geminiService = geminiService;
            _planoService = planoService;
            _conquistaService = conquistaService;
            _tempoEstudoService = tempoEstudoService;
        }

        // POST: api/resumo/gerar
        [HttpPost("gerar")]
        public async Task<IActionResult> EnfileirarGeracaoResumo([FromBody] GerarResumoRequestDto requestDto)
        {
            // 1️⃣ Validar usuário
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new
                {
                    success = false,
                    message = "Usuário não autenticado. Faça login novamente."
                });
            }

            var user = await _planoService.GetUserAsync(userId);
            if (user == null)
            {
                return Unauthorized(new
                {
                    success = false,
                    message = "Usuário não encontrado. Faça login novamente."
                });
            }

            // 2️⃣ Verificar limite do plano
            if (!_planoService.PodeGerarResumo(user))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    success = false,
                    message = "Limite diário de resumos atingido para o plano atual.",
                    sugestao = "Assine o plano Premium e gere resumos ilimitados!",
                    planoAtual = user.Plano,
                    limiteDiario = 5
                });
            }

            // 3️⃣ Validar entrada
            if (string.IsNullOrWhiteSpace(requestDto.Topico))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "O tópico não pode estar vazio."
                });
            }

            // 4️⃣ Criar pedido para a fila
            var tipo = Enum.TryParse<GenerationType>(requestDto.Tipo, ignoreCase: true, out var parsedTipo)
                ? parsedTipo
                : GenerationType.Resumo;

            var novoPedido = new GenerationRequest
            {
                UserId = userId,
                Tipo = tipo,
                Status = RequestStatus.Pendente,
                InputTexto = requestDto.Topico.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _context.GenerationRequests.Add(novoPedido);
            await _context.SaveChangesAsync();

            await _conquistaService.CalcularConquistasAsync(userId, user.Plano == "Premium");

            await _tempoEstudoService.RegistrarAtividadeAsync(userId, tipo.ToString());

            return CreatedAtAction(
                actionName: "GetStatusDoPedido",
                controllerName: "Generation",
                routeValues: new { id = novoPedido.Id },
                value: new
                {
                    success = true,
                    message = "Conteudo adicionado à fila com sucesso!",
                    requestId = novoPedido.Id
                }
            );
        }

        // POST: api/resumo/resumo-file
        [HttpPost("resumo-file")]
        public async Task<IActionResult> ResumirArquivo(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Arquivo inválido.");

            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var tempFileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
            var tempPath = Path.Combine(Path.GetTempPath(), tempFileName);

            try
            {
                await using (var writeStream = System.IO.File.Create(tempPath))
                {
                    await file.CopyToAsync(writeStream);
                }

                await using var readStream = System.IO.File.OpenRead(tempPath);
                var arquivoFake = new FormFile(readStream, 0, readStream.Length, null, file.FileName);

                var textoExtraidoBruto = await _geminiService.ExtractTextAsync(arquivoFake);
                if (string.IsNullOrWhiteSpace(textoExtraidoBruto))
                    return BadRequest("Não foi possível extrair texto do arquivo.");

                var conteudoConciso = await _geminiService.GenerateSummaryAsync(textoExtraidoBruto);

                var novoResumo = new ConteudoIA
                {
                    TopicoOriginal = Path.GetFileNameWithoutExtension(file.FileName),
                    TextoGerado = conteudoConciso,
                    CreatedAt = DateTime.UtcNow,
                    UserId = userId
                };

                _context.ConteudoIAs.Add(novoResumo);
                await _context.SaveChangesAsync();

                await _tempoEstudoService.RegistrarAtividadeAsync(userId, "Resumo");

                return Ok(new
                {
                    message = "Conteudo gerado com sucesso!",
                    resumo = conteudoConciso,
                    titulo = Path.GetFileNameWithoutExtension(file.FileName),
                    resumoId = novoResumo.Id
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Erro ao processar arquivo: {ex.Message}" });
            }
            finally
            {
                if (System.IO.File.Exists(tempPath))
                    System.IO.File.Delete(tempPath);
            }
        }

        // GET: api/resumo
        [HttpGet]
        public async Task<IActionResult> GetResumosDoUsuario()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            var resumos = await _context.ConteudoIAs
                .Where(r => r.UserId == userId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.Id,
                    r.TopicoOriginal,
                    r.CreatedAt
                })
                .ToListAsync();

            return Ok(resumos);
        }

        // GET: api/resumo/por-id/{resumoId}
        [HttpGet("por-id/{resumoId}")]
        public async Task<IActionResult> GetResumo(int resumoId)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            var resumo = await _context.ConteudoIAs
                .Where(c => c.Id == resumoId && c.UserId == userId)
                .FirstOrDefaultAsync();

            if (resumo == null)
                return NotFound("Conteudo não encontrado.");

            return Ok(new
            {
                conteudo = resumo.TextoGerado,
                topico = resumo.TopicoOriginal,
                conteudoid = resumo.Id
            });
        }

        // GET: api/resumo/meus-resumos/{id}
        [HttpGet("meus-resumos/{id}")]
        public async Task<IActionResult> GetResumoPorId(int id)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            var resumo = await _context.ConteudoIAs
                .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

            if (resumo == null)
                return NotFound("Conteudo não encontrado ou não pertence ao usuário.");

            return Ok(resumo);
        }

        // DELETE: api/resumo/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteResumo(int id)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var resumo = await _context.ConteudoIAs
                .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

            if (resumo == null)
            {
                return NotFound("Conteudo não encontrado ou não pertence ao usuário.");
            }

            _context.ConteudoIAs.Remove(resumo);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
