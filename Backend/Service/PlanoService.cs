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

        public async Task<User?> GetUserAsync(int userId)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        }

        // -----------------------
        // 🧩 REGRAS DE PLANO
        // -----------------------

        public bool PodeGerarResumo(User user)
        {
            string plano = user.Plano?.ToLower() ?? "gratuito";
            var hoje = DateTime.UtcNow.Date;

            int conteudosHoje = _context.GenerationRequests
                .Count(r => r.UserId == user.Id &&
                            r.Tipo == GenerationType.Resumo &&
                            r.CreatedAt.Date == hoje);

            return plano switch
            {
                "gratuito" => conteudosHoje < 5,
                "basico" => conteudosHoje < 20,
                "pro" or "mestre" => true, // ilimitado
                _ => false
            };
        }

        public bool PodeGerarSimulado(User user)
        {
            string plano = user.Plano?.ToLower() ?? "gratuito";
            var hoje = DateTime.UtcNow.Date;
            var mesAtual = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);


            int simuladosHoje = _context.Simulados
                .Count(s => s.Conteudo.UserId == user.Id && s.CreatedAt.Date == hoje);

            int simuladosMes = _context.Simulados
                .Count(s => s.Conteudo.UserId == user.Id && s.CreatedAt >= mesAtual);

            return plano switch
            {
                "gratuito" => simuladosHoje < 5,
                "basico" => simuladosHoje < 10,
                "pro" => simuladosMes < 50,
                "mestre" => true, // ilimitado
                _ => false
            };
        }

        public bool PodeCriarPlanoDeEstudo(User user)
        {
            string plano = user.Plano?.ToLower() ?? "gratuito";
            var agora = DateTime.UtcNow;

            if (plano == "pro" || plano == "mestre")
                return true; // ilimitado

            var planosRecentes = _context.PlanosDeEstudo
                .Where(p => p.UserId == user.Id && p.CreatedAt >= agora.AddDays(-7))
                .ToList();

            if (plano == "gratuito")
                return planosRecentes.Count < 1; // 1 por semana

            if (plano == "basico")
                return planosRecentes.Count < 2; // 2 por semana

            return true;
        }

        public bool PodeExportarResumos(User user)
        {
            string plano = user.Plano?.ToLower() ?? "gratuito";

            return plano switch
            {
                "gratuito" => false,
                "basico" => true, // limitado
                "pro" or "mestre" => true, // completo
                _ => false
            };
        }

        public bool TemAcessoAnalytics(User user)
        {
            return user.Plano?.ToLower() is "pro" or "mestre";
        }

        public bool PodeVerRanking(User user)
        {
            return user.Plano?.ToLower() != "gratuito";
        }

        public bool TemSuportePrioritario(User user)
        {
            return user.Plano?.ToLower() == "mestre";
        }

        // -----------------------
        // 🏆 CONQUISTAS
        // -----------------------
        public async Task<List<Conquista>> GetConquistasDoUsuarioAsync(User user)
        {
            var conquistasDoUsuario = await _context.UserConquistas
                .Where(uc => uc.UserId == user.Id)
                .Select(uc => uc.Codigo)
                .ToListAsync();

            var plano = user.Plano?.ToLower() ?? "gratuito";

            var conquistasDisponiveis = ConquistasCatalogo.Todas
                .Where(c =>
                    plano switch
                    {
                        "mestre" => true, // tudo desbloqueado
                        "pro" => c.Plano is "Pro" or "Basico" or "Gratuito",
                        "basico" => c.Plano is "Basico" or "Gratuito",
                        _ => c.Plano == "Gratuito"
                    })
                .ToList();

            foreach (var c in conquistasDisponiveis)
            {
                c.Desbloqueada = conquistasDoUsuario.Contains(c.Codigo);
            }

            return conquistasDisponiveis;
        }
    }
}
