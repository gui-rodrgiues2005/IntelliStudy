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

        // [HttpPost("resumo-file")]
        // public async Task<IActionResult> ResumirArquivo(IFormFile file)
        // {
        //     var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
        //     var user = await _planoService.GetUserAsync(userId);

        //     if (user == null)
        //         return Unauthorized("Usuário não encontrado.");

        //     if (!_planoService.PodeGerarResumo(user))
        //         return Forbid("Limite diário de resumos atingido para o plano atual.");

        //     if (file == null || file.Length == 0)
        //         return BadRequest("Arquivo inválido.");

        //     // Guarda o nome original do arquivo
        //     var fileName = Path.GetFileName(file.FileName);

        //     // Salva na pasta temporária mantendo a extensão original
        //     var tempPath = Path.Combine(Path.GetTempPath(), fileName);
        //     using (var stream = System.IO.File.Create(tempPath))
        //     {
        //         await file.CopyToAsync(stream);
        //     }

        //     // Cria o pedido no banco
        //     var novoPedido = new GenerationRequest
        //     {
        //         UserId = userId,
        //         Tipo = GenerationType.Resumo,
        //         Status = RequestStatus.Pendente,
        //         InputArquivo = tempPath,
        //         InputArquivoOriginal = fileName, // novo campo para o worker saber a extensão
        //         CreatedAt = DateTime.UtcNow
        //     };

        //     _context.GenerationRequests.Add(novoPedido);
        //     await _context.SaveChangesAsync();

        //     // Processa em background
        //     _ = Task.Run(async () =>
        //     {
        //         try
        //         {
        //             // Use o arquivo salvo com a extensão correta
        //             using var stream = System.IO.File.OpenRead(tempPath);
        //             IFormFile arquivoFake = new FormFile(stream, 0, stream.Length, null, fileName);

        //             var textoExtraido = await _geminiService.ExtractTextAsync(arquivoFake);
        //             var resumo = await _geminiService.GerarResumoAsync(textoExtraido);

        //             novoPedido.OutputTexto = resumo;
        //             novoPedido.Status = RequestStatus.Concluido;
        //             novoPedido.ProcessedAt = DateTime.UtcNow;
        //             await _context.SaveChangesAsync();
        //         }
        //         catch (Exception ex)
        //         {
        //             novoPedido.Status = RequestStatus.Falhou;
        //             novoPedido.MensagemErro = ex.Message;
        //             await _context.SaveChangesAsync();
        //         }
        //     });

        //     return CreatedAtAction(
        //         actionName: "GetStatusDoPedido",
        //         controllerName: "Generation",
        //         routeValues: new { id = novoPedido.Id },
        //         value: new { requestId = novoPedido.Id }
        //     );
        // }

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

        // GET: api/resumo/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetResumoPorId(int id)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            // Busca um resumo específico, mas garante que ele pertence ao usuário logado.
            // Isso impede que um usuário acesse o resumo de outro pela URL.
            var resumo = await _context.Resumos
                .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);

            if (resumo == null)
            {
                return NotFound("Resumo não encontrado ou não pertence ao usuário.");
            }

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
