using Microsoft.AspNetCore.Mvc;
using Backend.Models;

[ApiController]
[Route("api/study")]
public class StudyController : ControllerBase
{
    private readonly GeminiService _gemini;

    public StudyController(GeminiService gemini)
    {
        _gemini = gemini;
    }

    [HttpPost("summary")]
    public async Task<IActionResult> GenerateSummary([FromBody] StudyRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
            return BadRequest(new
            {
                success = false,
                message = "O conteúdo da matéria não pode ser vazio."
            });

        try
        {
            // Mantém o tipo "Resumo" interno no método para não quebrar a plataforma
            string resumo = await _gemini.GerarConteudoAsync(request.Content, "Resumo");

            return Ok(new
            {
                success = true,
                summary = resumo
            });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                success = false,
                message = "Erro ao gerar resumo.",
                detalhe = ex.Message
            });
        }
    }

    [HttpPost("quiz")]
    public async Task<IActionResult> GenerateQuiz([FromBody] StudyRequest request)
    {
        if (string.IsNullOrEmpty(request.Content))
            return BadRequest("O conteúdo da matéria não pode ser vazio.");

        var quiz = await _gemini.GerarSimuladoAsync(request.Content, request.NumQuestions);
        return Ok(new { quiz });
    }
}

