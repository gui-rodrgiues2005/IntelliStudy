
// Em Backend/Models/GenerationRequest.cs
using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    // Enum para representar os possíveis status de um pedido
    public enum RequestStatus
    {
        Pendente,  // O pedido foi criado e está na fila, aguardando para ser processado
        Processando, // Um worker pegou o pedido e está chamando a API do Gemini
        Concluido,   // O processo terminou com sucesso e o resultado está salvo
        Falhou      // O processo falhou após várias tentativas
    }

    // Enum para o tipo de conteúdo a ser gerado
    public enum GenerationType
    {
        Resumo,          // 0
        Simulado,        // 1
        PlanoDeEstudo,   // 2
        PerguntaDireta,  // 3
        PesquisaCientifica, // 4
        EstudarParaProva // 5
    }

    public class GenerationRequest
    {
        [Key]
        public int Id { get; set; }
        [Required]
        public int UserId { get; set; } // Para saber de quem é o pedido
        [Required]
        public GenerationType Tipo { get; set; } // Se é para gerar um Resumo ou Simulado
        [Required]
        public RequestStatus Status { get; set; } = RequestStatus.Pendente; // Status inicial é sempre Pendente
        [Required]
        public string InputTexto { get; set; } // É o conteudo que o usuário escreveu e para o simulado é o número de questões
        public string? InputContextoId { get; set; } //ID do resumo para gerar um simulado
        public int? ConversaId { get; set; }
        public ChatConversa? Conversa { get; set; }
        public string? OutputMetadata { get; set; }
        public string? OutputTexto { get; set; } //Resultado do conteudo ou simulado
        public string? MensagemErro { get; set; } // Para guardar a causa da falha, se houver
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow; // Quando o pedido foi criado
        public DateTime? ProcessedAt { get; set; } // Quando o worker terminou de processar
    }
}
