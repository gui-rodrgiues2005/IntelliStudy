// Em Backend/Controllers/PlanoDeEstudoController.cs

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Backend.Data;
using Backend.DTO;
using Backend.Models;
using System.Text.Json;
using Backend.Services;

[ApiController]
[Route("api/plano-de-estudo")]
[Authorize]
public class PlanoDeEstudoController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly GeminiService _geminiService; // Supondo que você o injete
    private readonly PlanoService _planoService;

    public PlanoDeEstudoController(AppDbContext context, GeminiService geminiService, PlanoService planoService)
    {
        _context = context;
        _geminiService = geminiService;
        _planoService = planoService;
    }

    // ENDPOINT 1: Gerar um novo plano de estudos
    // Em Backend/Controllers/PlanoDeEstudoController.cs

    // ... (usings e declaração da classe)
    // Em Backend/Controllers/PlanoDeEstudoController.cs

    // SUBSTITUA O MÉTODO "GerarPlano" POR ESTE:
    [HttpPost("gerar")]
    public async Task<IActionResult> EnfileirarGeracaoPlano([FromBody] CriarPlanoRequestDto request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
        var user = await _planoService.GetUserAsync(userId);

        if (user == null)
        {
            return Unauthorized("Usuário não encontrado.");
        }

        if (!_planoService.PodeCriarPlanoDeEstudo(user))
        {
            return Forbid("Limite diário de planos de estudo atingido para o plano atual.");
        }


        // Validação básica dos dados de entrada
        if (string.IsNullOrWhiteSpace(request.Meta) || request.Materias == null || !request.Materias.Any())
        {
            return BadRequest("Meta e matérias são campos obrigatórios.");
        }

        // 1. Criar o pedido para a fila
        // Serializamos o objeto de request completo para guardar todo o contexto necessário.
        var inputJson = JsonSerializer.Serialize(request);

        var novoPedido = new GenerationRequest
        {
            UserId = userId,
            Tipo = GenerationType.PlanoDeEstudo, // Nosso novo tipo de geração!
            Status = RequestStatus.Pendente,
            InputTexto = inputJson, // Guardamos o request completo como JSON
            CreatedAt = DateTime.UtcNow
        };

        // 2. Adicionar o pedido à tabela de fila e salvar
        _context.GenerationRequests.Add(novoPedido);
        await _context.SaveChangesAsync();

        // 3. Retornar o ID do pedido para o frontend poder consultar o status
        return CreatedAtAction(
            actionName: "GetStatusDoPedido",
            controllerName: "Generation",
            routeValues: new { id = novoPedido.Id },
            value: new { requestId = novoPedido.Id }
        );
    }

    // ENDPOINT 2: Buscar o plano de estudos ativo do usuário
    [HttpGet("ativo")]
    public async Task<IActionResult> GetPlanoAtivo()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

        var plano = await _context.PlanosDeEstudo
            .Include(p => p.Sessoes) // Inclui as sessões de estudo
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefaultAsync();

        if (plano == null)
        {
            return NotFound("Nenhum plano de estudos encontrado.");
        }

        // Mapeia o plano do banco para o DTO que o frontend espera
        var planoDto = MapearPlanoParaDto(plano);

        return Ok(planoDto);
    }

    // ENDPOINT 3: Marcar uma sessão como concluída
    [HttpPost("sessao/{sessaoId}/concluir")]
    public async Task<IActionResult> ConcluirSessao(int sessaoId)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

        var sessao = await _context.SessoesDeEstudo
            .Include(s => s.PlanoDeEstudo) // Inclui o plano para verificar o dono
            .FirstOrDefaultAsync(s => s.Id == sessaoId);

        if (sessao == null || sessao.PlanoDeEstudo.UserId != userId)
        {
            return Forbid("Sessão não encontrada ou não pertence ao usuário.");
        }

        sessao.Concluida = true;
        await _context.SaveChangesAsync();

        return Ok();
    }

    // Método para mapear o modelo do banco para o DTO do frontend
    private PlanoDeEstudoDto MapearPlanoParaDto(PlanoDeEstudo plano)
    {
        var cronograma = new List<DiaEstudoDto>();
        var diasDaSemana = new[] { "DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO" };

        for (int i = 0; i < 7; i++)
        {
            var diaDto = new DiaEstudoDto
            {
                DiaDaSemana = i,
                NomeDia = diasDaSemana[i],
                Sessoes = plano.Sessoes
                    .Where(s => s.DiaDaSemana == i)
                    .Select(s => new SessaoEstudoDto
                    {
                        Id = s.Id,
                        Topico = s.Topico,
                        DuracaoMinutos = s.DuracaoMinutos,
                        Concluida = s.Concluida
                    }).ToList()
            };
            cronograma.Add(diaDto);
        }

        return new PlanoDeEstudoDto
        {
            Id = plano.Id,
            Meta = plano.Meta,
            CreatedAt = plano.CreatedAt,
            CronogramaSemanal = cronograma
        };
    }
    // POST: api/plano-de-estudo/{id}/concluir-plano
    [HttpPost("{id}/concluir-plano")]
    public async Task<IActionResult> MarcarPlanoComoConcluido(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
        var plano = await _context.PlanosDeEstudo
            .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);

        if (plano == null)
        {
            return NotFound("Plano não encontrado ou não pertence ao usuário.");
        }

        plano.Concluido = true;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Plano marcado como concluído com sucesso." });
    }

    // GET: api/plano-de-estudo/concluidos
    // Em Backend/Controllers/PlanoDeEstudoController.cs




    [HttpGet("concluidos")]
    public async Task<IActionResult> GetPlanosConcluidos()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

        var planosConcluidos = await _context.PlanosDeEstudo
            .Include(p => p.Sessoes)
            .Where(p => p.UserId == userId && p.Concluido)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new
            {
                p.Id,
                p.Meta,
                p.CreatedAt,
                TotalSessoes = p.Sessoes.Count()
            })
            .ToListAsync();

        return Ok(planosConcluidos);
    }
}
