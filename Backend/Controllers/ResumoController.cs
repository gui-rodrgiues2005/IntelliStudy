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
    public class ConteudoController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly GeminiService _geminiService;
        private readonly PlanoService _planoService;
        private readonly ConquistaService _conquistaService;
        private readonly TempoEstudoService _tempoEstudoService;
        public ConteudoController(AppDbContext context, GeminiService geminiService, PlanoService planoService, ConquistaService conquistaService, TempoEstudoService tempoEstudoService)
        {
            _context = context;
            _geminiService = geminiService;
            _planoService = planoService;
            _conquistaService = conquistaService;
            _tempoEstudoService = tempoEstudoService;
        }

        // POST: api/resumo/gerar
        // POST: api/resumo/gerar
        [HttpPost("gerar")]
        [HttpPost("/api/resumo/gerar")]
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
                    sugestao = "Assine o plano Premium e gere conteudos ilimitados!",
                    planoAtual = user.Plano,
                    limiteDiario = 5 // Esse valor poderia vir do serviço de plano para maior flexibilidade
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
            // Registrar início da atividade
            var novaAtividade = new AtividadeUsuario
            {
                UserId = userId,
                Tipo = tipo.ToString(),
                DataInicio = DateTime.UtcNow,
                DiaDaSemana = (int)DateTime.UtcNow.DayOfWeek
            };

            await _tempoEstudoService.RegistrarAtividadeAsync(userId, tipo.ToString());


            // 5️⃣ Retornar sucesso
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


        [HttpPost("resumo-file")]
        public async Task<IActionResult> ResumirArquivo(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Arquivo inválido.");

            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            // 🔹 Caminho temporário seguro
            var tempFileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
            var tempPath = Path.Combine(Path.GetTempPath(), tempFileName);

            try
            {
                // 🔹 Salvar o arquivo temporariamente
                await using (var writeStream = System.IO.File.Create(tempPath))
                {
                    await file.CopyToAsync(writeStream);
                }

                // 🔹 Ler o arquivo novamente para extrair texto
                await using var readStream = System.IO.File.OpenRead(tempPath);
                var arquivoFake = new FormFile(readStream, 0, readStream.Length, null, file.FileName);

                // 🔹 Extrair texto com o GeminiService
                var textoExtraidoBruto = await _geminiService.ExtractTextAsync(arquivoFake);
                if (string.IsNullOrWhiteSpace(textoExtraidoBruto))
                    return BadRequest("Não foi possível extrair texto do arquivo.");

                // 🔹 Gerar resumo
                var conteudoConciso = await _geminiService.GenerateSummaryAsync(textoExtraidoBruto);

                // 🔹 Criar registro no banco
                var novoResumo = new ConteudoIA
                {
                    TopicoOriginal = Path.GetFileNameWithoutExtension(file.FileName),
                    TextoGerado = conteudoConciso,
                    CreatedAt = DateTime.UtcNow,
                    UserId = userId
                };

                _context.ConteudoIAs.Add(novoResumo);
                await _context.SaveChangesAsync();

                // 🔹 Registrar atividade e tempo de estudo
                await _tempoEstudoService.RegistrarAtividadeAsync(userId, "Resumo");

                // 🔹 Retornar JSON com o resumo
                return Ok(new
                {
                    message = "Conteúdo gerado com sucesso!",
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
                // 🔹 Garante que o arquivo temporário seja apagado
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
            var conteudos = await _context.ConteudoIAs
                .Where(r => r.UserId == userId)
                .OrderByDescending(r => r.CreatedAt) // Mostra os mais recentes primeiro
                .Select(r => new
                {
                    r.Id,
                    r.TopicoOriginal,
                    r.CreatedAt
                })
                .ToListAsync();

            return Ok(conteudos);
        }

        // GET: api/resumo/por-id/5
        [HttpGet("por-id/{resumoId}")]
        public async Task<IActionResult> GetResumo(int resumoId)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            var conteudo = await _context.ConteudoIAs
                .Where(c => c.Id == resumoId && c.UserId == userId)
                .FirstOrDefaultAsync();

            if (conteudo == null)
                return NotFound("Conteudo não encontrado.");

            return Ok(new
            {
                conteudo = conteudo.TextoGerado,
                topico = conteudo.TopicoOriginal,
                conteudoid = conteudo.Id
            });
        }

        // GET: api/resumo/meus-resumos/5
        [HttpGet("meus-resumos/{id}")]
        public async Task<IActionResult> GetConteudoPorId(int id)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            var conteudo = await _context.ConteudoIAs
                .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

            if (conteudo == null)
                return NotFound("Conteudo não encontrado ou não pertence ao usuário.");

            return Ok(conteudo);
        }


        // DELETE: api/resumo/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteResumo(int id)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var conteudo = await _context.ConteudoIAs
                .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

            if (conteudo == null)
            {
                return NotFound("Conteudo não encontrado ou não pertence ao usuário.");
            }

            _context.ConteudoIAs.Remove(conteudo);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
