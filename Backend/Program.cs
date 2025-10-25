using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Backend.Data;
using System.Text;
using Microsoft.OpenApi.Models;
using Backend.Services;
using Backend.Middleware;
using Microsoft.Extensions.Configuration; // Necessário

var builder = WebApplication.CreateBuilder(args);

// =========================================================================
// 1. LÓGICA CRÍTICA DE CONVERSÃO DA STRING DE CONEXÃO DO RAILWAY (URL)
// =========================================================================
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
// Tenta obter a string do appsettings.json como fallback, se houver
string finalConnectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "";

if (!string.IsNullOrEmpty(databaseUrl))
{
    try
    {
        // Converte a string de conexão do Railway (URL) para o formato Key-Value (Npgsql/EF Core)
        var uri = new Uri(databaseUrl);
        var userInfo = uri.UserInfo.Split(':');

        finalConnectionString = $"Host={uri.Host};Port={uri.Port};Database={uri.AbsolutePath.TrimStart('/')};Username={userInfo[0]};Password={userInfo[1]};SSL Mode=Require;Trust Server Certificate=true";

        // FORÇA A INJEÇÃO: Adiciona a nova string convertida diretamente no Configuration
        // Isso garante que o DbContext (e qualquer outro serviço) encontre a string Key-Value correta.
        builder.Configuration.AddInMemoryCollection(new Dictionary<string, string>
        {
            {"ConnectionStrings:DefaultConnection", finalConnectionString}
        });

        Console.WriteLine($"✅ Connection string convertida de URL para Key-Value: {finalConnectionString}");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Erro FATAL ao converter DATABASE_URL. Usando Fallback. Erro: {ex.Message}");
    }
}
else
{
    Console.WriteLine("⚠️ DATABASE_URL não encontrada, usando string do appsettings.json.");
}

// O DbContext agora usa a string que foi injetada acima
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(finalConnectionString,
        npgsqlOptions => npgsqlOptions.EnableRetryOnFailure()) // Adiciona resiliência
);

// --- Serviços customizados ---
builder.Services.AddHostedService<GeminiWorker>();
builder.Services.AddSingleton<EfiPixService>();
builder.Services.AddScoped<PlanoService>();

// --- HttpClient para GeminiService ---
builder.Services.AddHttpClient();

var geminiApiKey = builder.Configuration["Gemini:ApiKey"];
builder.Services.AddSingleton<GeminiService>(sp =>
{
    var httpClient = sp.GetRequiredService<HttpClient>();
    // ATENÇÃO: Verifique a chave da API no appsettings ou ambiente
    return new GeminiService(httpClient, geminiApiKey);
});

// --- JWT ---
var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = Encoding.ASCII.GetBytes(jwtSettings["Key"] ?? throw new InvalidOperationException("JWT Key not configured."));

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        ValidateLifetime = true
    };
});

// --- CORS ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// --- Controllers ---
builder.Services.AddControllers();

// --- Swagger ---
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Digite 'Bearer {token}' para autenticar"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

// --- Health check ---
builder.Services.AddHealthChecks();

var app = builder.Build();

// Aplica as migrações na inicialização
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (dbContext.Database.IsRelational())
    {
        Console.WriteLine("Aplicando migrações...");
        try
        {
            dbContext.Database.Migrate();
            Console.WriteLine("Migrações aplicadas com sucesso.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Erro ao aplicar migrações: {ex.Message}");
        }
    }
}

// --- Middleware ---
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseHsts();
}

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowAll");
app.UseHttpsRedirection();

app.UseAuthentication();
app.UseMiddleware<PlanoMiddleware>();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");


// --- REGISTRO DE WEBHOOK TEMPORARIAMENTE DESATIVADO PARA DEBUG ---
// O bloco abaixo foi comentado para evitar o erro de 404/BadRequest que estava
// quebrando a aplicação após a inicialização.

/*
using (var scope = app.Services.CreateScope())
{
    var efiService = scope.ServiceProvider.GetRequiredService<EfiPixService>();
    var ngrokUrl = builder.Configuration["Ngrok:Url"];

    // Use Environment.GetEnvironmentVariable para obter a URL de produção
    // var webhookUrl = Environment.GetEnvironmentVariable("EFI_WEBHOOK_URL");

    if (!string.IsNullOrEmpty(ngrokUrl))
    {
        try
        {
            await efiService.RegistrarWebhookAsync();
            Console.WriteLine("✅ Webhook registrado com sucesso na EfiBank.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Falha ao registrar webhook: {ex.Message}");
        }
    }
    else
    {
        Console.WriteLine("⚠️ URL do Ngrok/Webhook não configurada. Webhook não registrado.");
    }
}
*/

app.Run();
