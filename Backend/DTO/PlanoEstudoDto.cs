// Em Backend/DTO/PlanoDeEstudoDto.cs
using System.Text.Json.Serialization;

namespace Backend.DTO
{
    // DTO para cada "bloquinho" de estudo
    public class SessaoEstudoDto
    {
        public int Id { get; set; }
        public string Topico { get; set; }
        public int DuracaoMinutos { get; set; }
        public bool Concluida { get; set; }
    }

    // DTO para cada dia da semana no calendário
    public class DiaEstudoDto
    {
        public int DiaDaSemana { get; set; } // 1 para Segunda, 2 para Terça...
        public string NomeDia { get; set; } // "Segunda-feira", "Terça-feira"...
        public List<SessaoEstudoDto> Sessoes { get; set; } = new List<SessaoEstudoDto>();
    }

    public class PlanoGeradoDto
    {
        [JsonPropertyName("cronogramaSemanal")]
        public List<DiaGeradoDto> CronogramaSemanal { get; set; }
    }
    public class DiaGeradoDto
    {
        [JsonPropertyName("dia")]
        public int Dia { get; set; }

        [JsonPropertyName("sessoes")]
        public List<SessaoGeradaDto> Sessoes { get; set; }
    }

    public class SessaoGeradaDto
    {
        [JsonPropertyName("topico")]
        public string Topico { get; set; }

        [JsonPropertyName("duracao")]
        public object Duracao { get; set; } 
    }

    // DTO principal que a página do frontend vai receber
    public class PlanoDeEstudoDto
    {
        public int Id { get; set; }
        public string Meta { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime DataProva { get; set; }
        public List<DiaEstudoDto> CronogramaSemanal { get; set; } = new List<DiaEstudoDto>();
    }
}
