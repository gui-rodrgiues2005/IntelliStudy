using Backend.Models;
using Backend.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

public class ConquistaService
{
    private readonly AppDbContext _context;

    public ConquistaService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<(int totalResumos, int totalSimulados)> ObterTotaisGeracoesAsync(int userId)
    {
        var totalResumos = await _context.ConteudoIAs
            .CountAsync(r => r.UserId == userId);

        var totalSimulados = await _context.ResultadosSimulados
            .CountAsync(r => r.UserId == userId);

        return (totalResumos, totalSimulados);
    }

    public async Task CalcularConquistasAsync(int userId, bool isPremium)
    {
        var usuario = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (usuario == null)
            throw new Exception("Usuário não encontrado");

        // Obtém totais
        var (totalResumos, totalSimulados) = await ObterTotaisGeracoesAsync(userId);

        // Conquistas já desbloqueadas
        var conquistasUsuario = await _context.ConquistasUsuarios
            .Where(c => c.UserId == userId)
            .ToListAsync();

        foreach (var conquistaCatalogo in ConquistasCatalogo.Todas)
        {
            if (conquistaCatalogo.Plano == "Premium" && !isPremium)
                continue;

            var conquistaUsuario = conquistasUsuario
                .FirstOrDefault(c => c.CodigoConquista == conquistaCatalogo.Codigo);

            // Pula se já desbloqueada
            if (conquistaUsuario?.DesbloqueadaEm != null)
                continue;

            bool desbloquear = false;

            // Verifica cada tipo de conquista
            switch (conquistaCatalogo.Codigo)
            {
                case "PRIMEIRO_CONTEUDO": // antes PRIMEIRO_RESUMO
                    desbloquear = totalResumos > 0;
                    break;

                case "PRIMEIRO_SIMULADO":
                    desbloquear = totalSimulados > 0;
                    break;

                case "DEZ_CONTEUDOS": // antes DEZ_RESUMOS
                    desbloquear = totalResumos >= 10;
                    break;

                case "DEZ_SIMULADOS":
                    desbloquear = totalSimulados >= 10;
                    break;

                case "CINQUENTA_CONTEUDOS": // antes CINQUENTA_RESUMOS
                    desbloquear = totalResumos >= 50 && isPremium;
                    break;

                case "NOTA_MAXIMA":
                    var temNotaMaxima = await _context.ResultadosSimulados
                        .AnyAsync(r => r.UserId == userId &&
                                r.Acertos == r.TotalQuestoes);
                    desbloquear = temNotaMaxima && isPremium;
                    break;

                case "MARATONA":
                    // exemplo: verificar minutos de estudo (supondo campo MinutosDeEstudo no usuário)
                    desbloquear = isPremium && (usuario.MinutosDeEstudo >= 60);
                    break;

                case "MESTRE_CONTEUDOS":
                    desbloquear = totalResumos >= 100 && isPremium;
                    break;

                default:
                    desbloquear = false;
                    break;
            }

            if (desbloquear)
            {
                Console.WriteLine($"[Conquista] Desbloqueando {conquistaCatalogo.Codigo} para user {userId}");
                if (conquistaUsuario == null)
                {
                    _context.ConquistasUsuarios.Add(new ConquistaUsuario
                    {
                        UserId = userId,
                        CodigoConquista = conquistaCatalogo.Codigo,
                        DesbloqueadaEm = DateTime.UtcNow
                    });
                }
                else if (conquistaUsuario.DesbloqueadaEm == null)
                {
                    conquistaUsuario.DesbloqueadaEm = DateTime.UtcNow;
                }
            }
        }

        await _context.SaveChangesAsync();
    }
}
