using System;
using System.Collections.Generic;

namespace Backend.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string PasswordHash { get; set; } = null!;
        public string Role { get; set; } = "Aluno";
        public int MinutosDeEstudo { get; set; } = 0;
        public int Pontos { get; set; } = 0;
        public string? Cpf { get; set; }
        public string? Telefone { get; set; }
        public string Plano { get; set; } = "Gratuito"; // ou premium
        public DateTime? UltimoPagamento { get; set; } // Data do último pagamento
        public bool Ativo { get; set; } = false;       // Se a assinatura está ativa

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<Materia> Materias { get; set; } = new List<Materia>();
    }
}
