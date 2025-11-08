
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
    private readonly HttpClient _http;
    private readonly string _apiKey;
    private readonly ILogger<GeminiService> _logger;
    // URL base para os modelos Gemini mais recentes
    // private const string GeminiApiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent";
    private const string GeminiApiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";


    // public async Task ListModelsAsync()
    // {
    //     var url = $"https://generativelanguage.googleapis.com/v1beta/models?key={_apiKey}";
    //     var response = await _http.GetAsync(url);
    //     var result = await response.Content.ReadAsStringAsync();

    //     if (!response.IsSuccessStatusCode)
    //     {
    //         Console.WriteLine($"Erro ao listar modelos: {response.StatusCode} - {result}");
    //         return;
    //     }

    //     Console.WriteLine("Modelos disponíveis:");
    //     Console.WriteLine(result);
    // }

    public GeminiService(HttpClient http, string apiKey, ILogger<GeminiService> logger)
    {
        _http = http;
        _apiKey = apiKey;
        _logger = logger;
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

    public async Task<string> GerarConteudoAsync(string conteudo, string tipo)
    {
        string prompt = tipo switch
        {
            "Resumo" => $"""
Você é um professor especialista em transformar textos complexos em **resumos detalhados, claros e envolventes**, que realmente ajudem o estudante a compreender e aplicar o conteúdo.  

**Objetivo:** Criar um resumo que:  
- Destaque os pontos mais importantes de forma clara e estruturada;  
- Explique conceitos difíceis com exemplos práticos ou analogias simples;  
- Mostre aplicações do conhecimento na prática, quando possível;  
- Seja direto e didático, mas sem perder profundidade.  

Não se limite a frases curtas; priorize clareza e compreensão completa.  

Conteúdo a ser resumido:
{conteudo}
""",


            "PerguntaDireta" => $"""
Responda a seguinte pergunta de forma **curta, direta e objetiva**, sem rodeios ou explicações desnecessárias:  

{conteudo}
""",

            "PesquisaCientifica" => $"""
Produza uma resposta com **estilo científico**, usando termos técnicos precisos, linguagem formal e, se possível, referências ou citações curtas.  
O texto deve ser informativo, detalhado e bem estruturado, mantendo clareza.  

Conteúdo base:
{conteudo}
""",

            "EstudarParaProva" => $"""
Você é um professor dedicado a ajudar alunos a se prepararem para provas.  
Cumprimente o aluno de forma amigável e motivadora, por exemplo: "Beleza, vou te ajudar a gabaritar a prova!".  

**Objetivo:**  
1. Revise o conteúdo abaixo de forma clara, resumida e didática, explicando os pontos mais importantes para facilitar a compreensão.  
2. Mantenha uma linguagem motivadora e direta, preparando o aluno para estudar.  
3. Oriente o aluno que **os simulados e perguntas práticas serão criados na seção abaixo**, então aqui apenas faça a revisão do conteúdo.  

Conteúdo a ser revisado:
{conteudo}
""",

            _ => conteudo
        };


        int maxRetries = 3;
        int delayMs = 2000;

        for (int i = 0; i < maxRetries; i++)
        {
            try
            {
                var result = await GenerateContentAsync(prompt);
                _logger.LogInformation("🧠 Gemini gerou conteúdo com sucesso. Tipo: {Tipo}, Tamanho: {Tamanho}", tipo, result?.Length ?? 0);
                return result;
            }
            catch (HttpRequestException ex) when (ex.Message.Contains("503"))
            {
                _logger.LogWarning("⚠️ Gemini temporariamente indisponível. Tentativa {Tentativa}/{Total}", i + 1, maxRetries);

                if (i == maxRetries - 1)
                    throw;

                await Task.Delay(delayMs);
            }
        }

        throw new InvalidOperationException("Falha inesperada ao gerar conteúdo.");
    }


    public async Task<string> ExtractTextAsync(IFormFile file)
    {
        string extension = Path.GetExtension(file.FileName).ToLower();
        string text = "";

        try
        {
            switch (extension)
            {
                // 🧾 PDF
                case ".pdf":
                    using (var reader = new PdfReader(file.OpenReadStream()))
                    using (var pdf = new PdfDocument(reader))
                    {
                        StringBuilder pdfText = new StringBuilder();
                        for (int i = 1; i <= pdf.GetNumberOfPages(); i++)
                            pdfText.Append(PdfTextExtractor.GetTextFromPage(pdf.GetPage(i)));
                        text = pdfText.ToString();
                    }
                    break;

                // 📝 DOCX
                case ".docx":
                    using (var doc = WordprocessingDocument.Open(file.OpenReadStream(), false))
                    {
                        text = doc.MainDocumentPart.Document.Body.InnerText;
                    }
                    break;

                // 💬 TXT, MD, CSV — leitura simples como texto
                case ".txt":
                case ".md":
                case ".csv":
                    using (var reader = new StreamReader(file.OpenReadStream(), Encoding.UTF8))
                    {
                        text = await reader.ReadToEndAsync();
                    }
                    break;

                // 🖼️ PPTX (slides do PowerPoint)
                case ".pptx":
                    using (var ppt = PresentationDocument.Open(file.OpenReadStream(), false))
                    {
                        var sb = new StringBuilder();

                        foreach (var slidePart in ppt.PresentationPart.SlideParts)
                        {
                            var texts = slidePart.Slide.Descendants<DocumentFormat.OpenXml.Drawing.Text>();
                            foreach (var t in texts)
                                sb.AppendLine(t.Text);
                        }

                        text = sb.ToString();
                    }
                    break;

                // // 🧠 RTF (Rich Text Format)
                // case ".rtf":
                //     using (var reader = new StreamReader(file.OpenReadStream(), Encoding.UTF8))
                //     {
                //         string rawRtf = await reader.ReadToEndAsync();

                //         // Converter RTF para texto puro (forma simples, sem precisar de pacote extra)
                //         System.Windows.Forms.RichTextBox rtb = new System.Windows.Forms.RichTextBox();
                //         rtb.Rtf = rawRtf;
                //         text = rtb.Text;
                //     }
                //     break;

                default:
                    throw new NotSupportedException($"Tipo de arquivo '{extension}' não é suportado.");
            }
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Erro ao extrair texto do arquivo ({file.FileName}): {ex.Message}", ex);
        }

        return text.Trim();
    }


    public async Task<string> GenerateSummaryAsync(string text)
    {
        // 🔹 Prompt padronizado — mesmo estilo do GerarResumoAsync
        var prompt = $"""
    Você é um professor experiente e especializado em ensinar alunos de diferentes idades.
    Sua função é gerar **resumos claros, objetivos e educativos** a partir de materiais enviados pelos alunos.

    Instruções:
    - Resuma **apenas** o conteúdo fornecido, seja qual for, mais a sua obrigação é resumir ele, explicar e deixar conciso.
    - **Não adicione** informações que não estejam no texto.
    - Organize o resumo de forma didática e coerente.
    - **Não escreva** introduções, cumprimentos ou frases como "Aqui está seu resumo".
    - Vá direto ao ponto, explicando de maneira fiel ao texto.

    Gere o resumo com base no conteúdo abaixo:

    "{text}"
    """;

        // 🔹 Corpo da requisição para a API do Gemini
        var requestUrl = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key={_apiKey}";

        var body = new
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

        var json = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");
        var response = await _http.PostAsync(requestUrl, json);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            throw new HttpRequestException($"Erro ao gerar resumo com Gemini: {response.StatusCode} - {error}");
        }

        var resultJson = await response.Content.ReadAsStringAsync();

        try
        {
            var jsonNode = JsonNode.Parse(resultJson);
            var generatedText = jsonNode["candidates"]?[0]?["content"]?["parts"]?[0]?["text"]?.GetValue<string>();
            return generatedText ?? "Não foi possível extrair o resumo do resultado.";
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Erro ao processar resposta do Gemini: {ex.Message}\nResposta bruta: {resultJson}");
        }
    }


    // Em Services/GeminiService.cs

    // Em Services/GeminiService.cs
    public async Task<string> GerarSimuladoAsync(string conteudoDoResumo, int numQuestoes)
    {
        var prompt = @$"
Você é uma API de geração de simulados.
⚠️ REGRAS ABSOLUTAS:
1. Sua resposta deve conter SOMENTE um array JSON válido.
2. NÃO use blocos de código markdown (como ```json ou ```).
3. NÃO adicione texto antes ou depois do JSON.
4. NÃO insira comentários, explicações, ou quebras de linha fora da estrutura JSON.
5. O JSON DEVE SER PARSÁVEL — se não puder ser convertido com JsonDocument.Parse, sua resposta está errada.

Com base no resumo abaixo:
""{conteudoDoResumo}""

Gere exatamente {numQuestoes} questões de múltipla escolha em formato JSON.
Cada item deve seguir esta estrutura EXATA (observe as chaves/colchetes):

[
  {{
    ""pergunta"": ""Texto da pergunta"",
    ""alternativas"": [""Alternativa A"", ""Alternativa B"", ""Alternativa C"", ""Alternativa D""],
    ""respostaCorreta"": ""Texto da alternativa correta (uma das 4 acima)""
  }}
]

Somente isso. Retorne apenas o array JSON, sem explicações.
";

        // envia o prompt para seu gerador (ajuste conforme sua implementação)
        string resposta = await GenerateContentAsync(prompt);

        // limpeza básica: remove blocos de código se vierem
        if (!string.IsNullOrEmpty(resposta) && resposta.Contains("```"))
        {
            resposta = resposta.Replace("```json", "").Replace("```", "").Trim();
        }

        // tenta validar/parsear como JSON direto
        try
        {
            // valida se é JSON bem formado
            using var _ = JsonDocument.Parse(resposta);
            return resposta;
        }
        catch
        {
            // tentativa de recuperação: pega do primeiro '[' até o último ']'
            var start = resposta.IndexOf('[');
            var end = resposta.LastIndexOf(']');
            if (start >= 0 && end > start)
            {
                var candidate = resposta.Substring(start, end - start + 1);
                try
                {
                    using var _2 = JsonDocument.Parse(candidate);
                    return candidate;
                }
                catch
                {
                    // falhou em parsear o candidato
                }
            }

            // fallback seguro: retorna array vazio e loga o problema (evita quebrar o fluxo)
            _logger?.LogWarning("GerarSimuladoAsync: resposta da IA não pôde ser parseada como JSON. Retornando [] como fallback. Resposta bruta: {Resposta}", resposta);
            return "[]";
        }
    }


    public async Task<string> GerarCronogramaAsync(CriarPlanoRequestDto request)
    {
        // 1. CONSTRUÇÃO DO JSON DE ERRO PRONTO
        string jsonErro = JsonSerializer.Serialize(new
        {
            erro = "Tema não permitido. A plataforma é exclusiva para estudos acadêmicos e profissionais sérios."
        });

        // 2. CONSTRUÇÃO DO PROMPT DETALHADO
        var prompt = $"""
Você é um planejador de estudos especialista. Sua tarefa é criar um cronograma de estudos semanal em formato JSON.

**DIRETRIZ DE SEGURANÇA CRÍTICA:** Você SÓ PODE gerar cronogramas para temas estritamente acadêmicos, educacionais ou profissionais (como Matemática, História, Concursos Públicos, Vestibulares, Linguagens de Programação, etc.). 
Se o Objetivo Principal ou Tópicos a Cobrir se referirem a qualquer assunto inapropriado, sexual, ilegal, violento ou não acadêmico, sua resposta DEVE ser APENAS o JSON de ERRO: {jsonErro}.

**Instruções para o JSON de saída:**
- O JSON deve ser um OBJETO com uma única chave principal chamada "cronogramaSemanal" OU a chave "erro" em caso de falha de segurança.
- O valor de "cronogramaSemanal" deve ser um array de 7 objetos, um para cada dia da semana.
- Cada objeto de dia deve ter duas propriedades: "dia" (um número de 1 para Segunda a 7 para Domingo) e "sessoes" (um array de objetos de sessão).
- Cada objeto de sessão deve ter duas propriedades: "topico" (string) e "duracao" (número).
- Se um dia não tiver estudo, o array "sessoes" deve estar vazio.
- **NÃO inclua nenhum texto, explicação ou formatação de markdown antes ou depois do JSON. A saída deve ser APENAS o JSON puro.**

**Dados do Aluno:**
- **Objetivo Principal:** {request.Meta}
- **Data da Prova:** {request.DataProva:dd/MM/yyyy}
- **Tópicos a Cobrir:** {string.Join(", ", request.Materias)}
- **Total de Horas de Estudo por Semana (mínimo 90 minutos por dia):** {request.HorasPorSemana}

**Tarefa:**
Com base nos dados do aluno, distribua os tópicos de forma equilibrada ao longo da semana. Gere o cronograma no formato de OBJETO JSON especificado.
""";

        // 3. GERAR CONTEÚDO COM IA
        string respostaBrutaDaIA = await GenerateContentAsync(prompt);

        // 4. LIMPEZA DA RESPOSTA
        var respostaLimpa = respostaBrutaDaIA
            .Trim()
            .Replace("```json", "")
            .Replace("```", "");

        // 5. RETORNO DO JSON LIMPO
        return respostaLimpa.Trim();
    }
}
