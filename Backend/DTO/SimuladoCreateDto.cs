namespace Backend.DTO
{
    public class SimuladoCreateDto
    {
        public int MateriaId { get; set; }
        public string QuestoesJson { get; set; }
    }

    public class SimuladoDto
    {
        public int Id { get; set; }
        public int MateriaId { get; set; }
        public string QuestoesJson { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}