// Em src/pages/Ranking/Ranking.jsx

import { useState, useEffect } from 'react';
import { Crown, Medal, Award, Instagram, Linkedin, Github } from 'lucide-react';
import { API_URL } from '../../../config';
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
                const res = await fetch(`${API_URL}/api/Ranking`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error("Falha ao buscar o ranking.");

                const data = await res.json();
                console.log("Resposta completa do ranking:", data); // <--- Aqui
                setRanking(data.ranking);
                setPosicaoUsuario(data.posicaoUsuarioLogado);
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
                <h1>Hall da Fama</h1>
                <p>Veja quem se destacou e inspire-se para chegar ao topo do Hall da Fama!</p>
            </div>

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

                    {/* Redes sociais do usuário logado */}
                    <div className="rank-socials">
                        {posicaoUsuario.usuario.instagram && (
                            <a
                                href={`https://instagram.com/${posicaoUsuario.usuario.instagram.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Instagram />
                            </a>
                        )}
                        {posicaoUsuario.usuario.linkedin && (
                            <a
                                href={`https://linkedin.com/in/${posicaoUsuario.usuario.linkedin.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Linkedin />
                            </a>
                        )}
                        {posicaoUsuario.usuario.gitHub && (
                            <a
                                href={`https://github.com/${posicaoUsuario.usuario.gitHub.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Github />
                            </a>
                        )}
                    </div>
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

                            {/* Redes sociais agora fora do rank-details e com própria grid column */}
                            <div className="rank-socials">
                                {(posicaoUsuario.usuario.instagram || posicaoUsuario.usuario.Instagram) && (
                                    <a
                                        href={`https://instagram.com/${(posicaoUsuario.usuario.instagram || posicaoUsuario.usuario.Instagram).replace('@', '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Instagram />
                                    </a>
                                )}

                                {(posicaoUsuario.usuario.gitHub || posicaoUsuario.usuario.github) && (
                                    <a
                                        href={`https://github.com/${(posicaoUsuario.usuario.gitHub || posicaoUsuario.usuario.github).replace('@', '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Github />
                                    </a>
                                )}

                                {(aluno.gitHub || aluno.github) && (
                                    <a
                                        href={`https://github.com/${(aluno.gitHub || aluno.github).replace('@', '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Github />
                                    </a>
                                )}

                            </div>
                        </div>
                    )
                ))}
            </div>
        </div>
    );
}

export default Ranking;
