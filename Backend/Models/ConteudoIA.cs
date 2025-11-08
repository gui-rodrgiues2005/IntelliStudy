namespace Backend.Models
{
    public class ConteudoIA
    {
        public int Id { get; set; }
        public string Tipo { get; set; } = null!; // Resumo, PerguntaDireta, EstudarParaProva etc.
        public string TopicoOriginal { get; set; } = null!; // O que o usuário digitou
        public string TextoGerado { get; set; } = null!; // O que a IA retornou
        public DateTime CreatedAt { get; set; }
        public int UserId { get; set; }
        public User User { get; set; }
    }
}