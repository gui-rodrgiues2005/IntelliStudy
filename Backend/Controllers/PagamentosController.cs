using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Backend.Services;
using Backend.Data;
using Backend.DTO;
using Backend.Models;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

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
        bool expirado = pagamento == null || (agora - pagamento.CriadoEm).TotalSeconds > 3600;

        if (expirado)
        {
            var novoPix = await _efiPixService.CriarCobrancaPixAsync(
                nome: user.Name,
                cpf: user.Cpf,
                valor: 10.00m, 
                solicitacaoPagador: "Pagamento do plano IdeiaFish"
            );

            pagamento = new PagamentoPix
            {
                UserId = user.Id,
                Txid = novoPix.Txid,
                Valor = "10.00",
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
}
