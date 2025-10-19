// Em Backend/DTO/CriarPlanoRequestDto.cs
namespace Backend.DTO
{
    public class CriarPlanoRequestDto
    {
        public string Meta { get; set; }

        public DateTime DataProva { get; set; }

        public List<string> Materias { get; set; }

        public int HorasPorSemana { get; set; }
    }
}
