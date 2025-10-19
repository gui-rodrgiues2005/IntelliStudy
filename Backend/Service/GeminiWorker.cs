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

                // ======= 1️⃣ GERAÇÃO DE RESUMO =======
                if (pedidoParaProcessar.Tipo == GenerationType.Resumo)
                {
                    string conteudoParaResumo;

                    if (!string.IsNullOrEmpty(pedidoParaProcessar.InputTexto))
                    {
                        conteudoParaResumo = pedidoParaProcessar.InputTexto;
                    }
                    else
                    {
                        throw new InvalidOperationException("Nenhum conteúdo disponível para gerar resumo.");
                    }

                    string resultadoIA = await geminiService.GerarResumoAsync(conteudoParaResumo);

                    var novoResumo = new Resumo
                    {
                        TopicoOriginal = conteudoParaResumo,
                        ResumoTexto = resultadoIA,
                        UserId = pedidoParaProcessar.UserId,
                        CreatedAt = DateTime.UtcNow
                    };

                    dbContext.Resumos.Add(novoResumo);

                    pedidoParaProcessar.OutputTexto = resultadoIA;
                    resultadoFinal = novoResumo;
                }

                // ======= 2️⃣ GERAÇÃO DE SIMULADO =======
                else if (pedidoParaProcessar.Tipo == GenerationType.Simulado)
                {
                    var resumoPai = await dbContext.Resumos.FindAsync(int.Parse(pedidoParaProcessar.InputContextoId!));
                    if (resumoPai == null) throw new InvalidOperationException("Resumo pai para o simulado não foi encontrado.");

                    int numeroDeQuestoes = int.TryParse(pedidoParaProcessar.InputTexto, out int n) ? n : 5;

                    string respostaBrutaDaIA = await geminiService.GerarSimuladoAsync(resumoPai.ResumoTexto, numeroDeQuestoes);
                    var inicio = respostaBrutaDaIA.IndexOf('[');
                    var fim = respostaBrutaDaIA.LastIndexOf(']');
                    string jsonLimpo = (inicio != -1 && fim != -1) ? respostaBrutaDaIA.Substring(inicio, fim - inicio + 1) : "[]";

                    var novoSimulado = new Simulado
                    {
                        ResumoId = resumoPai.Id,
                        QuestoesJson = jsonLimpo,
                        CreatedAt = DateTime.UtcNow
                    };

                    dbContext.Simulados.Add(novoSimulado);
                    resultadoFinal = novoSimulado;
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
                    {
                        jsonLimpo = respostaBrutaDaIA.Substring(primeiroAbreChave, ultimoFechaChave - primeiroAbreChave + 1).Trim();
                        _logger.LogInformation($"JSON limpo e extraído: {jsonLimpo}");
                    }
                    else
                    {
                        _logger.LogError("Não foi possível encontrar um objeto JSON válido na resposta da IA.");
                        throw new JsonException("A resposta da IA não continha um objeto JSON reconhecível.");
                    }

                    var planoGeradoPelaIa = JsonSerializer.Deserialize<PlanoGeradoDto>(jsonLimpo, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (planoGeradoPelaIa?.CronogramaSemanal == null || !planoGeradoPelaIa.CronogramaSemanal.Any())
                    {
                        throw new Exception("A IA retornou um plano sem cronograma ou o cronograma está vazio.");
                    }

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
                        if (dia.Sessoes != null)
                        {
                            foreach (var sessao in dia.Sessoes)
                            {
                                int duracaoEmMinutos = 0;
                                if (sessao.Duracao is JsonElement duracaoElement)
                                {
                                    if (duracaoElement.ValueKind == JsonValueKind.Number)
                                    {
                                        duracaoEmMinutos = duracaoElement.GetInt32();
                                    }
                                    else if (duracaoElement.ValueKind == JsonValueKind.String)
                                    {
                                        string duracaoString = duracaoElement.GetString() ?? "";
                                        var digitos = new string(duracaoString.Where(char.IsDigit).ToArray());
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
                    }

                    if (!novoPlano.Sessoes.Any())
                    {
                        throw new Exception("Nenhuma sessão de estudo foi gerada pela IA.");
                    }

                    resultadoFinal = novoPlano;
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
