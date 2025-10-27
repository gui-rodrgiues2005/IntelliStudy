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

    // Construtor modificado
    public SimuladoController(AppDbContext context, GeminiService geminiService, PlanoService planoService)
    {
        _context = context;
        _geminiService = geminiService;
        _planoService = planoService;
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
        {
            return Unauthorized("Usuário não encontrado.");
        }

        if (!_planoService.PodeGerarSimulado(user))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                success = false,
                message = "Limite diário de simulados atingido para o plano atual.",
                sugestao = "Assine o plano Premium e gere simulados ilimitados!",
                planoAtual = user.Plano,
                limiteDiario = 3
            });
        }

        // Validação para garantir que o resumo existe e pertence ao usuário
        Console.WriteLine($"ResumoId received: {requestDto.ResumoId}");
        Console.WriteLine($"UserId: {userId}");
        var resumo = await _context.Resumos.FirstOrDefaultAsync(r => r.Id == requestDto.ResumoId);
        Console.WriteLine($"Resumo found: {resumo != null}");
        if (resumo != null)
        {
            Console.WriteLine($"Resumo UserId: {resumo.UserId}, Matches: {resumo.UserId == userId}");
        }
        var resumoExiste = resumo != null && resumo.UserId == userId;

        Console.WriteLine($"==============Resumo recebido==========: {resumoExiste}");
        if (!resumoExiste)
        {
            return NotFound("Resumo não encontrado ou não pertence ao usuário.");
        }

        var novoPedido = new GenerationRequest
        {
            UserId = userId,
            Tipo = GenerationType.Simulado,
            Status = RequestStatus.Pendente,
            InputContextoId = requestDto.ResumoId.ToString(), // O ID do resumo que será o pai
            InputTexto = requestDto.NumeroDeQuestoes.ToString(), // O número de questões!
            CreatedAt = DateTime.UtcNow
        };

        _context.GenerationRequests.Add(novoPedido);
        await _context.SaveChangesAsync();

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
            var resumo = await _context.Resumos
                .FirstOrDefaultAsync(r => r.Id == request.ResumoId && r.UserId == userId);

            if (resumo == null)
                return NotFound(new { message = "Resumo não encontrado" });

            // --- INÍCIO DA CORREÇÃO ---
            // 1. Este endpoint ('gerar-direto') é usado pelo seu fluxo de ARQUIVOS.
            //    Portanto, 'resumo.ResumoTexto' contém o TEXTO BRUTO do PDF.
            // 2. A IA não consegue gerar um simulado de um texto bruto.
            //    Precisamos *primeiro* pedir à IA para resumir esse texto.

            // Você já tem o _geminiService.GerarResumoAsync disponível aqui.
            string textoResumidoPelaIA = await _geminiService.GerarResumoAsync(resumo.ResumoTexto);

            // --- FIM DA CORREÇÃO ---

            // 3. Agora, usamos esse 'textoResumidoPelaIA' (que é limpo e curto)
            //    para gerar o simulado, em vez do 'resumo.ResumoTexto'.
            var respostaBrutaDaIA = await _geminiService.GerarSimuladoAsync(textoResumidoPelaIA, request.NumeroDeQuestoes);

            // 4. O resto do seu código permanece idêntico
            var inicio = respostaBrutaDaIA.IndexOf('[');
            var fim = respostaBrutaDaIA.LastIndexOf(']');
            string jsonLimpo = (inicio != -1 && fim != -1)
                ? respostaBrutaDaIA.Substring(inicio, fim - inicio + 1)
                : "[]";

            // 5. Cria e salva o Simulado
            var simulado = new Simulado
            {
                ResumoId = resumo.Id,
                QuestoesJson = jsonLimpo,
                CreatedAt = DateTime.UtcNow
            };

            _context.Simulados.Add(simulado);
            await _context.SaveChangesAsync();

            // 6. Retorna o simulado gerado
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
            .Include(s => s.Resumo) // Traz o objeto Resumo junto com o Simulado
            .Where(s => s.Resumo.UserId == userId) // Filtra pelos resumos do usuário logado
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new
            {
                s.Id,
                TopicoOriginal = s.Resumo.TopicoOriginal, // Pegamos o tópico do resumo pai
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
            .Include(s => s.Resumo) // Incluímos o resumo para a verificação de segurança
            .FirstOrDefaultAsync(s => s.Id == id && s.Resumo.UserId == userId);

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
            .Include(s => s.Resumo) // Precisamos incluir o Resumo para pegar o UserId.
            .FirstOrDefaultAsync(s => s.Id == id && s.Resumo.UserId == userId);

        if (simulado == null)
        {
            return NotFound("Simulado não encontrado ou não pertence ao usuário.");
        }

        _context.Simulados.Remove(simulado);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // Em Controllers/SimuladoController.cs

    [HttpPost("{id}/finalizar")]
    public async Task<IActionResult> FinalizarSimulado(int id, [FromBody] Dictionary<int, string> respostas)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
        var simulado = await _context.Simulados.FindAsync(id);
        var usuario = await _context.Users.FindAsync(userId);

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
            SimuladoId = id,
            UserId = userId,
            Acertos = acertos,
            TotalQuestoes = questoes.Count
        };

        _context.ResultadosSimulados.Add(resultado);
        await _context.SaveChangesAsync();

        return Ok(new { Acertos = acertos, TotalQuestoes = questoes.Count });
    }
}
