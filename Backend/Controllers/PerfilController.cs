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

    public ProfileController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetProfileData()
    {
        _context.ChangeTracker.Clear();
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
        var usuario = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (usuario == null) return NotFound("Usuário não encontrado.");

        var totalResumos = await _context.Resumos.CountAsync(r => r.UserId == userId);
        var resultados = await _context.ResultadosSimulados.Where(r => r.UserId == userId).ToListAsync();
        var totalSimulados = resultados.Count;

        var isPremium = string.Equals(usuario.Plano, "Premium", StringComparison.OrdinalIgnoreCase);
        var conquistaService = new ConquistaService();
        var conquistas = conquistaService.CalcularConquistas(totalResumos, totalSimulados, isPremium);

            // 5. Buscar atividades recentes (seu código já estava correto)
        var atividadesRecentes = await _context.Resumos
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
