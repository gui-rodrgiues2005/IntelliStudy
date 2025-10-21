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
                return Unauthorized("Usuário não encontrado.");
            }

            if (!_planoService.PodeGerarResumo(user))
            {
                return Forbid("Limite diário de resumos atingido para o plano atual.");
            }

            if (string.IsNullOrWhiteSpace(requestDto.Topico))
            {
                return BadRequest("O tópico não pode estar vazio.");
            }

            // 1. Criar o pedido para a fila
            var novoPedido = new GenerationRequest
            {
                UserId = userId,
                Tipo = GenerationType.Resumo, // Define o tipo de geração
                Status = RequestStatus.Pendente, // Status inicial
                InputTexto = requestDto.Topico, // O tópico a ser resumido
                CreatedAt = DateTime.UtcNow
            };

            _context.GenerationRequests.Add(novoPedido);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                actionName: "GetStatusDoPedido",
                controllerName: "Generation",
                routeValues: new { id = novoPedido.Id },
                value: new { requestId = novoPedido.Id }
            );
        }

        [HttpPost("resumo-file")]
        public async Task<IActionResult> ResumirArquivo(IFormFile file)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var user = await _planoService.GetUserAsync(userId);

            if (user == null)
                return Unauthorized("Usuário não encontrado.");

            if (!_planoService.PodeGerarResumo(user))
                return Forbid("Limite diário de resumos atingido para o plano atual.");

            if (file == null || file.Length == 0)
                return BadRequest("Arquivo inválido.");

            var fileName = Path.GetFileNameWithoutExtension(file.FileName); // 🚨 Pegar o nome do arquivo SEM extensão para o título
            var tempPath = Path.Combine(Path.GetTempPath(), file.FileName);

            // Salvar o arquivo temporariamente
            using (var stream = System.IO.File.Create(tempPath))
            {
                await file.CopyToAsync(stream);
            }

            try
            {
                // 1️⃣ Extrair o texto BRUTO do arquivo (o livro inteiro)
                using var stream = System.IO.File.OpenRead(tempPath);
                IFormFile arquivoFake = new FormFile(stream, 0, stream.Length, null, file.FileName);

                var textoExtraidoBruto = await _geminiService.ExtractTextAsync(arquivoFake);

                if (string.IsNullOrWhiteSpace(textoExtraidoBruto))
                    return BadRequest("Não foi possível extrair texto do arquivo.");

                // 2️⃣ Gerar resumo conciso com a IA (O TEXTO FINAL)
                // Use o texto BRUTO extraído para pedir um resumo
                var resumoConciso = await _geminiService.GenerateSummaryAsync(textoExtraidoBruto);

                // 3️⃣ Criar o registro na tabela de Resumos
                var novoResumo = new Resumo
                {
                    // 🚨 AJUSTE CRÍTICO: 
                    // TopicoOriginal deve ser o título.
                    TopicoOriginal = fileName,

                    // ResumoTexto deve ser o conteúdo resumido.
                    ResumoTexto = resumoConciso,

                    // ⚠️ O texto BRUTO não precisa ser salvo, mas se você precisar:
                    // TextoBrutoDoArquivo = textoExtraidoBruto, 

                    CreatedAt = DateTime.UtcNow,
                    UserId = userId
                };

                _context.Resumos.Add(novoResumo);
                await _context.SaveChangesAsync();

                // 5️⃣ Retornar o resumo pronto
                return Ok(new
                {
                    message = "Resumo gerado com sucesso!",
                    resumo = resumoConciso,
                    titulo = fileName, // Retorne o título também
                    resumoId = novoResumo.Id
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro ao processar arquivo: {ex.Message}");
            }
            finally
            {
                // Apagar arquivo temporário
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
