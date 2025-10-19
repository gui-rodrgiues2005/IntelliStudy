
public class EfiPixResponse
{
    public string Txid { get; set; }
    public PixLoc Loc { get; set; }
    public PixValor Valor { get; set; }
    public string PixCopiaECola { get; set; }
}

public class PixLoc
{
    public int Id { get; set; }
    public string Location { get; set; }
}

public class PixValor
{
    public string Original { get; set; }
}

