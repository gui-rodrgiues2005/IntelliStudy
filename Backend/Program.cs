using Microsoft.EntityFrameworkCore;
using Backend.Data;

var builder = WebApplication.CreateBuilder(args);

// ==============================
// Configuração da conexão com PostgreSQL
// ==============================
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
string finalConnectionString = "";

Console.WriteLine($"DATABASE_URL encontrada: {!string.IsNullOrEmpty(databaseUrl)}");

if (!string.IsNullOrEmpty(databaseUrl))
{
    Console.WriteLine($"DATABASE_URL: {databaseUrl}");
    try
    {
        // Converte postgresql:// para http:// para o Uri conseguir parsear
        var uri = new Uri(databaseUrl.Replace("postgresql://", "http://"));
        var userInfo = uri.UserInfo.Split(':');
        finalConnectionString = $"Host={uri.Host};Port={uri.Port};Username={userInfo[0]};Password={userInfo[1]};Database={uri.LocalPath.TrimStart('/')};SSL Mode=Prefer;Trust Server Certificate=true";
        Console.WriteLine("✅ String de conexão convertida com sucesso.");
        Console.WriteLine($"String final: {finalConnectionString.Replace(userInfo[1], "***")}");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Erro ao converter DATABASE_URL: {ex.Message}");
    }
}
else
{
    Console.WriteLine("⚠️ DATABASE_URL não encontrada, tentando CONNECTION_STRING...");
    var directConnection = Environment.GetEnvironmentVariable("CONNECTION_STRING");
    if (!string.IsNullOrEmpty(directConnection))
    {
        finalConnectionString = directConnection;
        Console.WriteLine("✅ Usando CONNECTION_STRING direta.");
    }
    else
    {
        Console.WriteLine("⚠️ CONNECTION_STRING não encontrada, tentando appsettings.json...");
        finalConnectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "";
    }
}

if (string.IsNullOrEmpty(finalConnectionString))
{
    Console.WriteLine("❌ ERRO: Nenhuma string de conexão válida foi encontrada!");
    Console.WriteLine("Configure uma das opções:");
    Console.WriteLine("1. DATABASE_URL (formato: postgresql://user:pass@host:port/db)");
    Console.WriteLine("2. CONNECTION_STRING (formato Npgsql completo)");
    Console.WriteLine("3. DefaultConnection no appsettings.json");
    throw new InvalidOperationException("String de conexão não configurada.");
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
