using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Backend.Data;
using System.Text;
using Microsoft.OpenApi.Models;
using Backend.Services;
using Backend.Middleware; 

var builder = WebApplication.CreateBuilder(args);

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
    return new GeminiService(httpClient, geminiApiKey);
});

// --- PostgreSQL ---
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// --- JWT ---
var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = Encoding.ASCII.GetBytes(jwtSettings["Key"]);

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

// --- Registrar webhook Efi ao iniciar ---
using (var scope = app.Services.CreateScope())
{
    var efiService = scope.ServiceProvider.GetRequiredService<EfiPixService>();
    var ngrokUrl = builder.Configuration["Ngrok:Url"];

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
        Console.WriteLine("⚠️ URL do Ngrok não configurada. Webhook não registrado.");
    }
}

app.Run();
