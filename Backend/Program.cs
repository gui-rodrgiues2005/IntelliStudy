using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Backend.Data;
using System.Text;
using Microsoft.OpenApi.Models;
using Backend.Services;
using Backend.Middleware;
using Stripe;
using Microsoft.Extensions.Configuration; // Necessário

var builder = WebApplication.CreateBuilder(args);
var configuration = builder.Configuration;
// =========================================================================
// 1. LÓGICA CRÍTICA DE CONVERSÃO DA STRING DE CONEXÃO DO RAILWAY (URL)
// =========================================================================
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
string finalConnectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "";

if (!string.IsNullOrEmpty(databaseUrl))
{
    // Lógica para converter a URL de conexão do Railway/Heroku para o formato Npgsql
    // O Npgsql não consegue parsear diretamente o esquema "postgresql://", então o substituímos por "http://"
    // para que a classe Uri do .NET possa fazer o parsing correto dos componentes (Host, Port, UserInfo, Path ).
    var uri = new Uri(databaseUrl.Replace("postgresql://", "http://"));
    var userInfo = uri.UserInfo.Split(':');

    // Monta a string de conexão no formato chave-valor esperado pelo Npgsql
    finalConnectionString = $"Host={uri.Host};Port={uri.Port};Username={userInfo[0]};Password={userInfo[1]};Database={uri.LocalPath.Substring(1)};SSL Mode=Prefer;Trust Server Certificate=true";
    Console.WriteLine("Usando string de conexão de ambiente (DATABASE_URL).");
}
else
{
    Console.WriteLine("Usando string de conexão local (DefaultConnection).");
}

// Se finalConnectionString for nula ou vazia, lance uma exceção
if (string.IsNullOrEmpty(finalConnectionString))
{
    throw new InvalidOperationException("A string de conexão 'DefaultConnection' não foi configurada.");
}

// --- Configuração do DbContext ---
// A string finalConnectionString (convertida ou local) é usada aqui
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(finalConnectionString)
);



// --- Serviços customizados ---
builder.Services.AddHostedService<GeminiWorker>();
builder.Services.AddScoped<PlanoService>();

StripeConfiguration.ApiKey = configuration["Stripe:SecretKey"];
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

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    // Busca a usuária pela conta de e-mail
    var user = await dbContext.Users
        .FirstOrDefaultAsync(u => u.Email == "juliaromeiro1234@gmail.com");

    if (user != null)
    {
        // Gera o novo hash
        string novaSenha = "#Julia96996";
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(novaSenha);

        // Salva no banco
        await dbContext.SaveChangesAsync();
        Console.WriteLine("Senha da Julia atualizada com sucesso!");
    }
    else
    {
        Console.WriteLine("Usuária não encontrada!");
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
// app.UseHttpsRedirection();

app.UseAuthentication();
app.UseMiddleware<PlanoMiddleware>();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
