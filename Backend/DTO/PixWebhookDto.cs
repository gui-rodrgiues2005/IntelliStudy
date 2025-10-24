namespace Backend.DTO
{
    // Este DTO é usado na assinatura do seu controller:
    // public async Task<IActionResult> VerificarPagamento([FromBody] PixWebhookDto dto)
    public class PixWebhookDto
    {
        // O txid (ou o token de notificação) é crucial para você consultar a cobrança
        public string Txid { get; set; } = string.Empty;

        // Se a Efí mandar a DataPagamento na notificação, ele entra aqui
        public DateTime? DataPagamento { get; set; }

        // Se a Efí enviar o token de notificação, adicione-o aqui
        public string TokenNotificacao { get; set; } // Exemplo, verifique a doc da Efí

        // Novo: Para suportar o payload da Efí com array de pix
        public List<PixItem>? Pix { get; set; }
    }

    public class PixItem
    {
        public string? EndToEndId { get; set; }
        public string? Txid { get; set; }
        public string? Chave { get; set; }
        public string? Valor { get; set; }
        public string? Horario { get; set; }
        public PixExtras? GnExtras { get; set; }
    }

    public class PixExtras
    {
        public Pagador? Pagador { get; set; }
    }

    public class Pagador
    {
        public string? Nome { get; set; }
        public string? Cpf { get; set; }
        public string? CodigoBanco { get; set; }
    }
}
