using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Backend.Services;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

[ApiController]
[Route("api/analytics")]
[Authorize]
public class AnalyticsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly PlanoService _planoService;

    public AnalyticsController(AppDbContext context, PlanoService planoService)
    {
        _context = context;
        _planoService = planoService;
    }

    [HttpGet("user")]
    public async Task<IActionResult> GetUserAnalytics()
    {
        //Identifica o usuário autenticado
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdClaim))
            return Unauthorized("Usuário não autenticado.");

        if (!int.TryParse(userIdClaim, out var userId))
            return BadRequest("ID de usuário inválido.");

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
            return NotFound("Usuário não encontrado.");

        // Resultados dos simulados
        var resultados = await _context.ResultadosSimulados
            .Include(r => r.Simulado)
                .ThenInclude(s => s.Conteudo)
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.FinalizadoEm)
            .ToListAsync();

        //Cálculo de métricas principais
        int totalEstudo = user.MinutosDeEstudo;
        int totalQuestoes = resultados.Sum(r => r.TotalQuestoes);
        int totalAcertos = resultados.Sum(r => r.Acertos);

        double mediaAcertos = totalQuestoes > 0
            ? (double)totalAcertos / totalQuestoes * 100
            : 0;

        //Progresso semanal - número de simulados concluídos por dia
        var progressoSemanal = Enumerable.Range(0, 7)
            .Select(i =>
            {
                var dia = DateTime.UtcNow.Date.AddDays(-i);
                int count = resultados.Count(r => r.FinalizadoEm.Date == dia);
                return new
                {
                    Dia = dia.ToString("ddd", new System.Globalization.CultureInfo("pt-BR")),
                    Valor = count
                };
            })
            .Reverse()
            .ToList();

        //Acertos por tema
        var acertosPorTema = resultados
   .Where(r => r.Simulado != null && r.TotalQuestoes > 0)
   .GroupBy(r => r.Simulado.Conteudo?.TopicoOriginal ?? "Geral")
   .Select(g => new
   {
       Tema = g.Key,
       Valor = Math.Round(g.Average(r =>
           r.TotalQuestoes > 0 ? (double)r.Acertos / r.TotalQuestoes * 100 : 0
       ), 1)
   })
   .ToList();


        //Tempo de estudo diário - últimos 7 dias (com garantia de continuidade)
        var ultimos7dias = Enumerable.Range(0, 7)
            .Select(i => DateTime.UtcNow.Date.AddDays(-i))
            .ToList();

        var tempoBanco = await _context.TempoEstudosUsuarios
            .Where(t => t.UserId == userId && t.Dia >= ultimos7dias.Last())
            .ToListAsync();

        var tempoDeEstudo = ultimos7dias
            .Select(dia =>
            {
                var registro = tempoBanco.FirstOrDefault(t => t.Dia.Date == dia);
                return new
                {
                    Dia = dia.ToString("ddd", new System.Globalization.CultureInfo("pt-BR")),
                    Valor = registro?.Minutos ?? 0
                };
            })
            .Reverse()
            .ToList();

        //Distribuição geral de acertos x erros
        var distribuicao = new
        {
            Acertos = totalAcertos,
            Erros = Math.Max(totalQuestoes - totalAcertos, 0)
        };

        var data = new
        {
            Plano = user.Plano,
            MediaAcertos = Math.Round(mediaAcertos, 2),
            TotalEstudo = totalEstudo,
            ProgressoSemanal = progressoSemanal,
            AcertosPorTema = acertosPorTema,
            TempoDeEstudo = tempoDeEstudo,
            Distribuicao = distribuicao
        };

        return Ok(data);
    }
}

