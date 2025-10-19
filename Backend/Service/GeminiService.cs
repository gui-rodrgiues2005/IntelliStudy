
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Backend.DTO;
using iText.Kernel.Pdf;
using iText.Kernel.Pdf.Canvas.Parser;
using DocumentFormat.OpenXml.Packaging;
using Microsoft.AspNetCore.Http;
using System.IO;

public class GeminiService
{
    private readonly string _apiKey;
    private readonly HttpClient _http;
    // URL base para os modelos Gemini mais recentes
    private const string GeminiApiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent";

    // public async Task ListModelsAsync()
    // {
    //     var url = "https://generativelanguage.googleapis.com/v1beta/models?key=" + _apiKey;
    //     var response = await _http.GetAsync(url);
    //     var result = await response.Content.ReadAsStringAsync();
    //     Console.WriteLine(result);
    // }

    public GeminiService(string apiKey)
    {
        _apiKey = apiKey;
        _http = new HttpClient();
        // A API do Gemini usa x-goog-api-key no header em vez de Bearer token
        // _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey );
    }

    private async Task<string> GenerateContentAsync(string prompt)
    {
        // Monta a URL completa com a chave de API
        var requestUrl = $"{GeminiApiUrl}?key={_apiKey}";

        // Estrutura de payload correta para a API do Gemini
        var payload = new
        {
            contents = new[]
            {
                new
                {
                    parts = new[]
                    {
                        new { text = prompt }
                    }
                }
            }
        };

        var json = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        var response = await _http.PostAsync(requestUrl, json);

        // Tratamento de erro mais detalhado
        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            // Lança uma exceção com mais detalhes para facilitar o debug
            throw new HttpRequestException($"Erro na API do Gemini: {response.StatusCode} - {errorContent}");
        }

        var resultJson = await response.Content.ReadAsStringAsync();

