namespace Backend.DTO
{
    public class ConteudoDto
    {
        public int Id { get; set; }
        public string TextoGerado { get; set; }  
        public string TopicoOriginal { get; set; } 
        public DateTime CreatedAt { get; set; }
    }
}
