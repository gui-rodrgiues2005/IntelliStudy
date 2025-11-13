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
                <p>Veja quem se destacou e inspire-se para chegar ao topo!</p>
            </div>

            {/* Botão para rolar até a posição do usuário */}
            {posicaoUsuario && (
                <button
                    className="btn-sua-posicao"
                    onClick={() => {
                        const el = document.getElementById(`rank-${posicaoUsuario.usuario.id}`);
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                >
                    Sua Posição
                </button>
            )}

            {/* Lista completa (inclui o próprio usuário) */}
            <div className="ranking-list">
                {ranking.map((aluno, index) => {
                    const isUser = posicaoUsuario?.usuario?.id === aluno.id;
                    return (
                        <div
                            key={aluno.id}
                            id={`rank-${aluno.id}`}
                            className={`rank-item ${isUser ? "user-highlight" : ""}`}
                        >
                            <div className="rank-position">{getRankIcon(index)}</div>
                            <div className="rank-avatar">
                                {aluno.nome.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="rank-details">
                                <span className="rank-name">
                                    {isUser ? "Você" : aluno.nome}
                                </span>
                                <span className="rank-points">
                                    {aluno.pontos.toLocaleString()} Pontos
                                </span>
                            </div>

                            <div className="rank-socials">
                                {(aluno.instagram || aluno.Instagram) && (
                                    <a
                                        href={`https://instagram.com/${(aluno.instagram || aluno.Instagram).replace('@', '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Instagram size={18} />
                                    </a>
                                )}

                                {(aluno.github || aluno.gitHub || aluno.Github) && (
                                    <a
                                        href={`https://github.com/${(aluno.github || aluno.gitHub || aluno.Github).replace('@', '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Github size={18} />
                                    </a>
                                )}

                                {(aluno.linkedin || aluno.Linkedin) && (
                                    <a
                                        href={`https://linkedin.com/in/${(aluno.linkedin || aluno.Linkedin).replace('@', '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Linkedin size={18} />
                                    </a>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Ranking;
