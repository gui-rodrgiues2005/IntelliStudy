namespace Backend.Models
{
    public class SessaoEstudo
    {
        public int Id { get; set; }
        public string Topico { get; set; }
        public int DiaDaSemana { get; set; }
        public int DuracaoMinutos { get; set; }
        public bool Concluida { get; set; } = false;
        public int PlanoDeEstudoId { get; set; }
        public PlanoDeEstudo PlanoDeEstudo { get; set; }
    }

}