using Microsoft.EntityFrameworkCore;
using Backend.Models;

namespace Backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<ConteudoIA> ConteudoIAs { get; set; } = null!;
        public DbSet<Simulado> Simulados { get; set; } = null!;
        public DbSet<ResultadoSimulado> ResultadosSimulados { get; set; } = null!;
        public DbSet<PlanoDeEstudo> PlanosDeEstudo { get; set; }
        public DbSet<SessaoEstudo> SessoesDeEstudo { get; set; }
        public DbSet<GenerationRequest> GenerationRequests { get; set; }
        public DbSet<Assinatura> Assinaturas { get; set; }
        public DbSet<PagamentoCartao> PagamentosCartao { get; set; }
        public DbSet<UserConquista> UserConquistas { get; set; }
        public DbSet<ConquistaUsuario> ConquistasUsuarios { get; set; }
        public DbSet<TempoEstudoUsuario> TempoEstudosUsuarios { get; set; }
        public DbSet<UserAtividade> UserAtividades { get; set; }
        public DbSet<AtividadeUsuario> AtividadesUsuarios { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<GenerationRequest>()
                .Property(g => g.OutputMetadata)
                .HasColumnName("OutputMetadata"); // nome real da coluna no banco
        }
    }
}
