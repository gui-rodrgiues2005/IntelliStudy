// Em src/pages/Ranking/Ranking.jsx

import { useState, useEffect } from 'react';
import { Crown, Medal, Award } from 'lucide-react';
import './Ranking.scss';

function Ranking() {
    // 1. Criar um novo estado para guardar a posição do usuário
    const [ranking, setRanking] = useState([]);
    const [posicaoUsuario, setPosicaoUsuario] = useState(null); // NOVO ESTADO
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRanking = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch('http://localhost:5051/api/Ranking', {
                    headers: { 'Authorization': `Bearer ${token}` }
                } );
                if (!res.ok) throw new Error("Falha ao buscar o ranking.");
                
                // 2. Desestruturar a nova resposta da API
                const data = await res.json();
                setRanking(data.ranking); // Salva a lista de ranking
                setPosicaoUsuario(data.posicaoUsuarioLogado); // Salva os dados do usuário logado

            } catch (error) {
                console.error(error);
                alert(error.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRanking();
    }, []);

    const getRankIcon = (index) => {
        if (index === 0) return <Crown className="rank-icon gold" />;
        if (index === 1) return <Medal className="rank-icon silver" />;
        if (index === 2) return <Award className="rank-icon bronze" />;
        return <span className="rank-number">{index + 1}</span>;
    };

    if (isLoading) {
        return <p>Carregando ranking...</p>;
    }

    return (
        <div className="ranking-page">
            <div className="ranking-header">
                <h1>Tops Inteligentes</h1>
                <p>Acompanhe os melhores estudantes e veja sua posição no ranking</p>
            </div>

            {/* 3. Card "Sua Posição" (só aparece se o usuário tiver uma posição) */}
            {posicaoUsuario && (
                <div className="rank-item user-highlight">
                    <div className="rank-position">
                        <span className="rank-number">{posicaoUsuario.posicao}</span>
                    </div>
                    <div className="rank-avatar">
                        {posicaoUsuario.usuario.nome.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="rank-details">
                        <span className="rank-name">Você</span>
                        <span className="rank-points">{posicaoUsuario.usuario.pontos.toLocaleString()} Pontos</span>
                    </div>
                    <div className="user-tag">Sua Posição</div>
                </div>
            )}

            <div className="ranking-list">
                {ranking.map((aluno, index) => (
                    // 4. Não renderizar o usuário logado na lista principal para evitar duplicatas
                    posicaoUsuario?.usuario.id !== aluno.id && (
                        <div key={aluno.id} className="rank-item">
                            <div className="rank-position">
                                {getRankIcon(index)}
                            </div>
                            <div className="rank-avatar">
                                {aluno.nome.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="rank-details">
                                <span className="rank-name">{aluno.nome}</span>
                                <span className="rank-points">{aluno.pontos.toLocaleString()} Pontos</span>
                            </div>
                        </div>
                    )
                ))}
            </div>
        </div>
    );
}

export default Ranking;
