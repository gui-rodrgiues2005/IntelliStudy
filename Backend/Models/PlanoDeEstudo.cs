namespace Backend.Models
{
    public class PlanoDeEstudo
    {
        public int Id { get; set; }
        public string Meta { get; set; }
        
        // --- PROPRIEDADE ADICIONADA ---
        // Armazena as matérias do plano como uma única string.
        public string Materias { get; set; }

        public int UserId { get; set; }
        public User Usuario { get; set; }
        public DateTime DataProva { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool Concluido { get; set; } = false;

        // Renomeado para o plural, que é a convenção correta para coleções.
        public ICollection<SessaoEstudo> Sessoes { get; set; } = new List<SessaoEstudo>();
    }
}
