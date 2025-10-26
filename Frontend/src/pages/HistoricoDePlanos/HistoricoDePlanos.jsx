import { useState, useEffect } from 'react';
import { Archive } from 'lucide-react';
import './HistoricoDePlanos.scss';

function HistoricoDePlanos() {
    const [planos, setPlanos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const API_URL = process.env.VITE_API_URL;
    useEffect(() => {
        const fetchPlanosConcluidos = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${API_URL}/api/plano-de-estudo/concluidos`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setPlanos(data);
                }
            } catch (error) {
                console.error("Falha ao buscar histórico.", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPlanosConcluidos();
    }, []);

    return (
        <div className="historico-page">
            <div className="page-header">
                <Archive className="header-icon" />
                <div>
                    <h1>Histórico de Planos</h1>
                    <p>Revise suas metas e jornadas de estudo concluídas.</p>
                </div>
            </div>

            {isLoading ? (
                <p>Carregando histórico...</p>
            ) : planos.length > 0 ? (
                <div className="lista-historico">
                    {planos.map(plano => (
                        <div key={plano.id} className="historico-card">
                            <div className="card-content">
                                <span className="card-data">
                                    Concluído em: {new Date(plano.createdAt).toLocaleDateString()}
                                </span>
                                <h3 className="card-meta">{plano.meta}</h3>
                                <p className="card-sessoes">{plano.totalSessoes} sessões completadas</p>
                            </div>
                            {/* Futuramente, um botão para ver detalhes */}
                            {/* <button className="btn-detalhes">Ver Detalhes</button> */}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="placeholder-historico">
                    <h3>Nenhum plano concluído ainda.</h3>
                    <p>Complete seu primeiro plano de estudos para vê-lo aqui!</p>
                </div>
            )}
        </div>
    );
}

export default HistoricoDePlanos;
