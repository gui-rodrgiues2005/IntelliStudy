using System;

namespace Backend.Models
{
    public class AtividadeUsuario
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Tipo { get; set; } = string.Empty; // "Resumo", "Simulado", "Pesquisa"
        public DateTime DataInicio { get; set; }
        public DateTime? DataFim { get; set; }
        public int? DuracaoSegundos { get; set; }

        public int DiaDaSemana { get; set; }

        // 🔗 Relacionamento
        public User User { get; set; }
    }
}
