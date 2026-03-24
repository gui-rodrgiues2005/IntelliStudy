using Backend.Services;

public class StreamingService
{
    private readonly GeminiService _gemini;

    public StreamingService(GeminiService gemini)
    {
        _gemini = gemini;
    }

    public async IAsyncEnumerable<string> Generate(string prompt, GenerationState state)
    {
        string full = await _gemini.GenerateContentAsync(prompt);

        foreach (char c in full)
        {
            // Se estiver pausado → trava aqui
            if (state.IsPaused)
                state.ResumeEvent.Wait();

            yield return c.ToString();

            await Task.Delay(8); // animação suave
        }
    }
}
