using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using Backend.DTO;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Backend.Services
{
    public class GeminiWorker : IHostedService, IDisposable
    {
        private readonly ILogger<GeminiWorker> _logger;
        private Timer? _timer = null;
        private readonly IServiceProvider _serviceProvider;

        public GeminiWorker(ILogger<GeminiWorker> logger, IServiceProvider serviceProvider)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Gemini Worker está iniciando.");
            _timer = new Timer(DoWork, null, TimeSpan.Zero, TimeSpan.FromSeconds(10));
            return Task.CompletedTask;
        }

        private async void DoWork(object? state)
        {
            _logger.LogInformation("Gemini Worker está procurando por tarefas.");

            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var geminiService = scope.ServiceProvider.GetRequiredService<GeminiService>();

            var pedidoPendente = await dbContext.GenerationRequests
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Status == RequestStatus.Pendente);

            if (pedidoPendente == null)
            {
                _logger.LogInformation("Nenhuma tarefa pendente encontrada.");
                return;
            }

            _logger.LogInformation($"Processando pedido {pedidoPendente.Id} do tipo {pedidoPendente.Tipo}.");

            var pedidoParaProcessar = await dbContext.GenerationRequests.FindAsync(pedidoPendente.Id);
            if (pedidoParaProcessar == null) return;

            try
            {
                pedidoParaProcessar.Status = RequestStatus.Processando;
                await dbContext.SaveChangesAsync();

                object? resultadoFinal = null;

                // ======= 1️⃣ GERAÇÃO DE CONTEÚDO (Resumo, PerguntaDireta, PesquisaCientifica, EstudarParaProva) =======
                if (pedidoParaProcessar.Tipo == GenerationType.Resumo ||
                    pedidoParaProcessar.Tipo == GenerationType.PerguntaDireta ||
                    pedidoParaProcessar.Tipo == GenerationType.PesquisaCientifica ||
                    pedidoParaProcessar.Tipo == GenerationType.EstudarParaProva)
                {
                    if (string.IsNullOrEmpty(pedidoParaProcessar.InputTexto))
                        throw new InvalidOperationException("Nenhum conteúdo disponível para gerar.");

                    string tipoParaIA = pedidoParaProcessar.Tipo switch
                    {
                        GenerationType.Resumo => "Resumo",
                        GenerationType.PerguntaDireta => "PerguntaDireta",
                        GenerationType.PesquisaCientifica => "PesquisaCientifica",
                        GenerationType.EstudarParaProva => "EstudarParaProva",
                        _ => "Resumo"
                    };

                    string resultadoIA = await geminiService.GerarConteudoAsync(pedidoParaProcessar.InputTexto, tipoParaIA);

                    var novoConteudo = new ConteudoIA
                    {
                        TopicoOriginal = pedidoParaProcessar.InputTexto.Length > 100
                            ? pedidoParaProcessar.InputTexto.Substring(0, 100) + "..."
                            : pedidoParaProcessar.InputTexto,
                        Tipo = tipoParaIA,
                        TextoGerado = resultadoIA,
                        UserId = pedidoParaProcessar.UserId,
                        CreatedAt = DateTime.UtcNow
                    };

                    dbContext.ConteudoIAs.Add(novoConteudo);
                    await dbContext.SaveChangesAsync();

                    resultadoFinal = novoConteudo;
                }

                // ======= 2️⃣ GERAÇÃO DE SIMULADO =======
                else if (pedidoParaProcessar.Tipo == GenerationType.Simulado)
                {
                    const int MAX_TRIES = 3;
                    bool sucesso = false;

                    _logger.LogInformation(
                        "📘 [Worker] Iniciando geração de simulado | RequestId: {Id} | TextoEntrada: {Texto}",
                        pedidoParaProcessar.Id, pedidoParaProcessar.InputTexto);

                    // 1️⃣ Buscar conteúdo base: pode ser ConteudoIA OU GenerationRequest
                    string conteudoTexto = null;

                    if (!string.IsNullOrEmpty(pedidoParaProcessar.InputContextoId))
                    {
                        // Primeiro tenta buscar em ConteudoIAs
                        var conteudoIA = await dbContext.ConteudoIAs
                            .AsNoTracking()
                            .FirstOrDefaultAsync(c => c.Id.ToString() == pedidoParaProcessar.InputContextoId);

                        if (conteudoIA != null)
                        {
                            conteudoTexto = conteudoIA.TextoGerado;
                            _logger.LogInformation("🧾 [Worker] Conteúdo base encontrado em ConteudoIAs (ID={Id})", conteudoIA.Id);
                        }
                        else
                        {
                            // Caso o conteúdo base seja um GenerationRequest (ex: resumo direto)
                            var baseRequest = await dbContext.GenerationRequests
                                .AsNoTracking()
                                .FirstOrDefaultAsync(g => g.Id.ToString() == pedidoParaProcessar.InputContextoId);

                            if (baseRequest != null)
                            {
                                conteudoTexto = baseRequest.OutputTexto;
                                _logger.LogInformation("📄 [Worker] Conteúdo base encontrado em GenerationRequests (ID={Id})", baseRequest.Id);
                            }
                        }
                    }

                    if (string.IsNullOrEmpty(conteudoTexto))
                    {
                        pedidoParaProcessar.Status = RequestStatus.Falhou;
                        pedidoParaProcessar.MensagemErro = "Conteúdo base para o simulado não encontrado.";
                        await dbContext.SaveChangesAsync();
                        _logger.LogWarning("❌ [Worker] Falha: conteúdo base não encontrado para RequestId={Id}", pedidoParaProcessar.Id);
                        return;
                    }

                    int numeroDeQuestoes = int.TryParse(pedidoParaProcessar.InputTexto, out int n) ? n : 5;

                    for (int attempt = 1; attempt <= MAX_TRIES; attempt++)
                    {
                        try
                        {
                            _logger.LogInformation(
                                "🚀 [Worker] Tentativa {Attempt}/{Max} - Chamando GeminiService.GerarSimuladoAsync...",
                                attempt, MAX_TRIES);

                            string respostaBrutaDaIA = await geminiService.GerarSimuladoAsync(conteudoTexto, numeroDeQuestoes);

                            _logger.LogInformation(
                                "🧠 [Worker] Resposta bruta do Gemini (tentativa {Attempt}): {Resposta}",
                                attempt, respostaBrutaDaIA);

                            // Extrai apenas o JSON da resposta
                            var inicio = respostaBrutaDaIA.IndexOf('[');
                            var fim = respostaBrutaDaIA.LastIndexOf(']');
                            string jsonLimpo = (inicio != -1 && fim != -1)
                                ? respostaBrutaDaIA.Substring(inicio, fim - inicio + 1)
                                : "[]";

                            _logger.LogInformation(
                                "📦 [Worker] JSON limpo extraído (tentativa {Attempt}): {Json}",
                                attempt, jsonLimpo);

                            if (jsonLimpo.Length <= 5)
                                throw new InvalidOperationException($"API Gemini retornou resposta vazia ou inválida. Tentativa {attempt}.");

                            // Cria o simulado e persiste
                            var novoSimulado = new Simulado
                            {
                                ConteudoIAId = int.TryParse(pedidoParaProcessar.InputContextoId, out int conteudoId) ? conteudoId : (int?)null,
                                QuestoesJson = jsonLimpo,
                                CreatedAt = DateTime.UtcNow,
                                GenerationRequestId = pedidoParaProcessar.Id
                            };

                            dbContext.Simulados.Add(novoSimulado);
                            await dbContext.SaveChangesAsync();


                            // ✅ Salva no pedido apenas os dados essenciais, num formato consistente pro front
                            pedidoParaProcessar.Status = RequestStatus.Concluido;
                            pedidoParaProcessar.OutputTexto = jsonLimpo; // só as questões puras
                            pedidoParaProcessar.OutputMetadata = JsonSerializer.Serialize(new
                            {
                                SimuladoId = novoSimulado.Id,
                                RequestId = pedidoParaProcessar.Id
                            });
                            pedidoParaProcessar.ProcessedAt = DateTime.UtcNow;
                            await dbContext.SaveChangesAsync();

                            _logger.LogInformation("✅ [Worker] Simulado gerado com sucesso (SimuladoId={SimId}, RequestId={ReqId})",
                                novoSimulado.Id, pedidoParaProcessar.Id);

                            sucesso = true;
                            break;
                        }

                        catch (HttpRequestException ex)
                        {
                            pedidoParaProcessar.MensagemErro = $"Falha na Tentativa {attempt}: {ex.Message}";
                            await dbContext.SaveChangesAsync();
                            _logger.LogWarning("🌐 [Worker] Falha HTTP ({Attempt}/{Max}): {Erro}", attempt, MAX_TRIES, ex.Message);

                            if (attempt < MAX_TRIES)
                                await Task.Delay(TimeSpan.FromSeconds(5 * attempt));
                            else
                                throw new Exception($"Geração de Simulado falhou após {MAX_TRIES} tentativas. Último erro: {ex.Message}", ex);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "❌ [Worker] Erro permanente ao gerar simulado (Tentativa {Attempt}/{Max})", attempt, MAX_TRIES);
                            pedidoParaProcessar.Status = RequestStatus.Falhou;
                            pedidoParaProcessar.MensagemErro = ex.Message;
                            pedidoParaProcessar.ProcessedAt = DateTime.UtcNow;
                            await dbContext.SaveChangesAsync();
                            throw;
                        }
                    }

                    if (!sucesso)
                        throw new Exception("Lógica de repetição falhou inesperadamente.");
                }

                // ======= FINALIZA O PEDIDO =======
                pedidoParaProcessar.OutputTexto = JsonSerializer.Serialize(
                    resultadoFinal,
                    new JsonSerializerOptions { ReferenceHandler = ReferenceHandler.IgnoreCycles }
                );
                pedidoParaProcessar.Status = RequestStatus.Concluido;
                pedidoParaProcessar.ProcessedAt = DateTime.UtcNow;

                await dbContext.SaveChangesAsync();
                _logger.LogInformation($"Pedido {pedidoParaProcessar.Id} concluído com sucesso.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erro ao processar pedido {pedidoPendente.Id}.");
                if (pedidoParaProcessar != null)
                {
                    pedidoParaProcessar.Status = RequestStatus.Falhou;
                    pedidoParaProcessar.MensagemErro = ex.ToString();
                    await dbContext.SaveChangesAsync();
                }

                // ======= 3️⃣ GERAÇÃO DE PLANO DE ESTUDO =======
                else if (pedidoParaProcessar.Tipo == GenerationType.PlanoDeEstudo)
                {
                    _logger.LogInformation($"Iniciando geração de PlanoDeEstudo para o pedido {pedidoParaProcessar.Id}.");

                    var requestDto = JsonSerializer.Deserialize<CriarPlanoRequestDto>(pedidoParaProcessar.InputTexto);
                    if (requestDto == null) throw new InvalidOperationException("Input do pedido de plano de estudo é inválido.");

                    string respostaBrutaDaIA = await geminiService.GerarCronogramaAsync(requestDto);
                    _logger.LogInformation($"Resposta bruta da IA recebida: {respostaBrutaDaIA}");

                    string jsonLimpo;
                    var primeiroAbreChave = respostaBrutaDaIA.IndexOf('{');
                    var ultimoFechaChave = respostaBrutaDaIA.LastIndexOf('}');

                    if (primeiroAbreChave != -1 && ultimoFechaChave != -1 && ultimoFechaChave > primeiroAbreChave)
                        jsonLimpo = respostaBrutaDaIA.Substring(primeiroAbreChave, ultimoFechaChave - primeiroAbreChave + 1).Trim();
                    else
                        throw new JsonException("A resposta da IA não continha um objeto JSON reconhecível.");

                    var planoGeradoPelaIa = JsonSerializer.Deserialize<PlanoGeradoDto>(jsonLimpo, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (planoGeradoPelaIa?.CronogramaSemanal == null || !planoGeradoPelaIa.CronogramaSemanal.Any())
                        throw new Exception("A IA retornou um plano sem cronograma ou o cronograma está vazio.");

                    var novoPlano = new PlanoDeEstudo
                    {
                        UserId = pedidoParaProcessar.UserId,
                        Meta = requestDto.Meta,
                        DataProva = DateTime.SpecifyKind(requestDto.DataProva, DateTimeKind.Utc),
                        Materias = string.Join(", ", requestDto.Materias),
                        Concluido = false,
                        CreatedAt = DateTime.UtcNow,
                        Sessoes = new List<SessaoEstudo>()
                    };

                    dbContext.PlanosDeEstudo.Add(novoPlano);

                    foreach (var dia in planoGeradoPelaIa.CronogramaSemanal)
                    {
                        if (dia.Sessoes == null) continue;

                        foreach (var sessao in dia.Sessoes)
                        {
                            int duracaoEmMinutos = 0;
                            if (sessao.Duracao is JsonElement duracaoElement)
                            {
                                if (duracaoElement.ValueKind == JsonValueKind.Number)
                                    duracaoEmMinutos = duracaoElement.GetInt32();
                                else if (duracaoElement.ValueKind == JsonValueKind.String)
                                {
                                    var digitos = new string((duracaoElement.GetString() ?? "").Where(char.IsDigit).ToArray());
                                    int.TryParse(digitos, out duracaoEmMinutos);
                                }
                            }

                            novoPlano.Sessoes.Add(new SessaoEstudo
                            {
                                Topico = sessao.Topico,
                                DiaDaSemana = dia.Dia,
                                DuracaoMinutos = duracaoEmMinutos,
                                Concluida = false
                            });
                        }
                    }

                    if (!novoPlano.Sessoes.Any())
                        throw new Exception("Nenhuma sessão de estudo foi gerada pela IA.");

                    await dbContext.SaveChangesAsync();
                    _logger.LogInformation($"Plano de estudo gerado com sucesso para o pedido {pedidoParaProcessar.Id}.");
                }
            }
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Gemini Worker está parando.");
            _timer?.Change(Timeout.Infinite, 0);
            return Task.CompletedTask;
        }

        public void Dispose()
        {
            _timer?.Dispose();
        }
    }
}
