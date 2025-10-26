public class PagamentoCartao
{
    public int Id { get; set; }
    public int UserId { get; set; }

    // Txid da Stripe (session.Id ou payment_intent.Id)
    public string TransactionId { get; set; } = string.Empty;

    // Valor pago
    public decimal Valor { get; set; }

    // Informações opcionais
    public string Metodo { get; set; } = "Cartão"; // sempre Cartão

    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
    public bool Pago { get; set; } = false;

    // Data do pagamento confirmado
    public DateTime? DataPagamento { get; set; }
}
