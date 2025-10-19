import React, { useState, useEffect } from 'react';
import { Trash2, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import './Simulados.scss';

// --- COMPONENTE ISOLADO PARA CADA QUESTÃO ---
// (Mantém a lógica de interatividade que já tínhamos)
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

    useEffect(() => {
        const fetchListaSimulados = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem("token");
                const res = await fetch('http://localhost:5051/api/Simulado', {
                    headers: { 'Authorization': `Bearer ${token}` }
                } );
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
            const res = await fetch(`http://localhost:5051/api/Simulado/${simuladoId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            } );
            if (!res.ok) throw new Error("Falha ao buscar o simulado.");
            const data = await res.json();
            setSimuladoSelecionado(data);
            setParsedQuiz(JSON.parse(data.questoesJson || '[]'));
        } catch (error) {
            console.error(error);
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
            const res = await fetch(`http://localhost:5051/api/Simulado/${simuladoId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            } );
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
            <aside className="simulados-sidebar">
                <h3>Meus Simulados</h3>
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
