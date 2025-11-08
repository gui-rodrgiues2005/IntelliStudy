using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class ConquistaUsuario
    {
        public int Id { get; set; }
        public int UserId { get; set; }

        // Código da conquista (ex: "PRIMEIRO_SIMULADO")
        public string CodigoConquista { get; set; } = null!;

        // Quando foi desbloqueada
        public DateTime? DesbloqueadaEm { get; set; }

        // Relação com o catálogo de conquistas (opcional, facilita navegação)
        [NotMapped]
        public Conquista? Conquista { get; set; }
    }
}
