using System.Collections.Generic;

namespace Backend.Models
{
    public static class ConquistasCatalogo
    {
        public static readonly List<Conquista> Todas = new()
        {
            // Incentivo principal — aparece primeiro
            new("PLANO_PREMIUM", "Adquira o plano Premium!", "Gratuito"),

            // Conquistas básicas (gratuitas)
            new("PRIMEIRO_CONTEUDO", "Seu Primeiro Prompt", "Gratuito"),
            new("PRIMEIRO_SIMULADO", "Primeiro Simulado", "Gratuito"),

            new("DEZ_CONTEUDOS", "10 Pesquisas Realizadas", "Gratuito"),
            new("DEZ_SIMULADOS", "10 Simulados Feitos", "Gratuito"),

            // Conquistas avançadas (Premium)
            new("CINQUENTA_CONTEUDOS", "50 Pesquisas Realizadas", "Premium"),
            new("NOTA_MAXIMA", "Nota Máxima", "Premium"),
            new("MARATONA", "Estudou por 60 minutos seguidos", "Premium"),
            new("MESTRE_CONTEUDOS", "Criou 100 Pesquisas", "Premium")
        };
    }
}
