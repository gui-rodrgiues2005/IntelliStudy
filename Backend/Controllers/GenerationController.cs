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

        [HttpGet("status/{id}")]
        public async Task<IActionResult> GetStatusDoPedido(int id)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            var pedido = await _context.GenerationRequests.FindAsync(id);

            if (pedido == null || pedido.UserId != userId)
                return NotFound("Pedido não encontrado ou não pertence ao usuário.");

            // 🔹 Pedido concluído
            if (pedido.Status == RequestStatus.Concluido)
            {
                // Busca simulado relacionado (se houver)
                var simulado = await _context.Simulados
                    .AsNoTracking()
                    .FirstOrDefaultAsync(s => s.GenerationRequestId == pedido.Id);

                // Normaliza outputMetadata (pode estar salvo no pedido)
                string outputMetadata = pedido.OutputMetadata ?? (simulado != null
                    ? System.Text.Json.JsonSerializer.Serialize(new { SimuladoId = simulado.Id, RequestId = pedido.Id })
                    : null);

                // Resultado: prioriza questões do Simulado salvo, senão usa OutputTexto do pedido
                var resultado = simulado != null ? simulado.QuestoesJson : pedido.OutputTexto;

                return Ok(new
                {
                    id = pedido.Id,
                    status = (int)pedido.Status,
                    tipo = (int)pedido.Tipo,
                    resultado = resultado, // já em formato JSON/string conforme salvo
                    outputMetadata = outputMetadata
                });
            }

            // Pedido ainda em andamento ou falhou
            return Ok(new
            {
                id = pedido.Id,
                status = (int)pedido.Status,
                tipo = (int)pedido.Tipo,
                mensagemErro = pedido.MensagemErro
            });
        }
    }
}
