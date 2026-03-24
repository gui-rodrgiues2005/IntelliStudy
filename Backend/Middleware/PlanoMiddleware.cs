using System.Security.Claims;
using Backend.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Middleware
{
    public class PlanoMiddleware
    {
        private readonly RequestDelegate _next;

        public PlanoMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, AppDbContext db)
        {
            // Só verifica se o usuário está autenticado
            if (context.User.Identity?.IsAuthenticated == true)
            {
                var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (int.TryParse(userId, out int id))
                {
                    var user = await db.Users.FirstOrDefaultAsync(u => u.Id == id);

                    if (user != null && user.PlanoExpiraEm.HasValue)
                    {
                        //Verifica se já passou da data de expiração
                        if (user.PlanoExpiraEm.Value < DateTime.UtcNow && user.Ativo)
                        {
                            user.Plano = "Gratuito";
                            user.Ativo = false;
                            await db.SaveChangesAsync();

                            Console.WriteLine($"[PlanoMiddleware] Plano expirado para o usuário {user.Email}. Rebaixado para Gratuito.");
                        }
                    }
                }
            }

            // Continua o pipeline
            await _next(context);
        }
    }
}
