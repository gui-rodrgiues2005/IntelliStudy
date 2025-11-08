// Em Backend/Controllers/ProfileController.cs

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Backend.Data;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ConquistaService _conquistaService;

    public ProfileController(AppDbContext context, ConquistaService conquistaService)
    {
        _context = context;
        _conquistaService = conquistaService;
    }

    [HttpGet]
    public async Task<IActionResult> GetProfileData()
    {
        _context.ChangeTracker.Clear();
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
        var usuario = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (usuario == null) return NotFound("Usuário não encontrado.");

        var totalResumos = await _context.ConteudoIAs.CountAsync(r => r.UserId == userId);
        var resultados = await _context.ResultadosSimulados.Where(r => r.UserId == userId).ToListAsync();
        var totalSimulados = resultados.Count;

        var isPremium = string.Equals(usuario.Plano, "Premium", StringComparison.OrdinalIgnoreCase);

        // Calcula e atualiza conquistas
        await _conquistaService.CalcularConquistasAsync(userId, isPremium);

        // Busca as conquistas do usuário
        var conquistasUsuario = await _context.ConquistasUsuarios
            .Where(c => c.UserId == userId)
            .ToDictionaryAsync(c => c.CodigoConquista, c => c.DesbloqueadaEm);

        // Monta lista completa de conquistas com status
        var conquistas = ConquistasCatalogo.Todas.Select(c => new
        {
            Codigo = c.Codigo,
            Nome = c.Nome,
            Plano = c.Plano,
            Desbloqueada = conquistasUsuario.ContainsKey(c.Codigo) && conquistasUsuario[c.Codigo].HasValue
        }).ToList();

        // Atividades recentes
        var atividadesRecentes = await _context.ConteudoIAs
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .Take(5)
            .Select(r => new
            {
                Tipo = "Resumo",
                Titulo = r.TopicoOriginal,
                Data = r.CreatedAt
            })
            .ToListAsync();

        var profileData = new
        {
            Nome = usuario.Name,
            Email = usuario.Email,
            Cpf = usuario.Cpf,
            Telefone = usuario.Telefone,
            Instagram = usuario.Instagram,
            GitHub = usuario.GitHub,
            Linkedin = usuario.Linkedin,
            MembroDesde = usuario.CreatedAt,
            TotalResumos = totalResumos,
            TotalSimulados = totalSimulados,
            AtividadesRecentes = atividadesRecentes,
            HorasEstudo = $"{usuario.MinutosDeEstudo / 60}h {usuario.MinutosDeEstudo % 60}min",
            MediaAcertos = $"{CalcularMedia(resultados):F0}%",
            Conquistas = conquistas
        };

        return Ok(profileData);
    }

    private double CalcularMedia(List<ResultadoSimulado> resultados)
    {
        if (!resultados.Any()) return 0;
        double totalAcertos = resultados.Sum(r => r.Acertos);
        double totalQuestoes = resultados.Sum(r => r.TotalQuestoes);
        return totalQuestoes > 0 ? (totalAcertos / totalQuestoes) * 100 : 0;
    }
}
