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

    public PagamentoController(EfiPixService efiPixService, AppDbContext context)
    {
        _efiPixService = efiPixService;
        _context = context;
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
    [AllowAnonymous]
    public async Task<IActionResult> WebhookPix()
    {
        return await ProcessWebhook();
    }

    // Endpoint alternativo que a EfiBank usa (adiciona /pix automaticamente)
    [HttpPost("webhook-pix")]
    [AllowAnonymous]
    private async Task<IActionResult> ProcessWebhook()
    {
        Console.WriteLine("=================================================");
        Console.WriteLine($"[WEBHOOK INÍCIO] Requisição POST recebida em {DateTime.Now}");

        string jsonContent = string.Empty;
        EfiWebhookPayload? payload = null;

        try
        {
            // 1. Leia o corpo da requisição manualmente
            Request.EnableBuffering();
            Request.Body.Position = 0;

            using (var reader = new StreamReader(Request.Body, Encoding.UTF8, true, 1024, true))
            {
                jsonContent = await reader.ReadToEndAsync();
            }

            // Log do que foi recebido
            Console.WriteLine($"[WEBHOOK] JSON recebido ({jsonContent.Length} bytes): {jsonContent}");

            // Se o corpo estiver vazio, retorna OK.
            if (string.IsNullOrEmpty(jsonContent))
            {
                Console.WriteLine("[WEBHOOK] Corpo da requisição vazio. Retornando 200 OK.");
                return Ok();
            }

            // 2. Tenta desserializar para o payload genérico da Efí
            try
            {
                payload = JsonSerializer.Deserialize<EfiWebhookPayload>(jsonContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
            }
            catch (JsonException jsonEx)
            {
                // Se a desserialização falhar, é um JSON malformado ou não esperado.
                // Retorna 200 OK para evitar retries.
                Console.WriteLine($"[WEBHOOK ERRO DESSERIALIZAÇÃO] Falha ao desserializar JSON. Detalhe: {jsonEx.Message}");
                return Ok();
            }

            // ======================================================================
            // AJUSTE CRÍTICO: TRATAMENTO DO PAYLOAD DE TESTE DA EFÍ
            // ======================================================================

            // O payload de teste da Efí é: {"evento":"teste_webhook","data_criacao":"..."}
            if (payload != null && payload.Evento?.ToLower() == "teste_webhook")
            {
                // Retorna 200 OK imediatamente para validar o registro do webhook.
                Console.WriteLine("[WEBHOOK] Recebido payload de teste (evento: teste_webhook). Retornando 200 OK.");
                return Ok();
            }

            // ======================================================================
            // LÓGICA DE PROCESSAMENTO DE NOTIFICAÇÃO REAL (Pix Pago)
            // ======================================================================

            // Tenta desserializar para o DTO completo
            // Assumindo que você tem o PixWebhookDto definido
            PixWebhookDto? dto = JsonSerializer.Deserialize<PixWebhookDto>(jsonContent, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            string txidToProcess = string.Empty;

            // Verifica se o payload tem Txid direto ou dentro do array Pix
            if (dto != null && !string.IsNullOrEmpty(dto.Txid))
            {
                txidToProcess = dto.Txid;
            }
            else if (dto != null && dto.Pix != null && dto.Pix.Count > 0)
            {
                // Pega o primeiro item do array Pix
                var pixItem = dto.Pix.First();
                txidToProcess = pixItem.Txid ?? string.Empty;
                Console.WriteLine($"[WEBHOOK] Txid extraído do array Pix: {txidToProcess}");
            }

            if (string.IsNullOrEmpty(txidToProcess))
            {
                Console.WriteLine("[WEBHOOK] Payload recebido não é de teste e não contém Txid (nem direto nem no array Pix). Ignorando.");
                return Ok();
            }

            Console.WriteLine($"[WEBHOOK] INÍCIO DO PROCESSO DE PAGAMENTO para Txid: {txidToProcess}");

            // 1. Consulta e Validação de Status na Efí
            var statusEfi = await _efiPixService.VerificarStatusPixAsync(txidToProcess);

            // NOVO LOG: Status retornado
            Console.WriteLine($"[WEBHOOK] Status da Efí para {txidToProcess}: {statusEfi?.Status ?? "NULO"}");

            // Verifica se o status é CONCLUIDA
            if (statusEfi == null || statusEfi.Status != "CONCLUIDA")
            {
                Console.WriteLine($"[WEBHOOK] Pagamento {txidToProcess} não concluído ou expirado. Abortando.");
                return Ok();
            }

            Console.WriteLine($"[WEBHOOK] Pagamento {txidToProcess} CONCLUIDA. Iniciando ativação do plano.");

            // 2. Busca o Pagamento no Seu DB
            // Assumindo que PagamentoPix é o seu modelo de EF Core
            var pagamento = await _context.PagamentosPix
                .FirstOrDefaultAsync(p => p.Txid == txidToProcess);

            if (pagamento == null)
            {
                Console.WriteLine($"[WEBHOOK] ERRO: Txid {txidToProcess} CONCLUIDA na Efí, mas não encontrado no DB.");
                return Ok();
            }

            // 3. Processamento de Pagamento (Se ainda não foi pago)
            // Assumindo que seu modelo PagamentoPix tem uma propriedade 'Pago'
            if (!pagamento.Pago)
            {
                // Sua lógica de atualização do DB e do Usuário
                pagamento.Pago = true;
                pagamento.DataPagamento = DateTime.UtcNow;

                // Busca o usuário e ativa o plano Premium
                var user = await _context.Users.FindAsync(pagamento.UserId);
                if (user != null)
                {
                    user.Plano = "Premium";
                    user.PlanoExpiraEm = DateTime.UtcNow.AddMonths(1);
                    user.UltimoPagamento = DateTime.UtcNow;
                    Console.WriteLine($"[WEBHOOK] Plano do usuário {user.Id} ({user.Name}) atualizado para 'Premium' (expira em {user.PlanoExpiraEm}).");
                }

                await _context.SaveChangesAsync();
                Console.WriteLine($"[WEBHOOK] DB atualizado. Plano Premium ativado para o usuário.");
            }
            else
            {
                Console.WriteLine($"[WEBHOOK] Pagamento {txidToProcess} já estava marcado como pago. Ignorando notificação duplicada.");
            }

            Console.WriteLine($"[WEBHOOK] Processamento finalizado com sucesso para {txidToProcess}.");
            return Ok();

        }
        catch (Exception ex)
        {
            // Tratamento de qualquer outra exceção
            Console.WriteLine($"[WEBHOOK] ERRO CRÍTICO (internamente). Detalhe: {ex.GetType().Name}: {ex.Message}");
            Console.WriteLine($"[WEBHOOK] JSON que causou o erro: {jsonContent}");

            // Retorne OK para evitar loops de retry da Efí, mesmo em caso de falha interna.
            return Ok();
        }
        finally
        {
            Console.WriteLine("=================================================");
        }
    }

    // ==============================================================================
    // ✅ ROTA 2: VERIFICAÇÃO (CHAMADA PELO FRONT-END) - APENAS RETORNA O STATUS
    // ==============================================================================
    // ⚠️ Esta rota DEVE manter o [Authorize]
    [HttpPost("verificar-pagamento")]
    public async Task<IActionResult> VerificarPagamento([FromBody] PixWebhookDto dto)
    {
        Console.WriteLine("============================================");
        Console.WriteLine($"🧾 [VERIFICAR PAGAMENTO] Início da verificação - {DateTime.Now}");
        Console.WriteLine($"🔹 Txid recebido: {dto.Txid}");
        Console.WriteLine("============================================");

        // 1️⃣ Busca o pagamento no banco
        var pagamento = await _context.PagamentosPix
            .FirstOrDefaultAsync(p => p.Txid == dto.Txid);

        if (pagamento == null)
        {
            Console.WriteLine($"⚠️ Pagamento com Txid={dto.Txid} não encontrado no banco.");
        }
        else
        {
            Console.WriteLine($"📦 Pagamento encontrado. Status atual: {(pagamento.Pago ? "Pago" : "Pendente")}");
        }

        // 2️⃣ Se já estiver pago, retorna OK
        if (pagamento != null && pagamento.Pago)
        {
            Console.WriteLine($"✅ Pagamento {dto.Txid} já foi confirmado anteriormente.");
            Console.WriteLine("============================================");
            return Ok(new { pago = true });
        }

        // 3️⃣ Consulta o status real na Efí
        Console.WriteLine($"🔍 Consultando status do Pix na Efi (txid={dto.Txid})...");
        var statusEfi = await _efiPixService.VerificarStatusPixAsync(dto.Txid);

        if (statusEfi == null)
        {
            Console.WriteLine("❌ Erro: não foi possível obter status da Efí (retornou nulo).");
            Console.WriteLine("============================================");
            return Ok(new { pago = false });
        }

        Console.WriteLine($"📨 Status retornado pela Efí: {statusEfi.Status}");

        // 4️⃣ Se estiver concluído, ativa o plano
        if (statusEfi.Status == "CONCLUIDA")
        {
            Console.WriteLine($"✅ Pagamento {dto.Txid} confirmado na Efí. Ativando plano...");

            if (pagamento != null && !pagamento.Pago)
            {
                pagamento.Pago = true;
                pagamento.DataPagamento = DateTime.UtcNow;

                var user = await _context.Users.FindAsync(pagamento.UserId);
                if (user != null)
                {
                    user.Plano = "Premium";
                    user.PlanoExpiraEm = DateTime.UtcNow.AddMonths(1);
                    user.UltimoPagamento = DateTime.UtcNow;
                    Console.WriteLine($"🎉 Plano do usuário {user.Id} ({user.Name}) atualizado para 'Premium' (expira em {user.PlanoExpiraEm}).");
                }

                await _context.SaveChangesAsync();
                Console.WriteLine($"💾 Banco atualizado com sucesso para Txid={dto.Txid}.");
            }

            Console.WriteLine("============================================");
            return Ok(new { pago = true });
        }

        // 5️⃣ Se ainda não estiver concluído
        Console.WriteLine($"⌛ Pagamento {dto.Txid} ainda não foi concluído (status={statusEfi.Status}).");
        Console.WriteLine("============================================");
        return Ok(new { pago = false });
    }
}
