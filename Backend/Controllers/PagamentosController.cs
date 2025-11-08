using Microsoft.AspNetCore.Mvc;
using Backend.Data;
using Microsoft.AspNetCore.Authorization;
using Stripe;
using Stripe.Checkout;
using Backend.Models;

[ApiController]
[Route("api/[controller]")]
public class PagamentoController : ControllerBase
{
    private readonly IConfiguration _config;
    private readonly AppDbContext _context;

    public PagamentoController(IConfiguration config, AppDbContext context)
    {
        _config = config;
        _context = context;
    }

    // DTO atualizado com o nome do plano
    public class CriarCheckoutDto
    {
        public int UserId { get; set; }
        public decimal Valor { get; set; }
        public string Plano { get; set; } = string.Empty;
    }

    // -----------------------------
    // 🟢 Criar sessão de pagamento
    // -----------------------------
    [HttpPost("criar-checkout")]
    public IActionResult CriarCheckout([FromBody] CriarCheckoutDto dto)
    {
        try
        {
            Console.WriteLine($"[LOG] Criando checkout: UserId={dto.UserId}, Plano={dto.Plano}, Valor={dto.Valor}");

            var secretKey = _config["Stripe:SecretKey"];
            if (string.IsNullOrEmpty(secretKey))
                return BadRequest("Stripe SecretKey não configurada");

            StripeConfiguration.ApiKey = secretKey;

            var successUrl = _config["Stripe:SuccessUrl"];
            var cancelUrl = _config["Stripe:CancelUrl"];

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
                                Name = $"Assinatura {dto.Plano}"
                            }
                        },
                        Quantity = 1
                    }
                },
                Mode = "payment",
                SuccessUrl = $"{successUrl}?session_id={{CHECKOUT_SESSION_ID}}",
                CancelUrl = cancelUrl,
                Metadata = new Dictionary<string, string>
                {
                    { "UserId", dto.UserId.ToString() },
                    { "Plano", dto.Plano },
                    { "Valor", dto.Valor.ToString("F2") }
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
            return BadRequest($"Erro ao criar checkout: {ex.Message}");
        }
    }

    // -----------------------------
    // 🟣 Webhook do Stripe
    // -----------------------------
    [HttpPost("webhook-stripe")]
    [AllowAnonymous]
    public async Task<IActionResult> WebhookStripe()
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
                if (session == null)
                {
                    Console.WriteLine("[WEBHOOK] Sessão nula, ignorando...");
                    return Ok();
                }

                var userId = int.Parse(session.Metadata["UserId"]);
                var plano = session.Metadata["Plano"];
                var valor = decimal.Parse(session.Metadata["Valor"]);

                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    Console.WriteLine($"[WEBHOOK] Usuário {userId} não encontrado!");
                    return NotFound();
                }

                // Console.WriteLine($"[WEBHOOK] Pagamento confirmado para o usuário {user.Nome}, plano: {plano}");

                // Atualiza o plano e data de expiração
                user.Plano = plano;
                user.PlanoExpiraEm = DateTime.UtcNow.AddMonths(1);
                user.UltimoPagamento = DateTime.UtcNow;

                // Salva registro de pagamento
                _context.PagamentosCartao.Add(new PagamentoCartao
                {
                    UserId = user.Id,
                    TransactionId = session.Id,
                    Valor = valor,
                    Metodo = "Stripe",
                    Pago = true,
                    DataPagamento = DateTime.UtcNow
                });

                await _context.SaveChangesAsync();

                Console.WriteLine($"[WEBHOOK] Plano {plano} aplicado com sucesso ao usuário {user.Id}");
            }

            return Ok();
        }
        catch (StripeException e)
        {
            Console.WriteLine($"[WEBHOOK ERROR] StripeException: {e.Message}");
            return BadRequest();
        }
        catch (Exception e)
        {
            Console.WriteLine($"[WEBHOOK ERROR] Exceção geral: {e.Message}");
            return BadRequest();
        }
    }

    // -----------------------------
    // 🟡 Confirmação manual (callback)
    // -----------------------------
    [HttpPost("confirmar-session")]
    [AllowAnonymous]
    public IActionResult ConfirmarSession([FromBody] dynamic body)
    {
        StripeConfiguration.ApiKey = _config["Stripe:SecretKey"];
        var sessionId = (string)body.sessionId;

        var service = new SessionService();
        var session = service.Get(sessionId);

        var plano = session.Metadata.ContainsKey("Plano") ? session.Metadata["Plano"] : "Desconhecido";

        if (session.PaymentStatus == "paid")
            return Ok(new { status = "Pago", plano });

        return BadRequest(new { status = "Não pago" });
    }
}
