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
        private readonly StreamingService _streamingService;
        private readonly ILogger<ResumoController> _logger;
        private readonly GenerationManager _manager;
        public ResumoController(
            AppDbContext context,
            GeminiService geminiService,
            PlanoService planoService,
            ConquistaService conquistaService,
            TempoEstudoService tempoEstudoService,
            ILogger<ResumoController> logger,
            StreamingService streamingService,
            GenerationManager manager
            )
        {
            _context = context;
            _geminiService = geminiService;
            _planoService = planoService;
            _conquistaService = conquistaService;
            _tempoEstudoService = tempoEstudoService;
            _streamingService = streamingService;
            _logger = logger;
            _manager = manager;
        }

        // POST: api/resumo/gerar
        [HttpPost("gerar")]
        public async Task<IActionResult> EnfileirarGeracaoResumo([FromBody] GerarResumoRequestDto requestDto)
        {
            //Validar usuário
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

            //Verificar limite do plano
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

            //Validar entrada
            if (string.IsNullOrWhiteSpace(requestDto.Topico))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "O tópico não pode estar vazio."
                });
            }

            //Carregar ou criar conversa
            int conversaId;

            if (requestDto.ConversaId == null)
            {
                var novaConversa = new ChatConversa
                {
                    UserId = userId,
                    Tema = requestDto.Topico.Length > 60 ?
                           requestDto.Topico.Substring(0, 60) + "..." : requestDto.Topico,
                    CreatedAt = DateTime.UtcNow
                };

                _context.ChatConversas.Add(novaConversa);
                await _context.SaveChangesAsync();

                conversaId = novaConversa.Id;
            }
            else
            {
                conversaId = requestDto.ConversaId.Value;
            }

            //Registrar mensagem do usuário
            var msgUser = new ChatMensagem
            {
                ConversaId = conversaId,
                Role = "user",
                Conteudo = requestDto.Topico.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _context.ChatMensagens.Add(msgUser);
            await _context.SaveChangesAsync();

            //Criar pedido para a fila
            var tipo = Enum.TryParse<GenerationType>(requestDto.Tipo, ignoreCase: true, out var parsedTipo)
                ? parsedTipo
                : GenerationType.Resumo;

            var novoPedido = new GenerationRequest
            {
                UserId = userId,
                Tipo = tipo,
                Status = RequestStatus.Pendente,
                InputTexto = requestDto.Topico.Trim(),
                ConversaId = conversaId,
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
                    message = "Conteúdo adicionado à fila com sucesso!",
                    requestId = novoPedido.Id,
                    conversaId = conversaId
                }
            );
        }

        [HttpGet("lista-conversas")]
        public async Task<IActionResult> GetListaConversas()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userIdClaim == null || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Token inválido ou ausente." });
            }

            var conversas = await _context.ChatConversas
                .Where(c => c.UserId == userId)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new
                {
                    c.Id,
                    c.Tema,
                    c.CreatedAt
                })
                .ToListAsync();

            return Ok(conversas);
        }

        [HttpPost("conversas")]
        public async Task<ActionResult<ChatConversa>> CriarConversa()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userIdClaim == null || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Token inválido ou ausente." });
            }

            var conversa = new ChatConversa
            {
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.ChatConversas.Add(conversa);
            await _context.SaveChangesAsync();

            return Ok(conversa);
        }

        [HttpGet("conversas/{conversaId}")]
        public async Task<ActionResult> GetConversaCompleta(int conversaId)
        {
            Console.WriteLine("Fetching conversation with ID: " + conversaId);
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userIdClaim == null || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Token inválido ou ausente." });
            }

            // Buscar conversa garantindo que pertence ao usuário
            var conversa = await _context.ChatConversas
                .FirstOrDefaultAsync(c => c.Id == conversaId && c.UserId == userId);

            if (conversa == null)
                return NotFound(new { message = "Conversa não encontrada." });

            // Buscar mensagens da conversa
            var mensagens = await _context.ChatMensagens
                .Where(m => m.ConversaId == conversaId)
                .OrderBy(m => m.CreatedAt)
                .ToListAsync();

            return Ok(new
            {
                conversa,
                mensagens
            });
        }

        // POST: api/resumo/resumo-file
        [HttpPost("resumo-file")]
        public async Task<IActionResult> GerarConteudoDeArquivo([FromForm] UploadRequest request)
        {
            var file = request.File;
            var tipo = string.IsNullOrWhiteSpace(request.Tipo) ? "resumo" : request.Tipo.Trim().ToLower();

            if (file == null || file.Length == 0)
                return BadRequest("Arquivo inválido.");

            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId))
                return Unauthorized("Usuário não autenticado.");

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

                var textoExtraido = await _geminiService.ExtractTextAsync(arquivoFake);

                if (string.IsNullOrWhiteSpace(textoExtraido))
                    return BadRequest("Não foi possível extrair texto do arquivo.");

                // 🔹 Agora usa a função genérica
                var conteudoGerado = await _geminiService.GerarConteudoAsync(textoExtraido, tipo);

                var novoConteudo = new ConteudoIA
                {
                    Tipo = tipo,
                    TopicoOriginal = Path.GetFileNameWithoutExtension(file.FileName),
                    TextoGerado = conteudoGerado,
                    CreatedAt = DateTime.UtcNow,
                    UserId = userId
                };

                _context.ConteudoIAs.Add(novoConteudo);
                await _context.SaveChangesAsync();

                await _tempoEstudoService.RegistrarAtividadeAsync(userId, tipo);

                return Ok(new
                {
                    message = "Conteúdo gerado com sucesso!",
                    conteudo = conteudoGerado,
                    titulo = Path.GetFileNameWithoutExtension(file.FileName),
                    conteudoId = novoConteudo.Id
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao gerar conteúdo de arquivo.");
                return StatusCode(500, new { message = $"Erro ao processar arquivo: {ex.Message}" });
            }
            finally
            {
                if (System.IO.File.Exists(tempPath))
                    System.IO.File.Delete(tempPath);
            }

            return Ok();
        }

        [HttpPost("pause/{id}")]
        public IActionResult Pause(string id)
        {
            _manager.Pause(id);
            return Ok(new { message = "Pausado." });
        }

        [HttpPost("resume/{id}")]
        public IActionResult Resume(string id)
        {
            _manager.Resume(id);
            return Ok(new { message = "Continuação iniciada." });
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

        // // GET: api/resumo/por-id/{resumoId}
        // [HttpGet("por-id/{resumoId}")]
        // public async Task<IActionResult> GetResumo(int resumoId)
        // {
        //     var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

        //     var resumo = await _context.ConteudoIAs
        //         .Where(c => c.Id == resumoId && c.UserId == userId)
        //         .FirstOrDefaultAsync();

        //     if (resumo == null)
        //         return NotFound("Conteudo não encontrado.");

        //     return Ok(new
        //     {
        //         conteudo = resumo.TextoGerado,
        //         topico = resumo.TopicoOriginal,
        //         conteudoid = resumo.Id
        //     });
        // }

        // GET: api/resumo/meus-resumos/{id}
        [HttpGet("meus-resumos/{resumoid}")]
        public async Task<IActionResult> GetResumoPorId(int resumoid)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            var resumo = await _context.ConteudoIAs
                .FirstOrDefaultAsync(c => c.Id == resumoid && c.UserId == userId);

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

        [HttpPost("chat/enviar")]
        public async Task<IActionResult> EnviarPergunta([FromBody] ChatPerguntaDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            if (string.IsNullOrWhiteSpace(dto.Pergunta))
                return BadRequest("Pergunta não pode ser vazia.");

            // Envia para a IA
            var resposta = await _geminiService.GerarConteudoAsync(dto.Pergunta, "chat");

            // Salva registro no ConteudoIA
            var registro = new ConteudoIA
            {
                Tipo = "chat",
                TopicoOriginal = dto.Pergunta,
                TextoGerado = resposta,
                CreatedAt = DateTime.UtcNow,
                UserId = userId
            };

            _context.ConteudoIAs.Add(registro);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                registro.Id,
                pergunta = registro.TopicoOriginal,
                resposta = registro.TextoGerado,
                createdAt = registro.CreatedAt
            });
        }

        [HttpGet("chat/historico")]
        public async Task<IActionResult> GetHistoricoChat()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            var mensagens = await _context.ConteudoIAs
                .Where(c => c.UserId == userId && c.Tipo == "chat")
                .OrderBy(c => c.CreatedAt)
                .Select(c => new
                {
                    id = c.Id,
                    pergunta = c.TopicoOriginal,
                    resposta = c.TextoGerado,
                    createdAt = c.CreatedAt
                })
                .ToListAsync();

            return Ok(mensagens);
        }
    }
}
