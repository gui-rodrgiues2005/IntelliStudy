namespace Backend.Models
{
    public class ResumoDto
    {
        public int Id { get; set; }
        public string ResumoTexto { get; set; }
        public string TopicosJson { get; set; }
        public DateTime CreatedAt { get; set; }
    }
    
}
