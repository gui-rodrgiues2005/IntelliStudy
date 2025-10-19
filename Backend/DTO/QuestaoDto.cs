using System.Text.Json.Serialization;

namespace Backend.DTO
{
    public class QuestaoDto
    {
        [JsonPropertyName("pergunta")]
        public string Pergunta { get; set; }

        [JsonPropertyName("alternativas")]
        public List<string> Alternativas { get; set; }

        [JsonPropertyName("respostaCorreta")]
        public string RespostaCorreta { get; set; }
    }
}