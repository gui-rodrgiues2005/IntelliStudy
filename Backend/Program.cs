using Microsoft.EntityFrameworkCore;
using Backend.Data;

var builder = WebApplication.CreateBuilder(args);

// ==============================
// Configuração da conexão com PostgreSQL
// ==============================
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
string finalConnectionString = "";

if (!string.IsNullOrEmpty(databaseUrl))
{
    try
    {
        // Substitui "postgresql://" por "http://" para usar Uri
        var uri = new Uri(databaseUrl.Replace("postgresql://", "http://"));
        var userInfo = uri.UserInfo.Split(':');

        finalConnectionString =
            $"Host={uri.Host};Port={uri.Port};Username={userInfo[0]};Password={userInfo[1]};Database={uri.LocalPath.Substring(1)};SSL Mode=Prefer;Trust Server Certificate=true";

        Console.WriteLine($"✅ Usando DATABASE_URL convertida para Npgsql (senha ocultada): Host={uri.Host};Port={uri.Port};Username={userInfo[0]};Database={uri.LocalPath.Substring(1)}");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Erro ao processar DATABASE_URL: {ex.Message}");
    }
}

// Fallback: variável CONNECTION_STRING
if (string.IsNullOrEmpty(finalConnectionString))
{
    finalConnectionString = Environment.GetEnvironmentVariable("CONNECTION_STRING") ?? "";
}

// Fallback: appsettings.json
if (string.IsNullOrEmpty(finalConnectionString))
{
    finalConnectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "";
}

if (string.IsNullOrEmpty(finalConnectionString))
{
    throw new InvalidOperationException("❌ Nenhuma string de conexão válida foi encontrada. Configure DATABASE_URL ou DefaultConnection.");
}

// ==============================
// Configura o DbContext
// ==============================
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(finalConnectionString)
);

var app = builder.Build();

// ==============================
// Aplica migrações na inicialização
// ==============================
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        if (dbContext.Database.IsRelational())
        {
            Console.WriteLine("🔄 Aplicando migrações do banco...");
            dbContext.Database.Migrate();
            Console.WriteLine("✅ Migrações aplicadas com sucesso.");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Erro ao aplicar migrações: {ex.Message}");
        throw;
    }
}

app.Run();
