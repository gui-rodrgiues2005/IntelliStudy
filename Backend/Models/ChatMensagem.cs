public class ChatMensagem
{
    public int Id { get; set; }
    public int ConversaId { get; set; }
    public string Role { get; set; }
    public string Conteudo { get; set; }
    public DateTime CreatedAt { get; set; }
}
