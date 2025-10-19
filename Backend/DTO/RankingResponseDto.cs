using System.Collections.Generic;

namespace Backend.DTO
{
    public class UserPositionDto
    {
        public RankingDto Usuario { get; set; }
        public int Posicao { get; set; }
    }

    public class RankingResponseDto
    {
        public List<RankingDto> Ranking { get; set; }
        public UserPositionDto PosicaoUsuarioLogado { get; set; }
    }
}