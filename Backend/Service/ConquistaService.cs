// Em Services/ConquistaService.cs
using Backend.Models;

public class ConquistaService
{
    public List<object> CalcularConquistas(int totalResumos, int totalSimulados, bool isPremium)
    {
        var conquistas = new List<object>();

        foreach (var conquista in ConquistasCatalogo.Todas)
        {
            bool desbloqueada = conquista.Codigo switch
            {
                "PRIMEIRO_RESUMO" => totalResumos > 0,
                "PRIMEIRO_SIMULADO" => totalSimulados > 0,
                "DEZ_RESUMOS" => totalResumos >= 10,
                "DEZ_SIMULADOS" => totalSimulados >= 10,
                "CINQUENTA_RESUMOS" => totalResumos >= 50,
                "NOTA_MAXIMA" => false,
                "MARATONA" => false,
                "MESTRE_RESUMOS" => totalResumos >= 100,
                "PLANO_PREMIUM" => isPremium,
                _ => false
            };

            bool disponivel = conquista.Plano == "Gratuito" || isPremium;

            conquistas.Add(new
            {
                Codigo = conquista.Codigo,
                conquista.Nome,
                conquista.Plano,
                Desbloqueada = desbloqueada && disponivel,
                Disponivel = disponivel
            });
        }

        return conquistas;
    }
}
