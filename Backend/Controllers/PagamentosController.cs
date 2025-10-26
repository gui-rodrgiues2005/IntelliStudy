using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Backend.Services;
using Backend.Data;
using Backend.DTO; // Assumindo que você tem PixWebhookDto, PixConsultaResponse, EfiValorResposta aqui
using Backend.Models;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using System.Text;

public class EfiWebhookPayload
{
    public string? Evento { get; set; }
    public string? Data_Criacao { get; set; }
    public string? Txid { get; set; }
}

[ApiController]
[Route("api/[controller]")]
public class PagamentoController : ControllerBase
{
    private readonly EfiPixService _efiPixService;
    private readonly AppDbContext _context;
    private readonly ILogger<EfiPixService> _logger;
    private readonly IConfiguration _config;
    private readonly IConfiguration _configuration;
    public PagamentoController(EfiPixService efiPixService, AppDbContext context, IConfiguration config, ILogger<EfiPixService> logger, IConfiguration configuration)
    {
        _efiPixService = efiPixService;
        _context = context;
        _config = config;
        _logger = logger;
        _configuration = configuration;
    }

    [Authorize]
    [HttpPost("gerar")]
    public async Task<IActionResult> GerarPagamento([FromBody] GerarPagamentoDto dto)
    {
        // ... (Seu código de GerarPagamento é funcional, mantido inalterado) ...
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            Console.WriteLine("Usuário não autenticado.");
            return Unauthorized();
        }

        var user = await _context.Users.FindAsync(int.Parse(userId));
        if (user == null)
        {
            Console.WriteLine("Usuário não encontrado no banco.");
            return NotFound("Usuário não encontrado.");
        }

        if (string.IsNullOrEmpty(user.Cpf) || string.IsNullOrEmpty(user.Telefone))
        {
            Console.WriteLine("Usuário sem CPF ou telefone.");
            return BadRequest("CPF ou telefone não cadastrado.");
        }

