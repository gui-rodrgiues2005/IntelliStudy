public class PagamentoPix
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Txid { get; set; } = string.Empty;
    public string Valor { get; set; } = string.Empty;
    public string PixCopiaECola { get; set; } = string.Empty;
    public string QrCodeUrl { get; set; } = string.Empty;
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
    public bool Pago { get; set; } = false;

    // NOVA PROPRIEDADE
    public DateTime? DataPagamento { get; set; }
}
