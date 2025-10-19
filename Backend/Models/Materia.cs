using System;
using System.Collections.Generic;

namespace Backend.Models
{
    public class Materia
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Titulo { get; set; } = null!;
        public string Conteudo { get; set; } = null!;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User User { get; set; } = null!;
        public ICollection<Resumo> Resumos { get; set; } = new List<Resumo>();
        public ICollection<Simulado> Simulados { get; set; } = new List<Simulado>();
    }
}