        try
        {
            Console.WriteLine($"Iniciando geração de cobrança Pix para usuário {user.Name} ({user.Cpf})");

            var pixResponse = await _efiPixService.CriarCobrancaPixAsync(
                nome: user.Name,
                cpf: user.Cpf,
                valor: dto.Valor,
                solicitacaoPagador: dto.Descricao
            );

            Console.WriteLine($"Resposta Pix: {JsonSerializer.Serialize(pixResponse)}");

            var pagamento = new PagamentoPix
            {
                UserId = user.Id,
                Txid = pixResponse.Txid,
                Valor = dto.Valor.ToString("F2"),
                PixCopiaECola = pixResponse.PixCopiaECola,
                QrCodeUrl = pixResponse.Loc?.Location ?? "",
                CriadoEm = DateTime.UtcNow,
                Pago = false
            };

            _context.PagamentosPix.Add(pagamento);
            await _context.SaveChangesAsync();
            return Ok(new
            {
                txid = pixResponse.Txid,
                pixCopiaECola = pixResponse.PixCopiaECola,
                qrcodeUrl = pixResponse.Loc?.Location,
                valor = dto.Valor
            });

        }
        catch (Exception ex)
        {
            Console.WriteLine("Erro ao gerar cobrança Pix: " + ex.Message);
            return BadRequest(new { erro = ex.Message });
        }
    }

    [Authorize]
    [HttpGet("meu-pix")]
    public async Task<IActionResult> MeuPix()
    {
        // ... (Seu código de MeuPix é funcional, mantido inalterado) ...
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var user = await _context.Users.FindAsync(int.Parse(userId));
        if (user == null)
            return NotFound(new { mensagem = "Usuário não encontrado." });

        if (string.IsNullOrEmpty(user.Cpf))
            return BadRequest(new { mensagem = "CPF do usuário não cadastrado." });

        var pagamento = await _context.PagamentosPix
            .Where(p => p.UserId == user.Id && !p.Pago)
            .OrderByDescending(p => p.CriadoEm)
            .FirstOrDefaultAsync();

        var agora = DateTime.UtcNow;
        bool expirado = pagamento == null || (agora - pagamento.CriadoEm) > TimeSpan.FromHours(1);


        if (expirado)
        {
            var novoPix = await _efiPixService.CriarCobrancaPixAsync(
                nome: user.Name,
                cpf: user.Cpf,
                valor: 12.00m,
                solicitacaoPagador: "Pagamento do plano IntelliStudy"
            );

            pagamento = new PagamentoPix
            {
                UserId = user.Id,
                Txid = novoPix.Txid,
                Valor = "12.00",
                PixCopiaECola = novoPix.PixCopiaECola,
                QrCodeUrl = novoPix.Loc?.Location ?? "",
                CriadoEm = agora,
                Pago = false
            };

            _context.PagamentosPix.Add(pagamento);
            await _context.SaveChangesAsync();
        }

        return Ok(new
        {
            txid = pagamento.Txid,
            valor = pagamento.Valor,
            pixCopiaECola = pagamento.PixCopiaECola,
            qrcodeUrl = pagamento.QrCodeUrl,
            criadoEm = pagamento.CriadoEm,
            expiracao = (3600 - (agora - pagamento.CriadoEm).TotalSeconds)
        });
    }

    // ==============================================================================
    // ✅ ROTA 1: WEBHOOK (CHAMADA PELA EFÍ) - ATIVA O PLANO
    // ==============================================================================
    public class EfiWebhookPayload
    {
        // O campo 'evento' é o mais importante para identificar o teste da Efí
        public string? Evento { get; set; }
        public string? Data_Criacao { get; set; }
        public string? Txid { get; set; } // Pode ser nulo no caso de teste
    }

    // Endpoint principal do Webhook
    [HttpPost("webhook-pix")]
    [HttpPost("webhook-pix/pix")]
    [AllowAnonymous]
    public async Task<IActionResult> ProcessWebhook([FromBody] JsonElement json)
    {
        try
        {
            // 1️⃣ Verificar token HMAC
            var hmac = Request.Query["hmac"].ToString();
            var tokenConfig = _configuration["WebhookSettings:Token"];

            if (string.IsNullOrEmpty(hmac) || hmac != tokenConfig)
            {
                Console.WriteLine("[WEBHOOK] ❌ Token HMAC inválido ou ausente.");
                return Unauthorized();
            }

            // 2️⃣ Logar IP remoto (opcional)
            var remoteIp = HttpContext.Connection.RemoteIpAddress?.ToString();
            Console.WriteLine($"[WEBHOOK] Chamado por IP: {remoteIp}");

            // 3️⃣ Logar JSON recebido
            var jsonString = json.ToString();
            Console.WriteLine($"[WEBHOOK] Payload recebido: {jsonString}");

            // 4️⃣ Detectar tipo de evento
            if (json.TryGetProperty("evento", out var evento))
            {
                var tipoEvento = evento.GetString();

                if (tipoEvento == "teste_webhook")
                {
                    Console.WriteLine("[WEBHOOK] ✅ Teste de webhook recebido e confirmado.");
                    return Ok();
                }
                else if (tipoEvento == "pix")
                {
                    Console.WriteLine("[WEBHOOK] 💰 Novo pagamento PIX recebido!");
                    // 👉 Aqui você processa os dados do PIX
                    // (ex: atualizar status no banco, gerar pedido, etc.)
                    return Ok();
                }
            }

            Console.WriteLine("[WEBHOOK] ⚠️ Evento desconhecido recebido.");
            return Ok();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[WEBHOOK] ❌ Erro ao processar: {ex.Message}");
            return StatusCode(500, "Erro interno ao processar o webhook.");
        }
    }


    // ==============================================================================
    // ✅ ROTA 2: VERIFICAÇÃO (CHAMADA PELO FRONT-END) - APENAS RETORNA O STATUS
    // ==============================================================================
    // ⚠️ Esta rota DEVE manter o [Authorize]
    [HttpPost("verificar-pagamento")]
    [Authorize]
    public async Task<IActionResult> VerificarPagamento([FromBody] PixWebhookDto dto)
    {
        var pagamento = await _context.PagamentosPix.FirstOrDefaultAsync(p => p.Txid == dto.Txid);
        if (pagamento == null) return Ok(new { pago = false });

        if (pagamento.Pago)
            return Ok(new { pago = true });

        var status = await _efiPixService.VerificarStatusPixAsync(dto.Txid);
        if (status?.Status == "CONCLUIDA")
        {
            pagamento.Pago = true;
            pagamento.DataPagamento = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(new { pago = true });
        }

        return Ok(new { pago = false });
    }

    [HttpPost("registrar-webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> RegistrarWebhook()
    {
        try
        {
            // Pega o token do appsettings.json
            var token = _configuration["WebhookSettings:Token"];

            // Monta a URL pública que a Efí vai chamar
            var webhookUrl = $"https://backend-production-69f3.up.railway.app/api/Pagamento/webhook-pix/pix?hmac={token}";

            // Faz o registro do webhook na Efí
            bool sucesso = await _efiPixService.RegistrarWebhookAsync(
                "rodriguesguidev@gmail.com",
                webhookUrl
            );

            // Retorna um resumo
            return Ok(new
            {
                sucesso,
                urlRegistrada = webhookUrl
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[REGISTRAR WEBHOOK] Erro: {ex.Message}");
            return StatusCode(500, new { erro = "Erro ao registrar webhook.", detalhe = ex.Message });
        }
    }
}
