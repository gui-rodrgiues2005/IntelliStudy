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
        public ResumoController(AppDbContext context, GeminiService geminiService, PlanoService planoService)
        {
            _context = context;
            _geminiService = geminiService;
            _planoService = planoService;

        }

        // POST: api/resumo/gerar
        [HttpPost("gerar")]
        public async Task<IActionResult> EnfileirarGeracaoResumo([FromBody] GerarResumoRequestDto requestDto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var user = await _planoService.GetUserAsync(userId);

            if (user == null)
            {
                return Unauthorized(new
                {
                    success = false,
                    message = "Usuário não encontrado. Faça login novamente."
                });
            }

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


            if (string.IsNullOrWhiteSpace(requestDto.Topico))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "O tópico não pode estar vazio."
                });
            }

            // ✅ Criar o pedido para a fila
            var novoPedido = new GenerationRequest
            {
                UserId = userId,
                Tipo = GenerationType.Resumo,
                Status = RequestStatus.Pendente,
                InputTexto = requestDto.Topico,
                CreatedAt = DateTime.UtcNow
            };

            _context.GenerationRequests.Add(novoPedido);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                actionName: "GetStatusDoPedido",
                controllerName: "Generation",
                routeValues: new { id = novoPedido.Id },
                value: new
                {
                    success = true,
                    message = "Resumo adicionado à fila com sucesso!",
                    requestId = novoPedido.Id
                }
            );
        }


        [HttpPost("resumo-file")]
        public async Task<IActionResult> ResumirArquivo(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Arquivo inválido.");

            var tempFileName = $"{Guid.NewGuid()}_{file.FileName}";
            var tempPath = Path.Combine(Path.GetTempPath(), tempFileName);

            // Salvar temporariamente
            using (var writeStream = System.IO.File.Create(tempPath))
            {
                await file.CopyToAsync(writeStream);
            }

            try
            {
                // Ler arquivo para processar
                using (var readStream = System.IO.File.OpenRead(tempPath))
                {
                    IFormFile arquivoFake = new FormFile(readStream, 0, readStream.Length, null, file.FileName);

                    // Extrair texto
                    var textoExtraidoBruto = await _geminiService.ExtractTextAsync(arquivoFake);
                    if (string.IsNullOrWhiteSpace(textoExtraidoBruto))
                        return BadRequest("Não foi possível extrair texto do arquivo.");

                    // Gerar resumo
                    var resumoConciso = await _geminiService.GenerateSummaryAsync(textoExtraidoBruto);

                    // Criar registro no banco
                    var novoResumo = new Resumo
                    {
                        TopicoOriginal = Path.GetFileNameWithoutExtension(file.FileName),
                        ResumoTexto = resumoConciso,
                        CreatedAt = DateTime.UtcNow,
                        UserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier))
                    };

                    _context.Resumos.Add(novoResumo);
                    await _context.SaveChangesAsync();

                    // Retornar JSON com o resumo
                    return Ok(new
                    {
                        message = "Resumo gerado com sucesso!",
                        resumo = resumoConciso,
                        titulo = file.FileName,
                        resumoId = novoResumo.Id
                    });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro ao processar arquivo: {ex.Message}");
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

            // Busca no banco todos os resumos do usuário logado.
            // Usamos .Select() para criar um DTO (Data Transfer Object).
            // Isso é uma ótima prática para não expor o modelo completo do banco
            // e para enviar apenas os dados necessários (otimização).
            var resumos = await _context.Resumos
                .Where(r => r.UserId == userId)
                .OrderByDescending(r => r.CreatedAt) // Mostra os mais recentes primeiro
                .Select(r => new
                {
                    r.Id,
                    r.TopicoOriginal,
                    r.CreatedAt
                })
                .ToListAsync();

            return Ok(resumos);
        }

        // GET: api/resumo/por-id/5
        [HttpGet("por-id/{resumoId}")]
        public async Task<IActionResult> GetResumo(int resumoId)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            var resumo = await _context.Resumos
                .Where(r => r.Id == resumoId && r.UserId == userId)
                .FirstOrDefaultAsync();

            if (resumo == null)
                return NotFound("Resumo não encontrado.");

            return Ok(new
            {
                resumo = resumo.ResumoTexto,
                topico = resumo.TopicoOriginal,
                resumoId = resumo.Id
            });
        }

        // GET: api/resumo/meus-resumos/5
        [HttpGet("meus-resumos/{id}")]
        public async Task<IActionResult> GetResumoPorId(int id)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            var resumo = await _context.Resumos
                .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);

            if (resumo == null)
                return NotFound("Resumo não encontrado ou não pertence ao usuário.");

            return Ok(resumo);
        }


        // DELETE: api/resumo/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteResumo(int id)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var resumo = await _context.Resumos
                .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);

            if (resumo == null)
            {
                return NotFound("Resumo não encontrado ou não pertence ao usuário.");
            }

            _context.Resumos.Remove(resumo);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
