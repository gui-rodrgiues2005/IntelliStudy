using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services
{
    public class PlanoService
    {
        private readonly AppDbContext _context;

        public PlanoService(AppDbContext context)
        {
            _context = context;
        }

        // Pega o usuário completo
        public async Task<User?> GetUserAsync(int userId)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        }

        // --- REGRAS DE PLANO ---
        public bool PodeGerarResumo(User user)
        {
            if (user.Plano != "Gratuito") return true; // Premium pode tudo

            var hoje = DateTime.UtcNow.Date;

            // Conta quantos resumos o usuário fez hoje
            var resumosHoje = _context.Resumos
                .Count(r => r.UserId == user.Id && r.CreatedAt.Date == hoje);

            return resumosHoje < 3; // até 3 resumos por dia
        }

        public bool PodeGerarSimulado(User user)
        {
            if (user.Plano != "Gratuito") return true;

            var hoje = DateTime.UtcNow.Date;
            var simuladosHoje = _context.Simulados
                .Count(s => s.Resumo.UserId == user.Id && s.CreatedAt.Date == hoje);

            return simuladosHoje < 3; // 3 simulados/dia
        }

        public bool PodeCriarPlanoDeEstudo(User user)
        {
            if (user.Plano != "Gratuito") return true;

            // Usuário gratuito só pode criar um plano a cada 7 dias
            var ultimoPlano = _context.PlanosDeEstudo
                .Where(p => p.UserId == user.Id)
                .OrderByDescending(p => p.CreatedAt)
                .FirstOrDefault();

            if (ultimoPlano == null) return true;

            return (DateTime.UtcNow - ultimoPlano.CreatedAt).TotalDays >= 7;
        }

        public bool PodeVerRanking(User user)
        {
            return user.Plano != "Gratuito";
        }
        public async Task<List<Conquista>> GetConquistasDoUsuarioAsync(User user)
        {
            // Pega todas as conquistas que o usuário já tem
            var conquistasDoUsuario = await _context.UserConquistas
                .Where(uc => uc.UserId == user.Id)
                .Select(uc => uc.Codigo) // apenas os códigos
                .ToListAsync();

            // Filtra conquistas disponíveis para o plano do usuário
            var conquistasDisponiveis = ConquistasCatalogo.Todas
                .Where(c => c.Plano == "Gratuito" || user.Plano != "Gratuito")
                .ToList();

            // Marca quais conquistas o usuário já possui
            foreach (var c in conquistasDisponiveis)
            {
                c.Desbloqueada = conquistasDoUsuario.Contains(c.Codigo);
            }

            return conquistasDisponiveis;
        }

    }
}
