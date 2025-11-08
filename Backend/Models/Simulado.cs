using System;

namespace Backend.Models
{
    public class Simulado
    {
        public int Id { get; set; }
        public string QuestoesJson { get; set; } // JSON com as questões geradas pela IA
        public DateTime CreatedAt { get; set; }
        public int? GenerationRequestId { get; set; }

        // Relação com o conteúdo gerado (antes Resumo)
        public int? ConteudoIAId { get; set; }
        public ConteudoIA Conteudo { get; set; }
    }
}
