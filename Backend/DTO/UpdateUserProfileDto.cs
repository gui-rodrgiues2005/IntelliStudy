public class UpdateUserProfileDto
{
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Cpf { get; set; }
    public string? Telefone { get; set; }
    public string? CurrentPassword { get; set; }  // Opcional
    public string? NewPassword { get; set; }      // Opcional
}