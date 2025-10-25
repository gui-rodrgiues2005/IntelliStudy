using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Backend.Data;
using System.Text;
using Microsoft.OpenApi.Models;
using Backend.Services;
using Backend.Middleware;

var builder = WebApplication.CreateBuilder(args);

// =========================================================================
// 1. CONFIGURAÇÃO DA STRING DE CONEXÃO DO BANCO DE DADOS
// =========================================================================
string finalConnectionString = string.Empty;

// Primeiro tenta obter da variável de ambiente DATABASE_URL (Railway/Heroku)
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
Console.WriteLine($"DATABASE_URL encontrada: {!string.IsNullOrEmpty(databaseUrl)}");

if (!string.IsNullOrEmpty(databaseUrl))
{
    try
    {
        // Converte URL do Railway/Heroku para Npgsql
        var uri = new Uri(databaseUrl.Replace("postgresql://", "http://"));
        var userInfo = uri.UserInfo.Split(':');

        finalConnectionString = $"Host={uri.Host};Port={uri.Port};Username={userInfo[0]};Password={userInfo[1]};Database={uri.LocalPath.TrimStart('/')};SSL Mode=Prefer;Trust Server Certificate=true";

        Console.WriteLine("✅ Usando string de conexão do Railway (DATABASE_URL).");
        Console.WriteLine($"🔒 String final (senha oculta): {finalConnectionString.Replace(userInfo[1], "***")}");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Erro ao processar DATABASE_URL: {ex.Message}");
    }
}

// Se DATABASE_URL não estiver definida, tenta variável direta
if (string.IsNullOrEmpty(finalConnectionString))
{
    var directConnectionString = Environment.GetEnvironmentVariable("CONNECTION_STRING");
    if (!string.IsNullOrEmpty(directConnectionString))
    {
        finalConnectionString = directConnectionString;
        Console.WriteLine("✅ Usando string de conexão direta (CONNECTION_STRING).");
    }
    else
    {
        // Fallback para appsettings.json
        finalConnectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "";
        Console.WriteLine("✅ Usando string de conexão local (DefaultConnection).");
    }
}

// Se não existir string de conexão, encerra imediatamente
if (string.IsNullOrEmpty(finalConnectionString))
{
    Console.WriteLine("❌ Nenhuma string de conexão válida encontrada. Abortando...");
    throw new InvalidOperationException("A string de conexão do banco de dados não foi configurada.");
}

// --- Configuração do DbContext ---
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(finalConnectionString)
);

// =========================================================================
// 2. SERVIÇOS CUSTOMIZADOS
// =========================================================================
builder.Services.AddHostedService<GeminiWorker>();
builder.Services.AddSingleton<EfiPixService>();
builder.Services.AddScoped<PlanoService>();
builder.Services.AddHttpClient();

var geminiApiKey = builder.Configuration["Gemini:ApiKey"];
builder.Services.AddSingleton<GeminiService>(sp =>
{
    var httpClient = sp.GetRequiredService<HttpClient>();
    return new GeminiService(httpClient, geminiApiKey);
});

// =========================================================================
// 3. JWT
// =========================================================================
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

// =========================================================================
// 4. CORS, CONTROLLERS E SWAGGER
// =========================================================================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddControllers();
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
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            new string[] {}
        }
    });
});

// =========================================================================
// 5. BUILD APP
// =========================================================================
var app = builder.Build();

// Aplica migrações na inicialização
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (dbContext.Database.IsRelational())
    {
        Console.WriteLine("⏳ Aplicando migrações...");
        try
        {
            dbContext.Database.Migrate();
            Console.WriteLine("✅ Migrações aplicadas com sucesso.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Erro ao aplicar migrações: {ex.Message}");
            throw;
        }
    }
}

// =========================================================================
// 6. MIDDLEWARE
// =========================================================================
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

// =========================================================================
// 7. START APP
// =========================================================================
Console.WriteLine("🚀 Aplicação iniciando...");
app.Run();