        // Extrai o texto da resposta JSON complexa
        try
        {
            var jsonNode = JsonNode.Parse(resultJson);
            var generatedText = jsonNode["candidates"][0]["content"]["parts"][0]["text"].GetValue<string>();
            return generatedText;
        }
        catch (Exception ex)
        {
            // Lança uma exceção se a estrutura da resposta não for a esperada
            throw new InvalidOperationException($"Não foi possível extrair o conteúdo da resposta da API. Resposta recebida: {resultJson}", ex);
        }
    }

    // Em Backend/Services/GeminiService.cs

    public async Task<string> GerarResumoAsync(string conteudo)
    {
        // --- PROMPT AJUSTADO ---
        // Removemos a parte "Faça um resumo..." e fomos mais diretos.
        // Adicionamos uma instrução explícita para não incluir introduções.
        var prompt = $"""
        Você é um especialista que cria resumos técnicos. Sua única tarefa é gerar o conteúdo do resumo.
        NÃO inclua frases introdutórias como "Claro, aqui está seu resumo" ou qualquer outra forma de saudação ou comentário.
        Vá direto ao ponto.

        Gere um resumo conciso e bem estruturado sobre o seguinte tópico, destacando os conceitos e termos mais importantes: "{conteudo}"
        """;

        // O resto do método continua igual...
        int maxRetries = 3;
        int delayMs = 2000;

        for (int i = 0; i < maxRetries; i++)
        {
            try
            {
                return await GenerateContentAsync(prompt);
            }
            catch (HttpRequestException ex) when (ex.Message.Contains("503"))
            {
                if (i == maxRetries - 1)
                    throw;

                await Task.Delay(delayMs);
            }
        }

        throw new InvalidOperationException("Falha inesperada ao gerar resumo.");
    }

    public async Task<string> ExtractTextAsync(IFormFile file)
    {
        string extension = Path.GetExtension(file.FileName).ToLower();
        string text = "";

        if (extension == ".pdf")
        {
            using var reader = new PdfReader(file.OpenReadStream());
            using var pdf = new PdfDocument(reader);
            for (int i = 1; i <= pdf.GetNumberOfPages(); i++)
                text += PdfTextExtractor.GetTextFromPage(pdf.GetPage(i));
        }
        else if (extension == ".docx")
        {
            using var doc = WordprocessingDocument.Open(file.OpenReadStream(), false);
            text = doc.MainDocumentPart.Document.Body.InnerText;
        }

        return text;
    }

    public async Task<string> GenerateSummaryAsync(string text)
    {
        var client = new HttpClient();
        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {_apiKey}");

        var body = new
        {
            contents = new[]
            {
        new
        {
            parts = new[]
            {
                new { text = "Resuma o texto de forma clara e organizada:\n\n" + text }
            }
        }
    }
        };

        var response = await client.PostAsJsonAsync("https://api.openai.com/v1/chat/completions", body);
        var result = await response.Content.ReadFromJsonAsync<JsonElement>();

        return result.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
    }



    // Em Services/GeminiService.cs

    // Em Services/GeminiService.cs

    public async Task<string> GerarSimuladoAsync(string conteudoDoResumo, int numQuestoes)
    {
        // Prompt MUITO mais rígido e explícito
        var prompt = $"Você é uma API. Sua única função é retornar dados no formato JSON. " +
                     $"NÃO inclua nenhuma introdução, explicação, ou formatação Markdown como '```json'. " +
                     $"Responda APENAS com o array JSON. " +
                     $"Com base no seguinte resumo: \"{conteudoDoResumo}\"\n\n" +
                     $"Crie um array JSON com exatamente {numQuestoes} objetos. Cada objeto deve ter a seguinte estrutura: " +
                     $"{{ \"pergunta\": \"...\", \"alternativas\": [\"A\", \"B\", \"C\", \"D\"], \"respostaCorreta\": \"...\" }}. " +
                     $"A 'respostaCorreta' deve ser um dos itens exatos do array 'alternativas'.";

        return await GenerateContentAsync(prompt);
    }

    public async Task<string> GerarCronogramaAsync(CriarPlanoRequestDto request)
    {
        // 1. CONSTRUÇÃO DO PROMPT DETALHADO
        var prompt = $"""
    Você é um planejador de estudos especialista. Sua tarefa é criar um cronograma de estudos semanal em formato JSON.

    **Instruções para o JSON de saída:**
    - O JSON deve ser um OBJETO com uma única chave principal chamada "cronogramaSemanal".
    - O valor de "cronogramaSemanal" deve ser um array de 7 objetos, um para cada dia da semana.
    - Cada objeto de dia deve ter duas propriedades: "dia" (um número de 1 para Segunda a 7 para Domingo) e "sessoes" (um array de objetos de sessão).
    - Cada objeto de sessão deve ter duas propriedades: "topico" (string) e "duracao" (número).
    - Se um dia não tiver estudo, o array "sessoes" deve estar vazio.
    - **NÃO inclua nenhum texto, explicação ou formatação de markdown (```json) antes ou depois do JSON. A saída deve ser APENAS o JSON puro.**

    **Dados do Aluno:**
    - **Objetivo Principal:** {request.Meta}
    - **Data da Prova:** {request.DataProva.ToString("dd/MM/yyyy")}
    - **Tópicos a Cobrir:** {string.Join(", ", request.Materias)}
    - **Total de Horas de Estudo por Semana:** {request.HorasPorSemana}

    **Tarefa:**
    Com base nos dados do aluno, distribua os tópicos de forma equilibrada ao longo da semana. Gere o cronograma no formato de OBJETO JSON especificado.
    """;

        string respostaBrutaDaIA = await GenerateContentAsync(prompt);

        // --- INÍCIO DA MUDANÇA ---

        // 2. LIMPEZA DA RESPOSTA
        // Remove os blocos de código markdown (```json e ```) e espaços em branco extras.
        var respostaLimpa = respostaBrutaDaIA
            .Trim() // Remove espaços no início e no fim
            .Replace("```json", "") // Remove o início do bloco de código
            .Replace("```", ""); // Remove o fim do bloco de código

        // 3. RETORNO DA STRING JSON LIMPA
        return respostaLimpa.Trim();
    }
}
