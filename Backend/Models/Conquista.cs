public class Conquista
{
    public string Codigo { get; set; }
    public string Nome { get; set; }
    public string Plano { get; set; }

    // NOVO
    public bool Desbloqueada { get; set; } = false;

    public Conquista(string codigo, string nome, string plano)
    {
        Codigo = codigo;
        Nome = nome;
        Plano = plano;
    }
}
