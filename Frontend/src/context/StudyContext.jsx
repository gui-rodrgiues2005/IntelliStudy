// ...existing code...
import { createContext, useState, useContext, useRef, useEffect } from 'react';
import { API_URL } from '../../config';

const StudyContext = createContext();

export function StudyProvider({ children }) {
    const [resumoGerado, setResumoGerado] = useState(null);
    const [simuladoGerado, setSimuladoGerado] = useState(null);
    const [quiz, setQuiz] = useState([]);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
    const [chats, setChats] = useState([]);
    const [chatAtivo, setChatAtivo] = useState(null);
    // polling persistente
    const [activeRequestId, setActiveRequestId] = useState(null);
    const pollingRef = useRef(null);
    const isMountedRef = useRef(true);

    // controle de typewriter completados
    const [completedTypewriters, setCompletedTypewriters] = useState(new Set());

    useEffect(() => {
        const savedChats = localStorage.getItem('userChats');
        if (savedChats) {
            try {
                setChats(JSON.parse(savedChats));
            } catch (error) {
                console.error('Erro ao carregar chats:', error);
            }
        }
    }, []);

    // Salvar chats no localStorage
    useEffect(() => {
        localStorage.setItem('userChats', JSON.stringify(chats));
    }, [chats]);


    const criarNovoChat = (resumoId, titulo) => {
        const novoChat = {
            id: Date.now().toString(),
            resumoId,
            titulo: titulo || `Chat ${chats.length + 1}`,
            mensagens: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        setChats(prev => [novoChat, ...prev]);
        setChatAtivo(novoChat.id);
        return novoChat.id;
    };

    const adicionarMensagem = (chatId, mensagem) => {
        setChats(prev => prev.map(chat => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    mensagens: [...chat.mensagens, mensagem],
                    updatedAt: new Date().toISOString()
                };
            }
            return chat;
        }));
    };

    const deletarChat = (chatId) => {
        setChats(prev => prev.filter(chat => chat.id !== chatId));
        if (chatAtivo === chatId) {
            setChatAtivo(null);
        }
    };

    const markTypewriterAsCompleted = (resumoId) => {
        setCompletedTypewriters(prev => {
            const next = new Set(prev);
            next.add(resumoId);
            return next;
        });
    };

    const isTypewriterCompleted = (resumoId) => completedTypewriters.has(resumoId);

    const clearCompletedTypewriters = () => setCompletedTypewriters(new Set());

    const startGenerationPolling = (requestId) => {
        if (!requestId) return;
        if (pollingRef.current) {
            if (activeRequestId === requestId) return;
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }

        setActiveRequestId(requestId);
        setIsGeneratingSummary(true);
        const token = localStorage.getItem('token');

        pollingRef.current = setInterval(async () => {
            try {
                const res = await fetch(`${API_URL}/api/generation/status/${requestId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!res.ok) {
                    console.warn('Polling status não OK', res.status);
                    return;
                }

                const data = await res.json();

                if (data.status === 2) {
                    let parsed = data.resultado;
                    if (typeof parsed === 'string') {
                        try { parsed = JSON.parse(parsed); } catch { }
                    }

                    const resumoTexto =
                        parsed?.TextoGerado ||
                        parsed?.texto ||
                        parsed?.ResumoTexto ||
                        (typeof parsed === 'string' ? parsed : null) ||
                        null;

                    const resumoId = data.resumoId || parsed?.id || parsed?.Id || requestId;

                    if (isMountedRef.current) {
                        if (resumoTexto) {
                            setResumoGerado({ texto: resumoTexto, id: resumoId });
                        }
                        setIsGeneratingSummary(false);
                        setActiveRequestId(null);
                    }

                    clearInterval(pollingRef.current);
                    pollingRef.current = null;
                } else if (data.status === 3) {
                    if (isMountedRef.current) {
                        setIsGeneratingSummary(false);
                        setActiveRequestId(null);
                    }
                    clearInterval(pollingRef.current);
                    pollingRef.current = null;
                } else {
                    // status em andamento — opcionalmente lidar com progresso parcial
                }
            } catch (err) {
                console.error('Erro no polling do contexto:', err);
                clearInterval(pollingRef.current);
                pollingRef.current = null;
                if (isMountedRef.current) setIsGeneratingSummary(false);
            }
        }, 2500);
    };

    const stopGenerationPolling = () => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
        setActiveRequestId(null);
        setIsGeneratingSummary(false);
    };

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        };
    }, []);

    const value = {
        resumoGerado,
        setResumoGerado,
        simuladoGerado,
        setSimuladoGerado,
        quiz,
        setQuiz,
        isGeneratingSummary,
        setIsGeneratingSummary,
        isGeneratingQuiz,
        setIsGeneratingQuiz,
        completedTypewriters,
        markTypewriterAsCompleted,
        isTypewriterCompleted,
        clearCompletedTypewriters,
        activeRequestId,
        startGenerationPolling,
        stopGenerationPolling,
        chats,
        setChats,
        chatAtivo,
        setChatAtivo,
        criarNovoChat,
        adicionarMensagem,
        deletarChat
    };

    return (
        <StudyContext.Provider value={value}>
            {children}
        </StudyContext.Provider>
    );
}

export const useStudy = () => {
    const context = useContext(StudyContext);
    if (context === undefined) {
        throw new Error('useStudy must be used within a StudyProvider');
    }
    return context;
};
// ...existing code...