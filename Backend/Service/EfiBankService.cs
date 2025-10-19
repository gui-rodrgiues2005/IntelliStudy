using System.Net.Http;
using System.Security.Cryptography.X509Certificates;
using System.Net.Http.Headers;
using System.Text;
using Backend.Models;
using Microsoft.Extensions.Configuration;
using System.Text.Json;

namespace Backend.Services
{
    public class EfiPixService
    {
        private readonly IConfiguration _config;
        private readonly HttpClient _httpClient;

        public EfiPixService(IConfiguration config)
        {
            _config = config;

            // Caminho e senha do certificado
            var certPath = Path.Combine(AppContext.BaseDirectory, _config["Efi:CertRelativePath"]);
            var certPassword = _config["Efi:CertPassword"];

            if (!File.Exists(certPath))
                throw new FileNotFoundException($"Certificado não encontrado: {certPath}");

            var certificate = new X509Certificate2(certPath, certPassword);

            // Configurar handler com certificado
            var handler = new HttpClientHandler();
            handler.ClientCertificates.Add(certificate);
            handler.SslProtocols = System.Security.Authentication.SslProtocols.Tls12;

            _httpClient = new HttpClient(handler);
        }

        // =====================================================
        // 1️⃣ Obter Token OAuth2
        // =====================================================
        public async Task<EfiTokenResponse> ObterTokenAsync()
        {
            var baseUrl = _config["Efi:BaseUrl"];
            var clientId = _config["Efi:ClientId"];
            var clientSecret = _config["Efi:ClientSecret"];

            var authValue = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{clientId}:{clientSecret}"));

            var request = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/oauth/token");
            request.Headers.Authorization = new AuthenticationHeaderValue("Basic", authValue);
            request.Content = new StringContent("{\"grant_type\": \"client_credentials\"}", Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                throw new Exception($"Erro ao obter token: {response.StatusCode}\n{content}");

            var token = JsonSerializer.Deserialize<EfiTokenResponse>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (token == null || string.IsNullOrEmpty(token.access_token))
                throw new Exception("Falha ao interpretar o token retornado pela Efí.");

            return token;
        }

        // =====================================================
        // 2️⃣ Criar Cobrança Pix
        // =====================================================
        public async Task<EfiPixResponse> CriarCobrancaPixAsync(string nome, string cpf, decimal valor, string solicitacaoPagador)
        {
            // 1. Obter token
            var tokenResponse = await ObterTokenAsync();
            var token = tokenResponse.access_token;

            // 2. Normalizar CPF (remover tudo que não é número)
            var cpfNumeros = new string(cpf.Where(char.IsDigit).ToArray());

            // 3. Montar payload
            var payload = new
            {
                calendario = new { expiracao = 3600 }, // 1 hora
                devedor = new
                {
                    cpf = cpfNumeros,
                    nome
                },
                valor = new { original = valor.ToString("F2", System.Globalization.CultureInfo.InvariantCulture) },
                chave = _config["Efi:PixKey"],
                solicitacaoPagador
            };

            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // 4. Chamada HTTP
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            var baseUrl = _config["Efi:BaseUrl"];
            var response = await _httpClient.PostAsync($"{baseUrl}/v2/cob", content);
            var responseContent = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                throw new Exception($"Erro ao criar cobrança Pix: {response.StatusCode}\n{responseContent}");

            // 5. Desserializar resposta
            var pixResponse = JsonSerializer.Deserialize<EfiPixResponse>(responseContent, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            return pixResponse ?? throw new Exception("Falha ao interpretar resposta da Efí.");
        }
    }
}
