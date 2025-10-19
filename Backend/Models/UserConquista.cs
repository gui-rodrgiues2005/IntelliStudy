using System;

namespace Backend.Models
{
    public class UserConquista
    {
        public int Id { get; set; } // chave primária
        public int UserId { get; set; } // FK para o usuário
        public string Codigo { get; set; } // Código da conquista (ex: "DEZ_RESUMOS")
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow; // quando foi desbloqueada

        // Navegação (opcional)
        public User? User { get; set; }
    }
}
