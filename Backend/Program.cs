using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Backend.Data;
using System.Text;
using Microsoft.OpenApi.Models;
using Backend.Services;
using Backend.Middleware;

var builder = WebApplication.CreateBuilder(args);

// ======================
// 1. CONFIGURAÇÃO DO DbContext COM DATABASE_URL
// ======================
var ConnectionStrings = Environment.GetEnvironmentVariable("DATABASE_URL");
if (string.IsNullOrEmpty(ConnectionStrings))
{
    throw new InvalidOperationException("DATABASE_URL não encontrada no ambiente.");
}

// Parsing seguro da URL do Railway
var uri = new Uri(ConnectionStrings.Replace("postgresql://", "http://"));
var userInfo = uri.UserInfo.Split(':');
var username = Uri.UnescapeDataString(userInfo[0]);
var password = Uri.UnescapeDataString(userInfo[1]);
var dbName = uri.LocalPath.TrimStart('/');

var npgsqlConnection = $"Host={uri.Host};Port={uri.Port};Username={username};Password={password};Database={dbName};SSL Mode=Require;Trust Server Certificate=true";

// Configura o DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(npgsqlConnection)
);

// ======================
// 2. SERVIÇOS CUSTOMIZADOS
// ======================
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

// ======================
// 3. JWT
// ======================
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

// ======================
// 4. CORS
// ======================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// ======================
// 5. CONTROLLERS
// ======================
builder.Services.AddControllers();

// ======================
// 6. SWAGGER
// ======================
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

// ======================
// 7. HEALTH CHECKS
// ======================
builder.Services.AddHealthChecks();

var app = builder.Build();

// ======================
// 8. MIGRAÇÕES AUTOMÁTICAS
// ======================
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

// ======================
// 9. MIDDLEWARE
// ======================
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

// ======================
// 10. WEBHOOK (desativado para debug)
// ======================
// Mantém comentado ou configure depois com Environment.GetEnvironmentVariable("EFI_WEBHOOK_URL")

app.Run();
