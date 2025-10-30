
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

    public GeminiService(HttpClient http, string apiKey)
    {
        _http = http;
        _apiKey = apiKey;
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
        var prompt = $"""
Você é um professor especialista em transformar textos complexos em **resumos didáticos, claros e envolventes**.

**Objetivo:** Criar um resumo educativo que facilite a compreensão completa do tema, mesmo que o texto original seja longo.  
O resumo deve ser **curto, direto e explicativo**, destacando apenas os pontos mais importantes, mas mantendo exemplos e analogias para facilitar o entendimento.

**Instruções obrigatórias:**
- Use linguagem natural, clara e fluida, adequada a estudantes brasileiros.
- Reescreva com suas próprias palavras — nunca apenas copie.
- Se o conteúdo for longo ou complexo, faça uma **síntese inteligente**, mantendo os conceitos essenciais e eliminando informações secundárias.
- Sempre que houver conceitos abstratos, fórmulas, termos técnicos ou processos, explique com exemplos simples:
  - Cálculos ilustrativos (ex: “Se o tempo de resposta for 2s e o limite for 1s, o desempenho é baixo.”)
  - Mini fluxogramas ou diagramas descritos em texto (ex: “Entrada → Processamento → Saída”)
  - Situações do dia a dia (ex: “Assim como revisar um texto várias vezes melhora a escrita, testar o código várias vezes melhora o software.”)
  - Trechos de código curtos ou pseudocódigo (quando o tema for programação)
- Evite inventar dados ou informações fora do tema.
- Sempre que possível, inclua uma **pergunta ou mini-exercício** que ajude o aluno a testar o conhecimento aprendido.
- Organize a resposta em **três seções fixas**, na ordem exata:
  1. **Resumo Principal:** visão geral curta e objetiva, resumindo conceitos-chave do texto.
  2. **Pontos-Chave:** lista de ideias explicadas com exemplos ilustrativos, mantendo clareza.
  3. **Aplicação ou Exemplo Educativo:** um exemplo prático, analogia, mini-código ou situação do cotidiano que ajude a fixar o aprendizado.

**Texto a resumir:**
{conteudo}
""";

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
