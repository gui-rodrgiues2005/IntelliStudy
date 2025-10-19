using System.Collections.Generic;

namespace Backend.Models
{
    public static class ConquistasCatalogo
    {
        public static readonly List<Conquista> Todas = new()
        {
            new("PRIMEIRO_RESUMO", "Primeiro Resumo", "Gratuito"),
            new("PRIMEIRO_SIMULADO", "Primeiro Simulado", "Gratuito"),
            new("DEZ_RESUMOS", "10 Resumos Criados", "Gratuito"),
            new("DEZ_SIMULADOS", "10 Simulados Feitos", "Gratuito"),
            new("CINQUENTA_RESUMOS", "50 Resumos Criados", "Premium"),
            new("NOTA_MAXIMA", "Nota Máxima", "Premium"),
            new("MARATONA", "Estudou por 60 minutos seguidos", "Premium"),
            new("MESTRE_RESUMOS", "Criou 100 resumos", "Premium"),
        };
    }
}
