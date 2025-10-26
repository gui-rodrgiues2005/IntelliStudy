using Microsoft.AspNetCore.Mvc;
using Backend.Data;
using Microsoft.AspNetCore.Authorization;
using Stripe;
using Stripe.Checkout;

[ApiController]
[Route("api/[controller]")]
public class PagamentoController : ControllerBase
{
    private readonly IConfiguration _config;
    public PagamentoController(IConfiguration config)
    {
        _config = config;
    }

    public class CriarCheckoutDto
    {
        public int UserId { get; set; }
        public decimal Valor { get; set; }
    }

    [HttpPost("criar-checkout")]
    public IActionResult CriarCheckout([FromBody] CriarCheckoutDto dto)
    {
        try
        {
            Console.WriteLine($"[LOG] Criando checkout para UserId: {dto.UserId}, Valor: {dto.Valor}");

            var secretKey = _config["Stripe:SecretKey"];
            if (string.IsNullOrEmpty(secretKey))
            {
                Console.WriteLine("[ERROR] Stripe SecretKey não configurada");
                return BadRequest("Stripe SecretKey não configurada");
            }

            StripeConfiguration.ApiKey = secretKey;

            var successUrl = _config["Stripe:SuccessUrl"];
            var cancelUrl = _config["Stripe:CancelUrl"];

            Console.WriteLine($"[LOG] SuccessUrl: {successUrl}, CancelUrl: {cancelUrl}");

            var options = new SessionCreateOptions
            {
                PaymentMethodTypes = new List<string> { "card" },
                LineItems = new List<SessionLineItemOptions>
            {
                new SessionLineItemOptions
                {
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        UnitAmount = (long)(dto.Valor * 100),
                        Currency = "brl",
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name = "Assinatura Premium"
                        }
                    },
                    Quantity = 1
                }
            },
                Mode = "payment",
                SuccessUrl = successUrl + "?session_id={CHECKOUT_SESSION_ID}",
                CancelUrl = cancelUrl,
                Metadata = new Dictionary<string, string>
                {
                    { "UserId", dto.UserId.ToString() }
                }
            };

            var service = new SessionService();
            var session = service.Create(options);

            Console.WriteLine($"[LOG] Sessão criada com sucesso: {session.Id}");

            return Ok(new { sessionId = session.Id });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERROR] Erro ao criar checkout: {ex.Message}");
            Console.WriteLine($"[ERROR] StackTrace: {ex.StackTrace}");
            return BadRequest($"Erro ao criar checkout: {ex.Message}");
        }
    }

    public class CheckoutRequest
    {
        public int UserId { get; set; }
        public decimal Valor { get; set; }
    }

    [HttpPost("webhook-stripe")]
    [AllowAnonymous]
    public async Task<IActionResult> WebhookStripe([FromServices] AppDbContext _context)
    {
        var json = await new StreamReader(Request.Body).ReadToEndAsync();
        var webhookSecret = _config["Stripe:WebhookSecret"];

        try
        {
            var stripeEvent = EventUtility.ConstructEvent(json, Request.Headers["Stripe-Signature"], webhookSecret);
            Console.WriteLine($"[WEBHOOK] Evento recebido: {stripeEvent.Type}");

            if (stripeEvent.Type == "checkout.session.completed")
            {
                var session = stripeEvent.Data.Object as Session;

                var userId = int.Parse(session.Metadata["UserId"]);
                var user = await _context.Users.FindAsync(userId);

                if (user != null)
                {
                    user.Plano = "Premium";
                    user.PlanoExpiraEm = DateTime.UtcNow.AddMonths(1);
                    user.UltimoPagamento = DateTime.UtcNow;

                    _context.PagamentosCartao.Add(new PagamentoCartao
                    {
                        UserId = user.Id,
                        TransactionId = session.Id,
                        Valor = (decimal)session.AmountTotal / 100,
                        Metodo = "Stripe",
                        Pago = true,
                        DataPagamento = DateTime.UtcNow
                    });

                    await _context.SaveChangesAsync();
                }
            }

            if (stripeEvent.Type == "checkout.session.completed")
            {
                Console.WriteLine("[WEBHOOK] Pagamento confirmado, atualizando plano do usuário...");
            }


            return Ok();
        }
        catch (StripeException e)
        {
            return BadRequest();
        }
    }

    [HttpPost("confirmar-session")]
    [AllowAnonymous]
    public IActionResult ConfirmarSession([FromBody] dynamic body)
    {
        StripeConfiguration.ApiKey = _config["Stripe:SecretKey"];
        var sessionId = (string)body.sessionId;
        var service = new SessionService();
        var session = service.Get(sessionId);

        if (session.PaymentStatus == "paid")
            return Ok(new { status = "Pago", plano = "Premium" });

        return BadRequest(new { status = "Não pago" });
    }
}
