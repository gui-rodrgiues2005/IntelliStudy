import React, { useState, useEffect } from 'react';
import { Trash2, CheckCircle, XCircle, HelpCircle, AlignHorizontalJustifyEnd, ArrowRight, List, AlignStartVertical } from 'lucide-react';
import { API_URL } from '../../../config';
import './Simulados.scss';
import { toast } from 'react-toastify';

// --- COMPONENTE ISOLADO PARA CADA QUESTÃO ---
const Questao = ({ questao, numero }) => {
    const [respostaSelecionada, setRespostaSelecionada] = useState(null);
    const [isCorreta, setIsCorreta] = useState(null);

    const handleResposta = (alternativa) => {
        if (respostaSelecionada) return;
        setRespostaSelecionada(alternativa);
        setIsCorreta(alternativa === questao.respostaCorreta);
    };

    return (
        <div className="questao-card">
            <p className="pergunta-texto"><strong>{numero}.</strong> {questao.pergunta}</p>
            <div className="alternativas-container">
                {questao.alternativas.map((alt, index) => {
                    let itemClass = 'alternativa-item';
                    if (respostaSelecionada) {
                        if (alt === questao.respostaCorreta) itemClass += ' correta';
                        else if (alt === respostaSelecionada) itemClass += ' incorreta';
                    }
                    return (
                        <button
                            key={index}
                            className={itemClass}
                            onClick={() => handleResposta(alt)}
                            disabled={respostaSelecionada !== null}
                        >
                            <span className="alternativa-letra">{String.fromCharCode(65 + index)}</span>
                            <span>{alt}</span>
                        </button>
                    );
                })}
            </div>
            {isCorreta === true && <div className="feedback-correto"><CheckCircle size={16} /> Correto!</div>}
            {isCorreta === false && <div className="feedback-incorreto"><XCircle size={16} /> Incorreto. A resposta certa é: {questao.respostaCorreta}</div>}
        </div>
    );
};

// --- COMPONENTE PRINCIPAL DA PÁGINA ---
function Simulados() {
    const [listaSimulados, setListaSimulados] = useState([]);
    const [simuladoSelecionado, setSimuladoSelecionado] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingDetails, setIsFetchingDetails] = useState(false);
    const [parsedQuiz, setParsedQuiz] = useState([]);

    // Estados para responsividade mobile
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Efeito para detectar mudança de tamanho da tela
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth >= 768) {
                setIsMobileOpen(false); // Fecha sidebar mobile em telas grandes
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Função para alternar a sidebar mobile
    const toggleSidebar = () => {
        setIsMobileOpen(!isMobileOpen);
    };

    useEffect(() => {
        const fetchListaSimulados = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${API_URL}/api/Simulado`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error("Falha ao buscar lista de simulados.");
                const data = await res.json();
                setListaSimulados(data);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchListaSimulados();
    }, []);

    const handleSelecionarSimulado = async (simuladoId) => {
        if (isFetchingDetails || simuladoSelecionado?.id === simuladoId) return;
        setSimuladoSelecionado(null);
        setParsedQuiz([]);
        setIsFetchingDetails(true);

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/api/Simulado/${simuladoId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("Falha ao buscar o simulado.");

            const data = await res.json();

            let parsed = [];

            // 🧠 Tentativa segura de parse
            try {
                if (typeof data.questoesJson === "string") {
                    // Caso tenha JSON duplo (ex: "\"[{\\\"pergunta\\\":...}]\"")
                    const cleaned = data.questoesJson
                        .replace(/^"+|"+$/g, "") // remove aspas duplas externas
                        .replace(/\\"/g, '"');   // remove escapes
                    parsed = JSON.parse(cleaned);
                } else {
                    parsed = data.questoesJson;
                }
            } catch (parseError) {
                toast.info("Erro ao interpretar o JSON do simulado. Tente novamente.");
            }

            setSimuladoSelecionado(data);
            setParsedQuiz(Array.isArray(parsed) ? parsed : []);
            
            if (isMobile) {
                setIsMobileOpen(false);
            }
            
        } catch (error) {
            alert(error.message);
        } finally {
            setIsFetchingDetails(false);
        }
    };


    const handleDeleteSimulado = async (simuladoId, event) => {
        event.stopPropagation();
        if (!window.confirm("Tem certeza que deseja deletar este simulado?")) return;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/api/Simulado/${simuladoId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Falha ao deletar o simulado.");

            setListaSimulados(prevList => prevList.filter(s => s.id !== simuladoId));
            if (simuladoSelecionado?.id === simuladoId) {
                setSimuladoSelecionado(null);
                setParsedQuiz([]);
            }
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    };

    return (
        <div className="meus-simulados-page">
            {/* Botão de menu mobile */}
            {isMobile && (
                <button className="simulados-mobile-menu-btn" onClick={toggleSidebar}>
                    {isMobileOpen ? <ArrowRight size={15} /> : <List size={15} />}
                </button>
            )}

            <aside className={`simulados-sidebar ${isMobile ? (isMobileOpen ? 'open' : 'closed') : ''}`}>
                <h3 className='title-simulados'>Meus Simulados</h3>
                {isLoading ? <p>Carregando...</p> : (
                    <ul className="simulados-list">
                        {listaSimulados.map(simulado => (
                            <li
                                key={simulado.id}
                                onClick={() => handleSelecionarSimulado(simulado.id)}
                                className={simuladoSelecionado?.id === simulado.id ? 'active' : ''}
                            >
                                <div className="item-content">
                                    <span className="topico-titulo">{simulado.topicoOriginal || 'Simulado Antigo'}</span>
                                    <span className="topico-data">
                                        {new Date(simulado.createdAt).toLocaleDateString('pt-BR')}
                                    </span>
                                </div>
                                <button className="delete-btn" onClick={(e) => handleDeleteSimulado(simulado.id, e)}>
                                    <Trash2 size={16} />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </aside>

            <main className="simulado-content">
                {isFetchingDetails && <div className="placeholder-content">Carregando simulado...</div>}

                {!isFetchingDetails && !simuladoSelecionado && (
                    <div className="placeholder-content">
                        <HelpCircle size={48} />
                        <h2>Selecione um simulado para revisar</h2>
                        <p>Teste seus conhecimentos e acompanhe seu progresso.</p>
                    </div>
                )}

                {simuladoSelecionado && parsedQuiz.length > 0 && (
                    <div className="quiz-review-container">
                        <h1>Revisão do Simulado</h1>
                        <h2>{simuladoSelecionado.resumo?.topicoOriginal}</h2>

                        {parsedQuiz.map((question, qIndex) => (
                            <Questao key={qIndex} questao={question} numero={qIndex + 1} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

export default Simulados;