namespace Backend.DTO
{
    public class GerarPagamentoDto
    {
        public decimal Valor { get; set; }
        public string Descricao { get; set; } = string.Empty;
    }
}
