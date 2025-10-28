// Em src/pages/PlanoDeEstudo/PlanoDeEstudo.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, FileText, Target, X, Sparkles, Award, Moon } from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { API_URL } from '../../../config';
import './PlanoDeEstudo.scss';

const getNomeDiaAtual = () => {
    const dias = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'];
    return dias[new Date().getDay()];
};

function PlanoDeEstudo() {
    const [plano, setPlano] = useState({ cronogramaSemanal: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showCongratsModal, setShowCongratsModal] = useState(false);
    const [meta, setMeta] = useState('');
    const [dataProva, setDataProva] = useState('');
    const [materias, setMaterias] = useState('');
    const [horasPorSemana, setHorasPorSemana] = useState(5);
    const navigate = useNavigate();


    // --- FUNÇÃO GENÉRICA PARA FAZER FETCH COM JSON SEGURO ---
    const fetchJSON = async (url, options) => {
        try {
            const res = await fetch(url, options);
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || `Erro ${res.status}`);
            }
            const text = await res.text();
            return text ? JSON.parse(text) : null;
        } catch (err) {
            console.error(`Erro ao buscar ${url}`, err);
            return null;
        }
    };

    // --- BUSCAR PLANO ATIVO ---
    const fetchPlanoAtivo = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            const data = await fetchJSON(`${API_URL}/api/plano-de-estudo/ativo`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setPlano(data ? { ...data, cronogramaSemanal: data.cronogramaSemanal ?? [] } : null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPlanoAtivo();
    }, []);

    // --- CRIAR PLANO ---
    // Em src/pages/PlanoDeEstudo/PlanoDeEstudo.jsx

    const handleCriarPlano = async (e) => {
        e.preventDefault();
        setIsLoading(true); // <-- Mostra o loader na tela inteira
        setIsModalOpen(false);

        const requestBody = {
            meta,
            dataProva,
            materias: materias.split(',').map(m => m.trim()),
            horasPorSemana: Number(horasPorSemana)
        };

        try {
            const token = localStorage.getItem("token");

            // 1. Envia o pedido para a fila e obtém o ID da requisição
            const enfileirarRes = await fetch(`${API_URL}/api/plano-de-estudo/gerar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(requestBody)
            });

            if (!enfileirarRes.ok) {
                const errorText = await enfileirarRes.text();
                throw new Error(`Falha ao iniciar a criação do plano: ${errorText}`);
            }

            const { requestId } = await enfileirarRes.json();
            if (!requestId) {
                throw new Error('ID da requisição não foi retornado pelo servidor.');
            }

            // 2. Função de Polling: Pergunta pelo resultado a cada 3 segundos
            const pollForPlano = (retriesLeft = 20) => { // Tenta por até 60 segundos
                if (retriesLeft === 0) {
                    alert("A geração do plano está demorando mais que o esperado. A página será recarregada para verificar o resultado.");
                    window.location.reload();
                    return;
                }

                // Pergunta pela rota /ativo, que retornará o plano quando estiver pronto
                setTimeout(async () => {
                    console.log(`Tentando buscar plano... Tentativas restantes: ${retriesLeft}`);
                    const planoPronto = await fetchJSON(`${API_URL}/api/plano-de-estudo/ativo`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    // Verifica se o plano retornado é realmente um novo plano (comparando a meta, por exemplo)
                    // E se o plano antigo (se existia) é diferente do novo.
                    if (planoPronto && (!plano || plano.id !== planoPronto.id)) {
                        console.log("Plano novo encontrado!", planoPronto);
                        setPlano(planoPronto); // SUCESSO! Atualiza a tela.
                        setIsLoading(false); // Esconde o loader.
                    } else {
                        // Se não, tenta de novo
                        pollForPlano(retriesLeft - 1);
                    }
                }, 3000);
            };

            // Inicia o processo de polling
            pollForPlano();

        } catch (error) {
            console.error("Falha ao criar plano.", error);
            alert(`Erro ao criar plano: ${error.message}`);
            setIsLoading(false);
        }
    };

    // --- CONCLUIR SESSÃO ---
    const handleConcluirSessao = async (sessaoId) => {
        if (!plano) return;

        const planoOriginal = JSON.parse(JSON.stringify(plano));
        const novoPlano = { ...plano };

        let sessoesCompletasDepois = 0;
        const totalSessoes = plano.cronogramaSemanal.reduce((acc, dia) => acc + (dia.sessoes?.length ?? 0), 0);

        novoPlano.cronogramaSemanal.forEach(dia => {
            dia.sessoes?.forEach(sessao => {
                if (sessao.id === sessaoId) sessao.concluida = !sessao.concluida;
                if (sessao.concluida) sessoesCompletasDepois++;
            });
        });

        setPlano(novoPlano);

        const progressoDepois = totalSessoes > 0 ? (sessoesCompletasDepois / totalSessoes) * 100 : 0;
        if (progressoDepois >= 100) {
            const chaveCelebracao = `celebrado_plano_${plano.id}`;
            if (!localStorage.getItem(chaveCelebracao)) {
                setShowCongratsModal(true);
                localStorage.setItem(chaveCelebracao, 'true');
            }
        }

        try {
            const token = localStorage.getItem("token");
            await fetch(`${API_URL}/api/plano-de-estudo/sessao/${sessaoId}/concluir`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            console.error("Falha ao atualizar sessão.", error);
            setPlano(planoOriginal);
            alert("Não foi possível salvar a conclusão da tarefa.");
        }
    };

    const handleGerarResumoDaSessao = (topico) => {
        localStorage.setItem('topicoInicial', topico);
        navigate('/dashboard');
    };

    const handleFecharCongrats = () => setShowCongratsModal(false);

    const handleNavegarParaHistorico = async () => {
        if (!plano) return;
        const planoId = plano.id;
        setShowCongratsModal(false);
        setPlano(null);
        try {
            const token = localStorage.getItem("token");
            await fetch(`${API_URL}/api/plano-de-estudo/${planoId}/concluir-plano`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            console.error("Falha ao arquivar o plano.", error);
        } finally {
            navigate('/historico-de-planos');
        }
    };

    const nomeDiaAtual = getNomeDiaAtual();

    // --- RENDERIZAÇÃO ---
    const renderHeaderEModais = () => (
        <>
            <div className="page-header">
                <div className="header-content">
                    <Calendar className="header-icon" />
                    <div>
                        <h1>Plano de Estudo Inteligente</h1>
                        <p>Cronograma de estudos personalizado com IA</p>
                    </div>
                </div>
                <button className="btn-novo-plano" onClick={() => setIsModalOpen(true)}>
                    <Plus size={16} /> Novo Plano
                </button>
            </div>

            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()} // evita fechar clicando dentro
                    >
                        <button
                            className="modal-close-btn"
                            onClick={() => setIsModalOpen(false)}
                        >
                            <X size={24} />
                        </button>

                        <h2>Criar Novo Plano de Estudos</h2>
                        <p>
                            Informe seus objetivos e a IA montará o cronograma ideal para você.
                        </p>

                        <form onSubmit={handleCriarPlano}>
                            {/* META */}
                            <div className="form-group">
                                <label>Qual sua meta principal?</label>
                                <input
                                    type="text"
                                    value={meta}
                                    onChange={(e) => setMeta(e.target.value)}
                                    placeholder="Ex: Passar na prova de Cálculo"
                                    required
                                />
                            </div>

                            {/* DATA */}
                            <div className="form-group">
                                <label>Data da prova ou prazo final</label>
                                <input
                                    type="date"
                                    value={dataProva}
                                    onChange={(e) => setDataProva(e.target.value)}
                                    required
                                />
                            </div>

                            {/* MATÉRIAS */}
                            <div className="form-group">
                                <label>Matérias a cobrir (separadas por vírgula)</label>
                                <input
                                    type="text"
                                    value={materias}
                                    onChange={(e) => setMaterias(e.target.value)}
                                    placeholder="Ex: Derivadas, Integrais, Limites"
                                    required
                                />
                            </div>

                            {/* HORAS */}
                            <div className="form-group">
                                <label>
                                    Quantas horas por semana você pode estudar?
                                    <strong> {horasPorSemana}h</strong>
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="20"
                                    step="1"
                                    value={horasPorSemana}
                                    onChange={(e) => setHorasPorSemana(Number(e.target.value))} // ✅ conversão pra número
                                />
                            </div>

                            {/* BOTÃO */}
                            <button type="submit" className="btn-criar-plano">
                                <Sparkles size={20} /> Criar Meu Plano Inteligente
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showCongratsModal && (
                <div className="modal-overlay">
                    <div className="modal-content congrats-modal">
                        <button className="modal-close-btn" onClick={handleFecharCongrats}><X size={24} /></button>
                        <Award className="congrats-icon" size={60} />
                        <h2>Parabéns!</h2>
                        <h3>Você completou sua meta semanal!</h3>
                        <p className="motivacional">"A disciplina é a ponte entre metas e realizações." Seu esforço te levou a mais uma conquista. Continue assim e não haverá limites para o seu conhecimento!</p>
                        <button onClick={handleNavegarParaHistorico} className="btn-criar-plano">Ver Histórico de Planos</button>
                    </div>
                </div>
            )}
        </>
    );

    if (isLoading) return <div className="plano-estudo-page">{renderHeaderEModais()}<p>Carregando plano...</p></div>;
    if (!plano) return (
        <div className="plano-estudo-page">
            {renderHeaderEModais()}
            <div className="placeholder-plano">
                <h3>Nenhum plano de estudos ativo.</h3>
                <p>Clique em "+ Novo Plano" para criar um cronograma personalizado com a ajuda da IA.</p>
                <button className="btn-novo-plano" onClick={() => setIsModalOpen(true)}><Plus size={16} />Criar meu primeiro plano</button>
            </div>
        </div>
    );

    const totalSessoes = plano.cronogramaSemanal.reduce((acc, dia) => acc + (dia.sessoes?.length ?? 0), 0);
    const sessoesCompletas = plano.cronogramaSemanal.reduce((acc, dia) => acc + (dia.sessoes?.filter(s => s.concluida).length ?? 0), 0);
    const progresso = totalSessoes > 0 ? (sessoesCompletas / totalSessoes) * 100 : 0;

    return (
        <div className="plano-estudo-page">
            {renderHeaderEModais()}

            <div className="meta-semanal-card">
                <div className="meta-info"><h3>Meta Semanal</h3><p>{plano.meta}</p></div>
                <div className="meta-progresso">
                    <span className="percentual">{progresso.toFixed(0)}%</span>
                    <span className="completo-label">Completo</span>
                </div>
                <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${progresso}%` }}></div>
                </div>
                <span className="sessoes-concluidas-label">{sessoesCompletas} de {totalSessoes} sessões completas</span>
            </div>

            <div className="cronograma-grid">
                {(plano.cronogramaSemanal || []).map((dia) => {
                    const isDiaAtual = dia.nomeDia?.toUpperCase() === nomeDiaAtual;

                    return (
                        <div key={dia.diaDaSemana} className={`dia-coluna ${isDiaAtual ? "dia-atual" : ""}`}>
                            <h4>{dia.nomeDia}</h4>
                            <div className="sessoes-container">
                                {dia.sessoes && dia.sessoes.length > 0 ? (
                                    dia.sessoes.map((sessao) => (
                                        <div key={sessao.id} className={`sessao-card ${sessao.concluida ? "concluida" : ""}`}>
                                            <div className="sessao-header">
                                                <input type="checkbox" className="ui-checkbox" checked={sessao.concluida} onChange={() => handleConcluirSessao(sessao.id)} />
                                                <div className="sessao-titulo">
                                                    <span>{sessao.topico}</span>
                                                    <small>{sessao.duracaoMinutos} min</small>
                                                </div>
                                            </div>
                                            <div className="sessao-actions">
                                                <button className="action-btn" onClick={() => handleGerarResumoDaSessao(sessao.topico)}><FileText size={16} /> Crie um Resumo </button>
                                                {/* <button className="action-btn"><Target size={16} /> Simulado</button> */}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="dia-descanso">
                                        <p>Dia de descanso</p>
                                        <Moon size={18} />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default PlanoDeEstudo;
