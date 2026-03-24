using System.ComponentModel.DataAnnotations;

public class ChatMensagemRequest
{
    [Required]
    public string Texto { get; set; }

    public string Autor { get; set; } = "user";
}
