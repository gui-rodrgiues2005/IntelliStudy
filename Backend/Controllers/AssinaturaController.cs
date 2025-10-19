using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.Services;
using Backend.Models;
using System.Security.Claims;
using Backend.Data;

[ApiController]
[Route("api/assinatura")]
public class AssinaturaController : ControllerBase
{
    private readonly EfiPixService _efiBankService;
    private readonly AppDbContext _context;

    public AssinaturaController(EfiPixService efiBankService, AppDbContext context)
    {
        _efiBankService = efiBankService;
        _context = context;
    }

    [HttpGet("efi/token")]
    public async Task<IActionResult> GetToken([FromServices] EfiPixService efi)
    {
        var token = await efi.ObterTokenAsync();
        return Ok(token);
    }


    // [HttpPost("criar")]
    // public async Task<IActionResult> CriarAssinatura([FromBody] string plano)
    // {
    //     var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

    //     // 1. Crie a cobrança/assinatura no Efi Bank
    //     var resultado = await _efiBankService.CriarAssinaturaAsync(userId, plano);

    //     if (!resultado.Sucesso)
    //         return BadRequest(resultado.Mensagem);

    //     // 2. Salve a assinatura no banco
    //     var assinatura = new Assinatura
    //     {
    //         UserId = userId,
    //         Plano = plano,
    //         DataInicio = DateTime.UtcNow,
    //         Status = "Pendente",
    //         EfiSubscriptionId = resultado.SubscriptionId,
    //         Valor = resultado.Valor,
    //         Moeda = "BRL"
    //     };
    //     _context.Assinaturas.Add(assinatura);
    //     await _context.SaveChangesAsync();

    //     // 3. Retorne a URL de checkout para o front
    //     return Ok(new { checkoutUrl = resultado.CheckoutUrl });
    // }
}