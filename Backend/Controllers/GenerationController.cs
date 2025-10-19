// Em Backend/Controllers/GenerationController.cs

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Backend.Data;
using Backend.Models;

namespace Backend.Controllers
{
    [Route("api/generation")]
    [ApiController]
    [Authorize]
    public class GenerationController : ControllerBase
    {
        private readonly AppDbContext _context;

        public GenerationController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/generation/status/{id}
        [HttpGet("status/{id}")]
        public async Task<IActionResult> GetStatusDoPedido(int id)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            var pedido = await _context.GenerationRequests.FindAsync(id);

            if (pedido == null || pedido.UserId != userId)
            {
                return NotFound("Pedido não encontrado ou não pertence ao usuário.");
            }

            // Se o pedido estiver concluído, retornamos o resultado completo
            if (pedido.Status == RequestStatus.Concluido)
            {
                return Ok(new
                {
                    pedido.Id,
                    pedido.Status,
                    pedido.Tipo,
                    Resultado = pedido.OutputTexto // O resultado gerado pela IA
                });
            }

            // Se ainda estiver pendente, processando, ou se falhou, retornamos apenas o status
            return Ok(new
            {
                pedido.Id,
                pedido.Status,
                pedido.Tipo,
                MensagemErro = pedido.MensagemErro
            });
        }
    }
}
