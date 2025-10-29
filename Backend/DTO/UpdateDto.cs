public class UpdatePasswordDto
{
    public int UserId { get; set; }       // Id do usuário que está logado
    public string OldPassword { get; set; }  // Senha antiga, para validar
    public string NewPassword { get; set; }  // Nova senha
}
