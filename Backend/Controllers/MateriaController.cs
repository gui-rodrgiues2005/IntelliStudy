using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Backend.DTO;
using System.Security.Claims;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Protege todos os endpoints
    public class MateriaController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MateriaController(AppDbContext context)
        {
            _context = context;
        }

        // POST: api/materia
        [HttpPost]
        public async Task<IActionResult> CriarMateria([FromBody] MateriaCreateDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            var materia = new Materia
            {
                UserId = userId,
                Titulo = dto.Titulo,
                Conteudo = dto.Conteudo,
                CreatedAt = DateTime.UtcNow
            };

            _context.Materias.Add(materia);
            await _context.SaveChangesAsync();

            var materiaDto = new MateriaDto
            {
                Id = materia.Id,
                Titulo = materia.Titulo,
                Conteudo = materia.Conteudo,
                CreatedAt = materia.CreatedAt,
                Resumos = new List<ResumoDto>(),
                Simulados = new List<SimuladoDto>()
            };

            return Ok(materiaDto);
        }

        // // GET: api/materia
        // [HttpGet]
        // public async Task<IActionResult> GetMaterias()
        // {
        //     var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
        //     var materias = await _context.Materias
        //   .Where(m => m.UserId == userId)
        //   .Select(m => new MateriaDto
        //   {
        //       Id = m.Id,
        //       Titulo = m.Titulo,
        //       Conteudo = m.Conteudo,
        //       CreatedAt = m.CreatedAt,
        //       Resumos = m.Resumos.Select(r => new ResumoDto
        //       {
        //           Id = r.Id,
        //           ResumoTexto = r.ResumoTexto,
        //           TopicosJson = r.TopicosJson,
        //           CreatedAt = r.CreatedAt
        //       }).ToList(),
        //       Simulados = new List<SimuladoDto>() // depois você completa
        //   })
        //   .ToListAsync();
        //     return Ok(materias);

        // }

        // GET: api/materia/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetMateria(int id)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var materia = await _context.Materias
                .Include(m => m.Resumos)
                .Include(m => m.Simulados)
                .FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId);

            if (materia == null) return NotFound();
            return Ok(materia);
        }

        // PUT: api/materia/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> AtualizarMateria(int id, [FromBody] Materia updated)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var materia = await _context.Materias.FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId);
            if (materia == null) return NotFound();

            materia.Titulo = updated.Titulo;
            materia.Conteudo = updated.Conteudo;
            await _context.SaveChangesAsync();
            return Ok(materia);
        }

        // DELETE: api/materia/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletarMateria(int id)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var materia = await _context.Materias.FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId);
            if (materia == null) return NotFound();

            _context.Materias.Remove(materia);
            await _context.SaveChangesAsync();
            return Ok();
        }

        // // POST: api/materia/{id}/resumo
        // [HttpPost("{id}/resumo")]
        // public async Task<IActionResult> GerarResumo(int id)
        // {
        //     var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

        //     // Pega a matéria do usuário
        //     var materia = await _context.Materias
        //         .Include(m => m.Resumos)
        //         .FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId);

        //     if (materia == null) return NotFound("Matéria não encontrada.");

        //     // Aqui você chamaria a API de IA
        //     // Exemplo simplificado (substituir por chamada real)
        //     var resumoTexto = $"Resumo automático da matéria: {materia.Conteudo[..Math.Min(100, materia.Conteudo.Length)]}...";
        //     var topicosJson = "[\"Tópico 1\", \"Tópico 2\"]";

        //     var resumo = new Resumo
        //     {
        //         MateriaId = materia.Id,
        //         ResumoTexto = resumoTexto,
        //         TopicosJson = topicosJson,
        //         CreatedAt = DateTime.UtcNow
        //     };

        //     _context.Resumos.Add(resumo);
        //     await _context.SaveChangesAsync();

        //     return Ok(resumo);
        // }

        // GET: api/materia/{id}/resumo
        // [HttpGet("{id}/resumo")]
        // public async Task<IActionResult> GetResumo(int id)
        // {
        //     var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

        //     var resumo = await _context.Resumos
        //         .Include(r => r.Materia)
        //         .FirstOrDefaultAsync(r => r.MateriaId == id && r.Materia.UserId == userId);

        //     if (resumo == null) return NotFound("Resumo não encontrado.");

        //     return Ok(resumo);
        // }
    }
}
