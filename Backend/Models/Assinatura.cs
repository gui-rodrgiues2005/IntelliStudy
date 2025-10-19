// Em Backend/Models/Assinatura.cs

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class Assinatura
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; } // Chave estrangeira para o usuário
        public User User { get; set; } // Propriedade de navegação

        [Required]
        [StringLength(50)]
        public string Plano { get; set; } // Ex: "Aprendiz", "Mestre"

        [Required]
        public DateTime DataInicio { get; set; } // Quando a assinatura começou

        public DateTime? DataFim { get; set; } // Quando a assinatura termina (para planos com duração)

        public DateTime? DataRenovacao { get; set; } // Próxima data de renovação (para assinaturas recorrentes)

        [Required]
        [StringLength(20)]
        public string Status { get; set; } // Ex: "Ativa", "Pendente", "Cancelada", "Expirada"

        // ID da assinatura no sistema do Efi Bank (para referência externa)
        [StringLength(255)]
        public string? EfiSubscriptionId { get; set; }

        // ID da transação mais recente no Efi Bank (para referência)
        [StringLength(255)]
        public string? EfiChargeId { get; set; }

        // Outras informações relevantes, se necessário
        public decimal Valor { get; set; } // Valor pago pela assinatura
        public string? Moeda { get; set; } = "BRL"; // Moeda da transação

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow; // Data de criação do registro
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow; // Data da última atualização
    }
}
