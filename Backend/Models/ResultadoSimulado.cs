using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class ResultadoSimulado
    {
        [Key]
        public int Id { get; set; }

        public int SimuladoId { get; set; }
        public Simulado Simulado { get; set; }

        public int UserId { get; set; }
        public User User { get; set; }

        public int Acertos { get; set; }
        public int TotalQuestoes { get; set; }
        public DateTime FinalizadoEm { get; set; } = DateTime.UtcNow;
    }
}