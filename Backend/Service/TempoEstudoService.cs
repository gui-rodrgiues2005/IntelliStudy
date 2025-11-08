using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

public class TempoEstudoService
{
    private readonly AppDbContext _context;

    public TempoEstudoService(AppDbContext context)
    {
        _context = context;
    }

    public async Task RegistrarAtividadeAsync(int userId, string tipo)
    {
        var agora = DateTime.UtcNow;
        var duracaoMinutos = ObterDuracaoEstimativa(tipo);

        // 🔹 Cria registro de atividade individual
        var atividade = new AtividadeUsuario
        {
            UserId = userId,
            Tipo = tipo,
            DataInicio = agora,
            DuracaoSegundos = duracaoMinutos * 60,
            DiaDaSemana = (int)agora.DayOfWeek
        };

        _context.AtividadesUsuarios.Add(atividade);

        // 🔹 Soma o tempo estimado ao total diário de estudo
        var dia = agora.Date;
        var registroDia = await _context.TempoEstudosUsuarios
            .FirstOrDefaultAsync(t => t.UserId == userId && t.Dia == dia);

        if (registroDia == null)
        {
            registroDia = new TempoEstudoUsuario
            {
                UserId = userId,
                Dia = dia,
                Minutos = duracaoMinutos
            };
            _context.TempoEstudosUsuarios.Add(registroDia);
        }
        else
        {
            registroDia.Minutos += duracaoMinutos;
        }

        await _context.SaveChangesAsync();

        // 🔹 Atualiza a última atividade do usuário
        await RegistrarUltimoAcessoAsync(userId, agora);
    }

    private int ObterDuracaoEstimativa(string tipo)
    {
        return tipo.ToLower() switch
        {
            "resumo" => 5,
            "simulado" => 10,
            "pesquisacientifica" => 8,
            "perguntadireta" => 6,
            "estudarparaprova" => 15,
            _ => 5 // valor padrão se não corresponder a nenhum tipo
        };
    }

    private async Task RegistrarUltimoAcessoAsync(int userId, DateTime data)
    {
        var registro = await _context.UserAtividades
            .FirstOrDefaultAsync(a => a.UserId == userId);

        if (registro == null)
        {
            registro = new UserAtividade
            {
                UserId = userId,
                UltimaAtividade = data
            };
            _context.UserAtividades.Add(registro);
        }
        else
        {
            registro.UltimaAtividade = data;
        }

        await _context.SaveChangesAsync();
    }
}
