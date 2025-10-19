// Em Backend/Controllers/RankingController.cs

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.DTO;
using System.Security.Claims;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RankingController : ControllerBase
{
    private readonly AppDbContext _context;

    public RankingController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetRanking()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

        var rankingCompleto = await _context.Users
            .OrderByDescending(u => u.Pontos)
            .Select(u => new RankingDto 
            {
                Id = u.Id,
                Nome = u.Name,
                Pontos = u.Pontos
            })
            .ToListAsync();

        var usuarioLogadoInfo = rankingCompleto
            .Select((usuario, index) => new UserPositionDto 
            {
                Usuario = usuario,
                Posicao = index + 1
            })
            .FirstOrDefault(x => x.Usuario.Id == userId);

        // Usando o DTO de resposta principal
        var resposta = new RankingResponseDto
        {
            Ranking = rankingCompleto,
            PosicaoUsuarioLogado = usuarioLogadoInfo
        };

        return Ok(resposta);
    }
}
