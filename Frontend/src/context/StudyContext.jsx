import { createContext, useState, useContext, useRef, useEffect } from 'react';
import { API_URL } from '../../config';

const StudyContext = createContext();

export function StudyProvider({ children }) {
  const [resumoGerado, setResumoGeradoState] = useState(null);
  const [resumoArquivoGerado, setResumoArquivoGeradoState] = useState(null); // 👈 novo estado

  const [simuladoGerado, setSimuladoGeradoState] = useState(null);
  const [quiz, setQuiz] = useState([]);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  const [activeRequestId, setActiveRequestId] = useState(null);
  const pollingRef = useRef(null);
  const isMountedRef = useRef(true);

  // === CONTROLE TYPEWRITER ===
  const [completedTypewriters, setCompletedTypewriters] = useState(new Set());
  const markTypewriterAsCompleted = (resumoId) => {
    setCompletedTypewriters((prev) => new Set(prev).add(resumoId));
  };
  const isTypewriterCompleted = (resumoId) => completedTypewriters.has(resumoId);
  const clearCompletedTypewriters = () => setCompletedTypewriters(new Set());

  // === PERSISTÊNCIA LOCAL ===
  useEffect(() => {
    const storedResumo = localStorage.getItem('resumoGerado');
    const storedResumoArquivo = localStorage.getItem('resumoArquivoGerado');
    const storedSimulado = localStorage.getItem('simuladoGerado');

    if (storedResumo) {
      try {
        setResumoGeradoState(JSON.parse(storedResumo));
      } catch {
        localStorage.removeItem('resumoGerado');
      }
    }

    if (storedResumoArquivo) {
      try {
        setResumoArquivoGeradoState(JSON.parse(storedResumoArquivo));
      } catch {
        localStorage.removeItem('resumoArquivoGerado');
      }
    }

    if (storedSimulado) {
      try {
        setSimuladoGeradoState(JSON.parse(storedSimulado));
      } catch {
        localStorage.removeItem('simuladoGerado');
      }
    }
  }, []);

  useEffect(() => {
    if (resumoGerado)
      localStorage.setItem('resumoGerado', JSON.stringify(resumoGerado));
  }, [resumoGerado]);

  useEffect(() => {
    if (resumoArquivoGerado)
      localStorage.setItem('resumoArquivoGerado', JSON.stringify(resumoArquivoGerado));
  }, [resumoArquivoGerado]);

  useEffect(() => {
    if (simuladoGerado)
      localStorage.setItem('simuladoGerado', JSON.stringify(simuladoGerado));
  }, [simuladoGerado]);

  // === SETTERS ENCAPSULADOS ===
  const setResumoGerado = (value) => {
    setResumoGeradoState(value);
    if (value) localStorage.setItem('resumoGerado', JSON.stringify(value));
    else localStorage.removeItem('resumoGerado');
  };

  const setResumoArquivoGerado = (value) => {
    setResumoArquivoGeradoState(value);
    if (value) localStorage.setItem('resumoArquivoGerado', JSON.stringify(value));
    else localStorage.removeItem('resumoArquivoGerado');
  };

  const setSimuladoGerado = (value) => {
    setSimuladoGeradoState(value);
    if (value) localStorage.setItem('simuladoGerado', JSON.stringify(value));
    else localStorage.removeItem('simuladoGerado');
  };

  // === POLLING (mantém o seu atual) ===
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
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          console.warn('Polling status não OK', res.status);
          return;
        }

        const data = await res.json();

        if (data.status === 2) {
          let parsed = data.resultado;
          if (typeof parsed === 'string') {
            try {
              parsed = JSON.parse(parsed);
            } catch {}
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
              setResumoArquivoGerado(null); // 👈 evita conflito
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

  // === EXPORTA TUDO ===
  const value = {
    resumoGerado,
    setResumoGerado,
    resumoArquivoGerado,
    setResumoArquivoGerado,
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
