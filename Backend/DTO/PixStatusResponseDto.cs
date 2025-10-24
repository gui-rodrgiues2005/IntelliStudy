using System.Text.Json.Serialization;

namespace Backend.DTO
{
    // --- 2.1. DTO Auxiliar para o Objeto 'valor' ---
    // Mapeia: "valor": { "original": "12.00" }
    public class EfiValorResposta
    {
        // CORREÇÃO CRUCIAL: Deve ser STRING. Isto resolve seu erro de JSON.
        [JsonPropertyName("original")]
        public string Original { get; set; } 
    }

    // --- 2.2. DTO Principal para a Consulta ---
    // Usado dentro do seu EfiPixService.VerificarStatusPixAsync
    public class PixConsultaResponse
    {
        [JsonPropertyName("status")]
        public string Status { get; set; } // O valor será 'CONCLUIDA' ou 'ATIVA'
        
        // Agora, Valor é o objeto que contém a string do valor
        [JsonPropertyName("valor")]
        public EfiValorResposta Valor { get; set; }

        // Os dados de pagamento (data/hora) vêm geralmente em uma lista 'pix'
        [JsonPropertyName("pix")]
        public List<object>? Pix { get; set; } 
    }
}