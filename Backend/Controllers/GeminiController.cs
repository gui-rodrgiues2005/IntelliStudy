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
        if (string.IsNullOrEmpty(request.Content))
            return BadRequest("O conteúdo da matéria não pode ser vazio.");

        var resumo = await _gemini.GerarResumoAsync(request.Content);
        return Ok(new { summary = resumo });
    }

    // Endpoint para gerar simulado
    [HttpPost("quiz")]
    public async Task<IActionResult> GenerateQuiz([FromBody] StudyRequest request)
    {
        if (string.IsNullOrEmpty(request.Content))
            return BadRequest("O conteúdo da matéria não pode ser vazio.");

        var quiz = await _gemini.GerarSimuladoAsync(request.Content, request.NumQuestions);
        return Ok(new { quiz });
    }
}

