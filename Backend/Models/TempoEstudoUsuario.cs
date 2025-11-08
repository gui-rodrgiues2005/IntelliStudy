namespace Backend.Models
{
    public class TempoEstudoUsuario
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public DateTime Dia { get; set; }
        public int Minutos { get; set; } // total acumulado no dia
        public User User { get; set; }
    }
}
