import React, { useEffect, useState, useMemo } from "react";
import {
    LineChart, Line, BarChart, Bar, AreaChart, Area,
    PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, MessageCircle, Target, TrendingUp, Clock, BookOpen, Award, Lightbulb, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "react-toastify";
import "./Desenvolvimento.scss";
import { API_URL } from "../../../config";
import { createPortal } from "react-dom";

function GraficoModal({ children, onClose }) {
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        document.body.classList.add("lock-scroll");
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.classList.remove("lock-scroll");
        };
    }, [onClose]);

    return createPortal(
        <div className="grafico-modal" role="dialog" aria-modal="true" onClick={onClose}>
            <div className="grafico-modal-inner" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose} aria-label="Fechar">×</button>
                {children}
            </div>
        </div>,
        document.body
    );
}

export default function Desempenho() {
    const [userPlano, setUserPlano] = useState("");
    const [userName, setUserName] = useState("");
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeInsight, setActiveInsight] = useState(0);
    const [showAICoach, setShowAICoach] = useState(true);
    const [graficoExpandido, setGraficoExpandido] = useState(null);
    const [graficoAtivo, setGraficoAtivo] = useState(null);
    const token = localStorage.getItem("token");

    const bloqueado = !["pro", "mestre"].includes(userPlano?.toLowerCase());
    const cores = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042"];

    useEffect(() => {
        const fetchUserName = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;

                const res = await fetch(`${API_URL}/api/Profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setUserName(data.nome);
                }
            } catch (error) {
                console.error("Falha ao buscar nome do usuário", error);
            }
        };

        fetchUserName();
    }, []);

    const resumoPorTema = useMemo(() => {
        if (!analyticsData?.acertosPorTema) return [];
        return analyticsData.acertosPorTema.map(a => ({ ...a, valor: Number(a.valor) }));
    }, [analyticsData]);

    const mediaPorTema = useMemo(() => {
        const arr = resumoPorTema.map(r => r.valor);
        if (!arr.length) return 0;
        return arr.reduce((s, v) => s + v, 0) / arr.length;
    }, [resumoPorTema]);

    // lista reutilizável de gráficos
    const graficosList = useMemo(() => ([
        { id: 1, titulo: "Progresso Semanal", tipo: "linha", dados: analyticsData?.progressoSemanal || [], icone: "📈" },
        { id: 2, titulo: "Desempenho por Tema", tipo: "barras", dados: analyticsData?.acertosPorTema || [], icone: "📚" },
        { id: 3, titulo: "Tempo de Estudo", tipo: "area", dados: analyticsData?.tempoDeEstudo || [], icone: "⏰" },
        { id: 4, titulo: "Distribuição", tipo: "pizza", dados: analyticsData?.distribuicao || [], icone: "🎯" },
    ]), [analyticsData]);

    // 🔹 EFEITOS DE CLIQUE NOS GRÁFICOS
    const handleGraficoClick = (graficoId, event) => {
        if (bloqueado) return;

        event?.stopPropagation();
        setGraficoAtivo(graficoId);

        // abre modal via portal (não escala a página)
        setGraficoExpandido(prev => (prev === graficoId ? null : graficoId));

        // reset do estado ativo para animação
        setTimeout(() => setGraficoAtivo(null), 300);
    };

    // 🔹 CLIQUE FORA DO GRÁFICO PARA FECHAR
    const handleClickFora = () => {
        setGraficoExpandido(null);
    };

    // 🔹 FUNÇÃO ORIGINAL - Gerar conselhos para temas
    function generateAdviceForTema(dados) {
        if (!dados || dados.length === 0) return null;

        const valores = dados.map(d => Number(d.valor ?? 0));
        const media = valores.reduce((s, v) => s + v, 0) / valores.length;
        const piorIndex = valores.indexOf(Math.min(...valores));
        const piorTema = dados[piorIndex]?.tema ?? "Geral";
        const piorValor = valores[piorIndex] ?? 0;

        if (media >= 85) {
            return (
                <div>
                    <strong>Excelente desempenho!</strong> Sua média por tema está em{" "}
                    <strong>{media.toFixed(0)}%</strong>. Continue assim e mantenha a constância!
                </div>
            );
        }

        if (media >= 65) {
            return (
                <div>
                    <strong>Bom progresso!</strong> Sua média geral é{" "}
                    <strong>{media.toFixed(0)}%</strong>. Revise o tema{" "}
                    <strong>{piorTema}</strong> (atual: {piorValor.toFixed(0)}%).
                </div>
            );
        }

        return (
            <div>
                <strong>Você pode melhorar!</strong> Sua média está em{" "}
                <strong>{media.toFixed(0)}%</strong>. Dica: comece revisando o tema{" "}
                <strong>{piorTema}</strong> ({piorValor.toFixed(0)}%) e:
                <ul className="advice-list">
                    <li>Leia as explicações detalhadas</li>
                    <li>Refaça os simulados desse tema</li>
                    <li>Reveja o conteúdo com calma</li>
                </ul>
            </div>
        );
    }

    // 🔹 ANÁLISE INTELIGENTE DO DESEMPENHO
    function analisarDesempenho(dados) {
        if (!dados) return null;

        const insights = [];
        const alertas = [];

        // Análise do progresso semanal
        if (dados.progressoSemanal?.length > 0) {
            const progresso = dados.progressoSemanal.map(p => p.valor);
            const tendencia = progresso[progresso.length - 1] - progresso[0];

            if (tendencia > 0) {
                insights.push({
                    tipo: "positivo",
                    icone: <TrendingUp size={20} />,
                    titulo: "Progresso Crescente!",
                    mensagem: `Seu desempenho melhorou ${tendencia.toFixed(1)}% nesta semana. Continue assim!`,
                    acao: "Mantenha a consistência dos estudos"
                });
            } else if (tendencia < -5) {
                alertas.push({
                    tipo: "alerta",
                    icone: <Clock size={20} />,
                    titulo: "Queda no Rendimento",
                    mensagem: `Seu desempenho caiu ${Math.abs(tendencia).toFixed(1)}% esta semana. Vamos ajustar isso!`,
                    acao: "Revise os temas com maior dificuldade"
                });
            }
        }

        // Análise de acertos por tema
        if (dados.acertosPorTema?.length > 0) {
            const temas = dados.acertosPorTema;
            const piorTema = temas.reduce((prev, current) =>
                (prev.valor < current.valor) ? prev : current
            );
            const melhorTema = temas.reduce((prev, current) =>
                (prev.valor > current.valor) ? prev : current
            );

            if (piorTema.valor < 50) {
                alertas.push({
                    tipo: "critico",
                    icone: <BookOpen size={20} />,
                    titulo: "Tema Crítico Identificado",
                    mensagem: `${piorTema.tema} está com apenas ${piorTema.valor}% de acertos. Precisa de atenção urgente!`,
                    acao: `Foque em revisar "${piorTema.tema}" nesta semana`
                });
            }

            if (melhorTema.valor > 85) {
                insights.push({
                    tipo: "destaque",
                    icone: <Award size={20} />,
                    titulo: "Pontos Fortes!",
                    mensagem: `Você é excelente em ${melhorTema.tema} (${melhorTema.valor}% de acertos)`,
                    acao: "Use esse conhecimento para ajudar em temas relacionados"
                });
            }
        }

        // Análise de tempo de estudo
        if (dados.tempoDeEstudo?.length > 0) {
            const tempoTotal = dados.tempoDeEstudo.reduce((sum, t) => sum + t.valor, 0);
            const mediaDiaria = tempoTotal / dados.tempoDeEstudo.length;

            if (mediaDiaria < 60) {
                alertas.push({
                    tipo: "alerta",
                    icone: <Clock size={20} />,
                    titulo: "Tempo de Estudo Baixo",
                    mensagem: `Você estuda em média ${mediaDiaria.toFixed(0)}min por dia. Ideal seria 90-120min.`,
                    acao: "Aumente gradualmente 15min por dia"
                });
            } else if (mediaDiaria > 180) {
                insights.push({
                    tipo: "positivo",
                    icone: <Target size={20} />,
                    titulo: "Dedicação Exemplar!",
                    mensagem: `Ótimo! ${mediaDiaria.toFixed(0)}min diários mostram grande comprometimento.`,
                    acao: "Mantenha pausas regulares para evitar burnout"
                });
            }
        }

        return { insights, alertas };
    }

    // 🔹 MENSAGEM PERSONALIZADA DA IA
    function gerarMensagemPrincipal(analise, userName) {
        if (!analise) return null;

        const { insights, alertas } = analise;
        const nome = userName;

        if (alertas.length > 0 && alertas.find(a => a.tipo === "critico")) {
            const critico = alertas.find(a => a.tipo === "critico");
            return {
                tipo: "urgente",
                titulo: `⚠️ Atenção, ${nome}!`,
                mensagem: `Identificamos um ponto que precisa de ação imediata: ${critico.mensagem}`,
                dica: `**Dica do Coach:** ${critico.acao}. Que tal focar 30min extras por dia nesse tema?`,
                cor: "#ff4757"
            };
        }

        if (insights.length > 0) {
            const melhorInsight = insights[0];
            return {
                tipo: "motivacao",
                titulo: `🎯 Olá, ${nome}!`,
                mensagem: `Seu desempenho está evoluindo bem. ${melhorInsight.mensagem}`,
                dica: `**Próximo Passo:** ${melhorInsight.acao}`,
                cor: "#2ed573"
            };
        }

        return {
            tipo: "orientacao",
            titulo: `👋 Vamos começar, ${nome}!`,
            mensagem: "Estamos analisando seu padrão de estudos para dar orientações personalizadas.",
            dica: "**Dica Inicial:** Mantenha consistência nos estudos e revise os conteúdos regularmente.",
            cor: "#3742fa"
        };
    }

    useEffect(() => {
        const carregarDados = async () => {
            try {
                const resUser = await fetch(`${API_URL}/api/User/meus-dados`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!resUser.ok) throw new Error("Erro ao carregar dados do usuário");
                const userData = await resUser.json();

                setUserPlano(userData.plano);
                setUserName(userData.nome);

                if (["pro", "mestre"].includes(userData.plano?.toLowerCase())) {
                    const resAnalytics = await fetch(`${API_URL}/api/analytics/user`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    if (!resAnalytics.ok) throw new Error("Erro ao carregar analytics");

                    const data = await resAnalytics.json();

                    setAnalyticsData({
                        progressoSemanal: data.progressoSemanal?.map(p => ({
                            dia: p.dia,
                            valor: p.valor
                        })) || [],
                        acertosPorTema: data.acertosPorTema?.map(a => ({
                            tema: a.tema,
                            valor: Number(a.valor.toFixed(1))
                        })) || [],
                        tempoDeEstudo: data.tempoDeEstudo?.map(t => ({
                            dia: t.dia,
                            valor: t.valor
                        })) || [],
                        distribuicao: [
                            { name: "Acertos", value: data.distribuicao?.acertos || 0 },
                            { name: "Erros", value: data.distribuicao?.erros || 0 }
                        ]
                    });
                }
            } catch (err) {
                console.error("Erro ao carregar dados:", err);
                toast.error("Não foi possível carregar as análises.");
            } finally {
                setLoading(false);
            }
        };
        if (token) carregarDados();
    }, [token]);

    if (loading) return <div className="loading">Analisando seu desempenho...</div>;
    if (!analyticsData && !bloqueado) return <div className="loading">Nenhum dado encontrado.</div>;

    const { progressoSemanal, acertosPorTema, tempoDeEstudo, distribuicao } = analyticsData || {};
    const analise = analisarDesempenho(analyticsData);
    const mensagemPrincipal = gerarMensagemPrincipal(analise, userName);

    // pega o gráfico selecionado quando modal aberto
    const graficoSelecionado = graficosList.find(g => g.id === graficoExpandido) || null;

    return (
        <div className="desempenho-page" onClick={handleClickFora}>
            {/* 🎯 SEÇÃO COACH IA */}
            <AnimatePresence>
                {showAICoach && mensagemPrincipal && (
                    <motion.div
                        className="ai-coach-section"
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        style={{ borderLeftColor: mensagemPrincipal.cor }}
                    >
                        <div className="coach-header">
                            <div className="coach-avatar">
                                <MessageCircle size={24} />
                            </div>
                            <div className="coach-content">
                                <h2>{mensagemPrincipal.titulo}</h2>
                                <p>{mensagemPrincipal.mensagem}</p>
                                <div className="coach-tip">
                                    <Lightbulb size={16} />
                                    <span dangerouslySetInnerHTML={{
                                        __html: mensagemPrincipal.dica.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                    }} />
                                </div>
                            </div>
                            <button
                                className="close-coach"
                                onClick={() => setShowAICoach(false)}
                            >
                                ×
                            </button>
                        </div>

                        {/* INSIGHTS E ALERTAS */}
                        {analise && (analise.insights.length > 0 || analise.alertas.length > 0) && (
                            <div className="insights-container">
                                <h3>📋 Análise Detalhada do Seu Desempenho</h3>

                                <div className="insights-grid">
                                    {analise.alertas.map((alerta, index) => (
                                        <motion.div
                                            key={`alerta-${index}`}
                                            className={`insight-card ${alerta.tipo}`}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            <div className="insight-icon">{alerta.icone}</div>
                                            <div className="insight-content">
                                                <h4>{alerta.titulo}</h4>
                                                <p>{alerta.mensagem}</p>
                                                <span className="insight-action">{alerta.acao}</span>
                                            </div>
                                        </motion.div>
                                    ))}

                                    {analise.insights.map((insight, index) => (
                                        <motion.div
                                            key={`insight-${index}`}
                                            className={`insight-card ${insight.tipo}`}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: (analise.alertas.length + index) * 0.1 }}
                                        >
                                            <div className="insight-icon">{insight.icone}</div>
                                            <div className="insight-content">
                                                <h4>{insight.titulo}</h4>
                                                <p>{insight.mensagem}</p>
                                                <span className="insight-action">{insight.acao}</span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 📊 SEÇÃO DE GRÁFICOS COM EFEITOS DE CLIQUE */}
            <div className="graficos-section">
                <h1 className="titulo">📊 Dashboard de Desempenho</h1>
                <p className="subtitulo">Clique nos gráficos para ampliar e ver detalhes</p>

                <div className="graficos-grid">
                    {graficosList.map((grafico, index) => (
                        <motion.div
                            key={grafico.id}
                            className={`grafico-card ${graficoAtivo === grafico.id ? 'ativo' : ''}`}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.12 + 0.2 }}
                            onClick={(e) => handleGraficoClick(grafico.id, e)}
                            whileHover={{ scale: graficoExpandido ? 1 : 1.02 }}
                        >
                            {bloqueado && (
                                <div className="bloqueado-overlay">
                                    <Lock size={40} />
                                    <p>
                                        Faça upgrade para o plano <strong>Pro</strong> e acompanhe seu progresso!
                                    </p>
                                </div>
                            )}

                            {!bloqueado && (
                                <div className="grafico-controles">
                                    <button className="btn-expandir" aria-label="Expandir gráfico" onClick={(e) => handleGraficoClick(grafico.id, e)}>
                                        {graficoExpandido === grafico.id ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
                                    </button>
                                </div>
                            )}

                            <h3 className="grafico-titulo">
                                <span>{grafico.icone}</span>
                                {grafico.titulo}
                            </h3>

                            <ResponsiveContainer width="100%" height={280}>
                                {grafico.tipo === "linha" && (
                                    <LineChart data={bloqueado ? [] : grafico.dados}>
                                        <XAxis dataKey="dia" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line
                                            type="monotone"
                                            dataKey="valor"
                                            stroke="#7367f0"
                                            strokeWidth={3}
                                            dot={{ r: 5 }}
                                        />
                                    </LineChart>
                                )}

                                {grafico.tipo === "barras" && (
                                    <>
                                        <BarChart data={bloqueado ? [] : grafico.dados}>
                                            <XAxis dataKey="tema" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar
                                                dataKey="valor"
                                                radius={[8, 8, 0, 0]}
                                                animationDuration={800}
                                            >
                                                {grafico.dados?.map((entry, idx) => {
                                                    let cor = "#28c76f";
                                                    if (entry.valor < 50) cor = "#ff4d4f";
                                                    else if (entry.valor < 75) cor = "#ffc658";
                                                    return <Cell key={`cell-${idx}`} fill={cor} />;
                                                })}
                                            </Bar>
                                        </BarChart>

                                        <div className="grafico-legenda">
                                            <span><i className="legenda-bullet good" /> Bom (≥75%)</span>
                                            <span><i className="legenda-bullet ok" /> Médio (50–74%)</span>
                                            <span><i className="legenda-bullet bad" /> Baixo (&lt;50%)</span>
                                        </div>

                                        {!bloqueado && grafico.dados?.length > 0 && (
                                            <div className="grafico-advice">
                                                {generateAdviceForTema(grafico.dados)}
                                            </div>
                                        )}
                                    </>
                                )}

                                {grafico.tipo === "area" && (
                                    <AreaChart data={bloqueado ? [] : grafico.dados}>
                                        <XAxis dataKey="dia" />
                                        <YAxis />
                                        <Tooltip />
                                        <Area dataKey="valor" stroke="#ffa500" fill="#ffe5b4" />
                                    </AreaChart>
                                )}

                                {grafico.tipo === "pizza" && (
                                    <PieChart>
                                        <Pie
                                            data={bloqueado ? [] : grafico.dados}
                                            dataKey="value"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            innerRadius={40}
                                            paddingAngle={1}
                                            cornerRadius={8}
                                            startAngle={90}
                                            endAngle={450}
                                            animationBegin={0}
                                            animationDuration={800}
                                            animationEasing="ease-out"
                                        >
                                            {grafico.dados?.map((entry, idx) => (
                                                <Cell
                                                    key={`cell-${idx}`}
                                                    fill={cores[idx % cores.length]}
                                                    stroke="#ffffff"
                                                    strokeWidth={3}
                                                    style={{
                                                        filter: `drop-shadow(0px 4px 8px ${cores[idx % cores.length]}40)`
                                                    }}
                                                />
                                            ))}
                                        </Pie>

                                        <text
                                            x="50%"
                                            y="50%"
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            className="pie-label"
                                        >
                                            {!bloqueado && grafico.dados?.length > 0 && (
                                                <>
                                                    <tspan x="50%" y="45%" className="pie-label-total">
                                                        {grafico.dados.reduce((sum, entry) => sum + (entry.value || 0), 0)}%
                                                    </tspan>
                                                    <tspan x="50%" y="55%" className="pie-label-text">
                                                        Total
                                                    </tspan>
                                                </>
                                            )}
                                        </text>

                                        <Tooltip />
                                    </PieChart>
                                )}
                            </ResponsiveContainer>

                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Modal via Portal: renderiza o gráfico selecionado sobre o overlay */}
            {graficoSelecionado && (
                <GraficoModal onClose={() => setGraficoExpandido(null)}>
                    <div className="grafico-modal-header">
                        <h3>{graficoSelecionado.icone} {graficoSelecionado.titulo}</h3>
                    </div>

                    <div className="grafico-modal-body">
                        <ResponsiveContainer width="100%" height="100%">
                            {graficoSelecionado.tipo === "linha" && (
                                <LineChart data={graficoSelecionado.dados || []}>
                                    <XAxis dataKey="dia" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="valor" stroke="#7367f0" strokeWidth={3} dot={{ r: 6 }} />
                                </LineChart>
                            )}

                            {graficoSelecionado.tipo === "barras" && (
                                <BarChart data={graficoSelecionado.dados || []}>
                                    <XAxis dataKey="tema" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
                                        {graficoSelecionado.dados?.map((entry, i) => {
                                            let cor = "#28c76f";
                                            if (entry.valor < 50) cor = "#ff4d4f";
                                            else if (entry.valor < 75) cor = "#ffc658";
                                            return <Cell key={i} fill={cor} />;
                                        })}
                                    </Bar>
                                </BarChart>
                            )}

                            {graficoSelecionado.tipo === "area" && (
                                <AreaChart data={graficoSelecionado.dados || []}>
                                    <XAxis dataKey="dia" />
                                    <YAxis />
                                    <Tooltip />
                                    <Area dataKey="valor" stroke="#ffa500" fill="#ffe5b4" />
                                </AreaChart>
                            )}

                            {graficoSelecionado.tipo === "pizza" && (
                                <PieChart>
                                    <Pie
                                        data={graficoSelecionado.dados || []}
                                        dataKey="value"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={120}
                                        innerRadius={60}
                                        paddingAngle={1}
                                        cornerRadius={8}
                                    >
                                        {graficoSelecionado.dados?.map((entry, i) => (
                                            <Cell key={i} fill={cores[i % cores.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            )}
                        </ResponsiveContainer>

                        {/* extras no modal */}
                        {graficoSelecionado.tipo === "barras" && graficoSelecionado.dados?.length > 0 && (
                            <>
                                <div className="grafico-legenda">
                                    <span><i className="legenda-bullet good" /> Bom (≥75%)</span>
                                    <span><i className="legenda-bullet ok" /> Médio (50–74%)</span>
                                    <span><i className="legenda-bullet bad" /> Baixo (&lt;50%)</span>
                                </div>
                                <div className="grafico-advice">
                                    {generateAdviceForTema(graficoSelecionado.dados)}
                                </div>
                            </>
                        )}
                    </div>
                </GraficoModal>
            )}

            {/* 🎯 BOTÃO PARA REABRIR O COACH */}
            {!showAICoach && (
                <motion.button
                    className="floating-coach-btn"
                    onClick={() => setShowAICoach(true)}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                >
                    <MessageCircle size={20} />
                    Consultar Coach
                </motion.button>
            )}
        </div>
    );
}