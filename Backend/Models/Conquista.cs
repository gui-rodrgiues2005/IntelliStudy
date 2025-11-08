namespace Backend.Models
{
    public class Conquista
    {
        public string Codigo { get; set; }
        public string Nome { get; set; }
        public string Plano { get; set; }

        // Indica se está desbloqueada para o usuário atual (não mapeada no banco)
        public bool Desbloqueada { get; set; } = false;

        public Conquista(string codigo, string nome, string plano)
        {
            Codigo = codigo;
            Nome = nome;
            Plano = plano;
        }

        // Construtor vazio para o EF
        public Conquista() { }
    }
}
