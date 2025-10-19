using System;

namespace Backend.Models
{
    // Em Models/Simulado.cs
    public class Simulado
    {
        public int Id { get; set; }
        public string QuestoesJson { get; set; } // O texto gerado pela IA com as questões
        public DateTime CreatedAt { get; set; }

        // A relação mais importante: qual resumo gerou este simulado?
        public int ResumoId { get; set; }
        public Resumo Resumo { get; set; }
    }
}
