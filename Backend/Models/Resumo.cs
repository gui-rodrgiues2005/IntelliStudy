using System;

namespace Backend.Models
{
    // Models/Resumo.cs
    public class Resumo
    {
        public int Id { get; set; }
        public string? TopicoOriginal { get; set; } // O que o usuário digitou
        public string ResumoTexto { get; set; } // O que a IA gerou
        public DateTime CreatedAt { get; set; }
        public int UserId { get; set; }
        public User User { get; set; }
    }
}
