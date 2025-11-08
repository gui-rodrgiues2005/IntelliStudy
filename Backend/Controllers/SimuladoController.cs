using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.DTO;
using Backend.Models;
using System.Text.Json;
using Backend.Services;

[ApiController]
[Route("api/[controller]")]
public class SimuladoController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly GeminiService _geminiService;

    private readonly PlanoService _planoService;
    private readonly ConquistaService _conquistaService;
    private readonly TempoEstudoService _tempoEstudoService;
    // Construtor modificado
    public SimuladoController(AppDbContext context, GeminiService geminiService, PlanoService planoService, ConquistaService conquistaService, TempoEstudoService tempoEstudoService)
    {
        _context = context;
        _geminiService = geminiService;
        _planoService = planoService;
        _conquistaService = conquistaService;
        _tempoEstudoService = tempoEstudoService;
    }

    // POST: api/simulado/gerar
    // No SimuladoController.cs

    // Em Controllers/SimuladoController.cs (dentro da classe)

    private string ExtrairJsonDaResposta(string respostaDaIA)
    {
        // Tenta encontrar o início de um array JSON '['
        var inicio = respostaDaIA.IndexOf('[');
        // Tenta encontrar o fim de um array JSON ']'
        var fim = respostaDaIA.LastIndexOf(']');

        if (inicio != -1 && fim != -1 && fim > inicio)
        {
            // Se encontrou, extrai apenas o conteúdo entre eles (incluindo os colchetes)
            return respostaDaIA.Substring(inicio, fim - inicio + 1);
        }

        // Se não encontrou um JSON válido, retorna uma string de array vazio
        // para não quebrar o JSON.parse() no frontend.
        return "[]";
    }


    // POST: api/simulado/gerar
    // Em Backend/Controllers/SimuladoController.cs

    // SUBSTITUA O MÉTODO "GerarEGravarSimulado" POR ESTE:
    // Em Backend/Controllers/SimuladoController.cs

    [HttpPost("gerar")]
    public async Task<IActionResult> EnfileirarGeracaoSimulado([FromBody] GerarSimuladoRequestDto requestDto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
        var user = await _planoService.GetUserAsync(userId);

        if (user == null)
            return Unauthorized("Usuário não encontrado.");

        if (!_planoService.PodeGerarSimulado(user))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                success = false,
                message = "Limite diário de simulados atingido para o plano atual.",
                sugestao = "Assine o plano Premium e gere simulados ilimitados!",
                planoAtual = user.Plano,
                limiteDiario = 5
            });
        }

        // 🔍 Tenta encontrar primeiro na tabela de ConteudoIA
        var resumo = await _context.ConteudoIAs
            .FirstOrDefaultAsync(r => r.Id == requestDto.ConteudoId && r.UserId == userId);

        // 🔍 Se não achar, tenta buscar na GenerationRequests (conteúdos diretos)
        GenerationRequest baseRequest = null;
        if (resumo == null)
        {
            baseRequest = await _context.GenerationRequests
                .FirstOrDefaultAsync(g => g.Id == requestDto.ConteudoId && g.UserId == userId && g.Status == RequestStatus.Concluido);

            if (baseRequest == null)
                return NotFound("Conteúdo não encontrado ou não pertence ao usuário.");
        }

        // ✅ Cria o pedido de geração do simulado
        var novoPedido = new GenerationRequest
        {
            UserId = userId,
            Tipo = GenerationType.Simulado,
            Status = RequestStatus.Pendente,
            InputContextoId = resumo != null
                ? resumo.Id.ToString()
                : baseRequest.Id.ToString(),
            InputTexto = requestDto.NumeroDeQuestoes.ToString(),
            CreatedAt = DateTime.UtcNow
        };

        _context.GenerationRequests.Add(novoPedido);
        await _context.SaveChangesAsync();

        await _conquistaService.CalcularConquistasAsync(userId, user.Plano == "Premium");

        // ✅ Registrar tempo de estudo
        await _tempoEstudoService.RegistrarAtividadeAsync(userId, "Simulado");

        return CreatedAtAction(
            "GetStatusDoPedido",
            "Generation",
            new { id = novoPedido.Id },
            new { requestId = novoPedido.Id }
        );
    }

    [HttpPost("gerar-direto")]
    public async Task<IActionResult> GerarSimuladoDireto([FromBody] GerarSimuladoRequestDto request)
    {
        try
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            var conteudo = await _context.ConteudoIAs
                .FirstOrDefaultAsync(r => r.Id == request.ConteudoId && r.UserId == userId);

            if (conteudo == null)
                return NotFound(new { message = "Conteúdo não encontrado." });

            // ✅ Registrar tempo de estudo antes de iniciar
            await _tempoEstudoService.RegistrarAtividadeAsync(userId, "Simulado");

            // 🔹 Gerar conteúdo resumido e simulado
            string textoResumidoPelaIA = await _geminiService.GerarConteudoAsync(conteudo.TextoGerado, "Conteudo");
            var respostaBrutaDaIA = await _geminiService.GerarSimuladoAsync(textoResumidoPelaIA, request.NumeroDeQuestoes);

            var inicio = respostaBrutaDaIA.IndexOf('[');
            var fim = respostaBrutaDaIA.LastIndexOf(']');
            string jsonLimpo = (inicio != -1 && fim != -1)
                ? respostaBrutaDaIA.Substring(inicio, fim - inicio + 1)
                : "[]";

            var simulado = new Simulado
            {
                ConteudoIAId = conteudo.Id,
                QuestoesJson = jsonLimpo,
                CreatedAt = DateTime.UtcNow
            };

            _context.Simulados.Add(simulado);
            await _context.SaveChangesAsync();

            return Ok(simulado);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }


    // GET: api/simulado
    [HttpGet]
    [Authorize] // Garante que só usuários logados podem acessar
    public async Task<IActionResult> GetSimuladosDoUsuario()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
        var simulados = await _context.Simulados
            .Include(s => s.Conteudo) // Traz o objeto Resumo junto com o Simulado
            .Where(s => s.Conteudo.UserId == userId) // Filtra pelos resumos do usuário logado
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new
            {
                s.Id,
                TopicoOriginal = s.Conteudo.TopicoOriginal, // Pegamos o tópico do resumo pai
                s.CreatedAt
            })
            .ToListAsync();

        return Ok(simulados);
    }

    // GET: api/simulado/5
    [HttpGet("{id}")]
    [Authorize]
    public async Task<IActionResult> GetSimuladoPorId(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

        var simulado = await _context.Simulados
            .Include(s => s.Conteudo) // Incluímos o resumo para a verificação de segurança
            .FirstOrDefaultAsync(s => s.Id == id && s.Conteudo.UserId == userId);

        if (simulado == null)
        {
            return NotFound("Simulado não encontrado ou não pertence ao usuário.");
        }

        // Retorna o objeto completo do simulado encontrado
        return Ok(simulado);
    }

    // DELETE: api/simulado/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSimulado(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

        // Encontra o simulado e, através do Resumo associado, verifica se pertence ao usuário.
        var simulado = await _context.Simulados
            .Include(s => s.Conteudo) // Precisamos incluir o Resumo para pegar o UserId.
            .FirstOrDefaultAsync(s => s.Id == id && s.Conteudo.UserId == userId);

        if (simulado == null)
        {
            return NotFound("Simulado não encontrado ou não pertence ao usuário.");
        }

        _context.Simulados.Remove(simulado);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // Em Controllers/SimuladoController.cs

    [HttpPost("{simuladoid}/finalizar")]
    public async Task<IActionResult> FinalizarSimulado(int simuladoid, [FromBody] Dictionary<int, string> respostas)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
        var simulado = await _context.Simulados.FindAsync(simuladoid);
        var usuario = await _context.Users.FindAsync(userId);

        Console.WriteLine($"🔍 Finalizando simulado ID: {simuladoid}");
        Console.WriteLine($"🔍 Simulado encontrado? {(simulado != null)}");

        if (simulado == null) return NotFound();

        var questoes = JsonSerializer.Deserialize<List<QuestaoDto>>(simulado.QuestoesJson);
        int acertos = 0;
        foreach (var (q, index) in questoes.Select((q, i) => (q, i)))
        {
            if (respostas.ContainsKey(index) && respostas[index] == q.RespostaCorreta)
            {
                acertos++;
            }
        }

        int minutosGanhos = questoes.Count * 1;
        usuario.MinutosDeEstudo += minutosGanhos;

        int pontosGanhos = acertos * 10;
        usuario.Pontos += pontosGanhos;

        var resultado = new ResultadoSimulado
        {
            SimuladoId = simuladoid,
            UserId = userId,
            Acertos = acertos,
            TotalQuestoes = questoes.Count
        };

        _context.ResultadosSimulados.Add(resultado);
        await _context.SaveChangesAsync();

        return Ok(new { Acertos = acertos, TotalQuestoes = questoes.Count });
    }
}
