using System;
using System.Collections.Generic;
using Backend.Models;

namespace Backend.DTO
{
    public class MateriaDto
    {
        public int Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string Conteudo { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }

        public List<ResumoDto> Resumos { get; set; } = new();
        public List<SimuladoDto> Simulados { get; set; } = new();
    }
}
