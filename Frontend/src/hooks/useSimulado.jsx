import { useState, useRef, useEffect } from "react";
import { API_URL } from "../../config";
import { toast } from "react-toastify";

export default function useSimulado(resumoGerado) {
    const token = localStorage.getItem("token");

    // Estados principais
    const [quiz, setQuiz] = useState([]);
    const [numQuestions, setNumQuestions] = useState(5);
    const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
    const [score, setScore] = useState(null);
    const [userAnswers, setUserAnswers] = useState({});
    const [simuladoGerado, setSimuladoGerado] = useState(null);
    const [isFinishing, setIsFinishing] = useState(false);

    const quizContainerRef = useRef(null);

    // Evita múltiplos pollings duplicados
    const pollingRef = useRef(null);

    // -----------------------------
    // 1) Salvar estado no sessionStorage
    // -----------------------------
    useEffect(() => {
        const stateToSave = {
            quiz,
            numQuestions,
            score,
            userAnswers,
            simuladoGerado
            // isFinishing NÃO deve ser restaurado!
        };

        sessionStorage.setItem("simuladoState", JSON.stringify(stateToSave));
    }, [quiz, numQuestions, score, userAnswers, simuladoGerado]);

    // -----------------------------
    // 2) Restaurar o estado ao abrir a tela
    // -----------------------------
    useEffect(() => {
        const saved = sessionStorage.getItem("simuladoState");

        if (saved) {
            try {
                const parsed = JSON.parse(saved);

                setQuiz(parsed.quiz || []);
                setNumQuestions(parsed.numQuestions || 5);
                setScore(parsed.score ?? null);
                setUserAnswers(parsed.userAnswers || {});
                setSimuladoGerado(parsed.simuladoGerado || null);

                // Nunca restaurar finishing
                setIsFinishing(false);
            } catch (err) {
                console.error("Erro ao restaurar simulado", err);
            }
        }
    }, []);

    // -----------------------------
    // 3) Retomar polling automaticamente se usuário voltar
    // -----------------------------
    useEffect(() => {
        if (
            simuladoGerado?.requestId &&
            quiz.length === 0 &&
            score === null &&
            !pollingRef.current
        ) {
            startPolling(simuladoGerado.requestId);
        }
    }, [simuladoGerado]);

    // -----------------------------
    // GERAR SIMULADO
    // -----------------------------
    const handleGenerateQuiz = async () => {
        try {
            setIsGeneratingQuiz(true);
            setScore(null);
            setUserAnswers({});
            setQuiz([]);

            const response = await fetch(`${API_URL}/api/Simulado/gerar`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    conteudoId: resumoGerado?.id || resumoGerado?.Id,
                    numeroDeQuestoes: numQuestions
                })
            });

            if (!response.ok) throw new Error("Erro ao enviar simulado");

            const { requestId } = await response.json();

            setSimuladoGerado({ requestId });
            startPolling(requestId);
        } catch (err) {
            console.error(err);
            setIsGeneratingQuiz(false);
        }
    };

    // -----------------------------
    // POLLING
    // -----------------------------
    const startPolling = (requestId) => {
        if (pollingRef.current) return;

        pollingRef.current = setInterval(async () => {
            try {
                const res = await fetch(`${API_URL}/api/generation/status/${requestId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const data = await res.json();

                console.log("📡 [POLLING] Resposta recebida:", data);

                // ----------------------
                // STATUS 2 → CONCLUÍDO
                // ----------------------
                if (data.status === 2) {
                    console.log("✅ [POLLING] Pedido concluído");

                    clearInterval(pollingRef.current);
                    pollingRef.current = null;

                    console.log("📦 [POLLING] outputMetadata bruto:", data.outputMetadata);

                    let parsed = data.resultado;

                    if (typeof parsed === "string") {
                        try {
                            parsed = JSON.parse(parsed);
                        } catch { }
                    }

                    const questoes =
                        Array.isArray(parsed)
                            ? parsed
                            : parsed.QuestoesJson ||
                            parsed.questoesJson ||
                            parsed.questoes ||
                            [];

                    console.log("📝 [POLLING] Questões detectadas:", questoes);

                    setQuiz(questoes);

                    // 🔥 LOG AQUI PARA SABER SE ESTÁ SALVANDO NO ESTADO
                    setSimuladoGerado(prev => {
                        console.log("💾 [SAVE] Antes de salvar:", prev);
                        console.log("💾 [SAVE] Salvando outputMetadata:", data.outputMetadata);

                        return {
                            ...prev,
                            outputMetadata: data.outputMetadata
                        };
                    });

                    setIsGeneratingQuiz(false);
                }

                // Erro
                if (data.status === 3) {
                    console.log("❌ [POLLING] Pedido falhou:", data.mensagemErro);

                    clearInterval(pollingRef.current);
                    pollingRef.current = null;
                    setIsGeneratingQuiz(false);
                }

            } catch (e) {
                console.error("🔥 [POLLING ERROR]", e);
            }
        }, 3000);
    };


    // -----------------------------
    // FINALIZAR SIMULADO
    // -----------------------------
    const handleSubmitQuiz = async () => {
        console.log("🔍 [SUBMIT] simuladoGerado atual:", simuladoGerado);

        const rawMeta =
            simuladoGerado.outputMetadata ||
            simuladoGerado.OutputMetadata ||
            simuladoGerado.metadata ||
            simuladoGerado.MetaData;

        console.log("📦 [SUBMIT] rawMeta:", rawMeta);

        const metadata = rawMeta ? JSON.parse(rawMeta) : {};

        console.log("🧩 [SUBMIT] metadata parseado:", metadata);

        const simuladoId = metadata.SimuladoId || metadata.simuladoId;
        const requestId = metadata.RequestId || metadata.requestId;

        console.log("🎯 [SUBMIT] simuladoId:", simuladoId);
        console.log("🎯 [SUBMIT] requestId:", requestId);

        if (!simuladoId && !requestId) {
            console.error("🚨 [SUBMIT] Nem simuladoId nem requestId encontrado");
            alert("Nenhum identificador encontrado.");
            return;
        }

        try {
            const token = localStorage.getItem("token");

            // --------------------------------------
            // 🔄 CONVERTER RESPOTAS → TEXTO REAL
            // --------------------------------------
            console.log("📘 [QUIZ] Questões carregadas:", quiz);
            console.log("🟦 [ANSWERS] userAnswers:", userAnswers);

            const respostasConvertidas = {};

            Object.keys(userAnswers).forEach((index) => {
                const respostaIndex = userAnswers[index];
                const textoAlternativa = quiz[index]?.alternativas?.[respostaIndex];

                respostasConvertidas[index] = textoAlternativa;
            });

            console.log("📝 [RESPOSTAS CONVERTIDAS]:", respostasConvertidas);

            // ----------------------------
            // FINALIZANDO COM SIMULADO ID
            // ----------------------------
            if (simuladoId) {
                console.log("🚀 [FINALIZAR] Finalizando simulado:", simuladoId);

                const res = await fetch(`${API_URL}/api/Simulado/${simuladoId}/finalizar`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(respostasConvertidas)
                });

                if (!res.ok) {
                    const errorText = await res.text();
                    throw new Error(`Falha ao finalizar o simulado: ${errorText}`);
                }

                const resultado = await res.json();
                console.log("🏁 [FINALIZADO] Resultado recebido:", resultado);

                const finalScore = (resultado.acertos / resultado.totalQuestoes) * 100;
                setScore(finalScore);
                toast.success("Simulado finalizado com sucesso!");
                return;
            }

            // ------------------------------------
            // CASO SÓ TENHA REQUEST ID
            // ------------------------------------
            if (requestId) {
                console.log("🔎 [BUSCA] Buscando simulado por requestId:", requestId);

                const resBusca = await fetch(`${API_URL}/api/Simulado/por-request/${requestId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!resBusca.ok) throw new Error("Não foi possível localizar o simulado.");

                const simulado = await resBusca.json();

                console.log("📌 [BUSCA] Simulado encontrado:", simulado);

                if (!simulado?.id) throw new Error("Simulado retornado não contém ID.");

                console.log("🚀 [FINALIZAR] Finalizando simulado:", simulado.id);

                const resFinalizar = await fetch(`${API_URL}/api/Simulado/${simulado.id}/finalizar`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(respostasConvertidas)
                });

                if (!resFinalizar.ok) {
                    const errorText = await resFinalizar.text();
                    throw new Error(`Falha ao finalizar simulado: ${errorText}`);
                }

                const resultado = await resFinalizar.json();
                console.log("🏁 [FINALIZADO] Resultado recebido:", resultado);

                const finalScore = (resultado.acertos / resultado.totalQuestoes) * 100;
                setScore(finalScore);
                toast.success("Simulado finalizado com sucesso!");
            }

        } catch (error) {
            console.error("🔥 [ERRO AO FINALIZAR]", error);
            toast.error(error.message);
        }
    };


    // -----------------------------
    // Retorno do hook
    // -----------------------------
    return {
        quiz,
        numQuestions,
        setNumQuestions,
        isGeneratingQuiz,
        handleGenerateQuiz,
        handleSubmitQuiz,
        userAnswers,
        setUserAnswers,
        score,
        setScore,
        quizContainerRef,
        simuladoGerado,
        isFinishing
    };
}
