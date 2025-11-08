import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, NavLink } from 'react-router-dom'; // Para a função de logout
import { toast } from "react-toastify";
import { API_URL } from '../../../config';
import ReactMarkdown from 'react-markdown';

import {
  BookOpen,
  FileText,
  Target,
  User,
  FileUp,
  Gift,
  CheckCircle2,
  XCircle,
  Sparkles,
  Clock,
  Plus,
  Send,
  MoveUp,
  Paperclip,
  X
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';

import './Dashboard.scss';

// Componente de destaque dos resumos
const ParagraphWithHighlights = ({ children, ...props }) => {
  const highlightKeywords = (text) => {
    if (typeof text !== 'string') return text;

    // Lista de palavras-chave comuns em resumos
    const keywords = [
      'conceito', 'definição', 'princípio', 'teoria', 'fundamento', 'base',
      'objetivo', 'finalidade', 'propósito', 'meta',
      'característica', 'atributo', 'propriedade', 'qualidade',
      'vantagem', 'benefício', 'vantagens', 'benefícios',
      'desvantagem', 'limitação', 'desvantagens', 'limitações',
      'importante', 'essencial', 'crucial', 'fundamental', 'significativo',
      'principal', 'primordial', 'básico', 'central',
      'diferente', 'distinto', 'específico', 'particular',
      'exemplo', 'caso', 'instância', 'ilustração',
      'portanto', 'consequentemente', 'assim', 'dessa forma',
      'entretanto', 'contudo', 'porém', 'no entanto',
      'além disso', 'adicionalmente', 'também', 'igualmente',
      'análise', 'síntese', 'resumo', 'conclusão',
      'método', 'metodologia', 'processo', 'procedimento',
      'resultado', 'achado', 'descoberta', 'conclusão'
    ];

    // Cores para os destaques
    const colors = [
      'rgba(255, 200, 200, 0.3)',
      'rgba(255, 235, 150, 0.4)',
      'rgba(200, 230, 255, 0.4)',
      'rgba(200, 255, 220, 0.4)',
      'rgba(230, 210, 255, 0.4)',
      'rgba(255, 220, 200, 0.4)',
    ];

    // Divide o texto em palavras
    const words = text.split(/(\s+)/);

    return words.map((word, index) => {
      const cleanWord = word.toLowerCase().replace(/[.,!?;:()\[\]{}]/g, '');

      if (keywords.includes(cleanWord) && cleanWord.length > 3) {
        const colorIndex = Math.abs(cleanWord.split('').reduce((a, b) => {
          return a + b.charCodeAt(0);
        }, 0)) % colors.length;

        return (
          <span
            key={index}
            className="keyword-highlight"
            style={{
              backgroundColor: colors[colorIndex],
              padding: '0.1rem 0.3rem',
              borderRadius: '4px',
              margin: '0 0.1rem',
              borderBottom: `2px solid ${colors[colorIndex].replace('0.4', '0.8')}`,
            }}
          >
            {word}
          </span>
        );
      }

      return word;
    });
  };

  // CORREÇÃO: Processa children sem usar React.Children
  const processChildren = (children) => {
    if (typeof children === 'string') {
      return highlightKeywords(children);
    }

    if (Array.isArray(children)) {
      return children.map((child, index) => (
        <span key={index}>{processChildren(child)}</span>
      ));
    }

    return children;
  };

  return <p {...props}>{processChildren(children)}</p>;
};

function Dashboard() {
  const {
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
  } = useStudy();

  // --- ESTADOS DO COMPONENTE ---
  const [activeRequestId, setActiveRequestId] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [content, setContent] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [userName, setUserName] = useState('');
  const [score, setScore] = useState(null);
  const navigate = useNavigate();
  const quizContainerRef = useRef(null);
  const [resumoId, setResumoId] = useState(null)
  const [isResumoDeArquivo, setIsResumoDeArquivo] = useState(false);
  const hasGeneratedFromLocalStorage = useRef(false);
  const [showPointsText, setShowPointsText] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState("Resumo");
  const [typingComplete, setTypingComplete] = useState(false);
  // refs para controlar intervalos e montagem
  const placeholderIntervalRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const messageIntervalRef = useRef(null);
  const isMountedRef = useRef(true);
  const currentToastIdRef = useRef(null);
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [displayText, setDisplayText] = useState('');
  const previousResumo = useRef('');

  useEffect(() => {
    // marca componente montado
    isMountedRef.current = true;
    return () => {
      // cleanup ao desmontar ou HMR
      isMountedRef.current = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (messageIntervalRef.current) {
        clearInterval(messageIntervalRef.current);
        messageIntervalRef.current = null;
      }
    };
  }, []);

  const inspiringPlaceholders = [
    "Resuma seu texto para estudar melhor...",
    "Estude uma matéria complexa de forma simples...",
    "Aprenda de uma vez por todas com resumos inteligentes...",
    "Transforme conteúdo difícil em aprendizado fácil...",
    "Digite qualquer tópico e ganhe um resumo personalizado...",
    "Cole um texto longo e veja ele se transformar em resumo...",
    "Estude de forma mais eficiente com IA...",
    "Conquiste seus objetivos de aprendizado...",
    "Simplifique matérias complexas em minutos...",
    "O poder do resumo inteligente na palma da sua mão..."
  ];

  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [typedPlaceholder, setTypedPlaceholder] = useState("");

  // Efeito do placeholder com cleanup adequado
  useEffect(() => {
    let charIndex = 0;
    let forward = true;

    const type = () => {
      const currentText = inspiringPlaceholders[placeholderIndex];

      if (forward) {
        setTypedPlaceholder(currentText.slice(0, charIndex));
        charIndex++;
        if (charIndex > currentText.length) {
          forward = false;
          placeholderIntervalRef.current = setTimeout(type, 1500);
          return;
        }
      } else {
        setTypedPlaceholder(currentText.slice(0, charIndex));
        charIndex--;
        if (charIndex < 0) {
          forward = true;
          setPlaceholderIndex((prev) => (prev + 1) % inspiringPlaceholders.length);
          charIndex = 0; // Reset para próxima frase
        }
      }

      placeholderIntervalRef.current = setTimeout(type, 100);
    };

    type();

    return () => {
      if (placeholderIntervalRef.current) {
        clearTimeout(placeholderIntervalRef.current);
      }
    };
  }, [placeholderIndex]);

  useEffect(() => {
    const savedText = localStorage.getItem('resumoDigitacao');
    const savedIndex = localStorage.getItem('resumoIndex');

    if (savedText) {
      setDisplayText(savedText);
    }

    // Se quiser reiniciar o typing quando o texto acabar, limpe o storage aqui
    if (savedIndex && resumoGerado) {
      const texto = typeof resumoGerado === 'string' ? resumoGerado : resumoGerado.texto;
      const i = parseInt(savedIndex, 10);

      if (i < texto.length) {
        let currentIndex = i;
        const timer = setInterval(() => {
          if (currentIndex < texto.length) {
            const newText = texto.substring(0, currentIndex + 1);
            setDisplayText(newText);
            localStorage.setItem('resumoDigitacao', newText);
            localStorage.setItem('resumoIndex', currentIndex.toString());
            currentIndex++;
          } else {
            clearInterval(timer);
          }
        }, 15);

        return () => clearInterval(timer);
      }
    }
  }, [resumoGerado]);


  //Busca do nome do usuário com tratamento de erro
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

  // CORREÇÃO: Scroll para quiz com dependências corretas
  useEffect(() => {
    if (quiz.length > 0 && !isGeneratingQuiz) {
      setTimeout(() => {
        quizContainerRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  }, [quiz, isGeneratingQuiz]);

  useEffect(() => {
    if (resumoGerado) {
      setIsTyping(true);
      setTypedText('');

      // Garante que temos uma string
      const texto = typeof resumoGerado === 'string'
        ? resumoGerado
        : resumoGerado.texto || '';

      let i = 0;
      const timer = setInterval(() => {
        if (i < texto.length) {
          setTypedText(prev => prev + texto[i]);
          i++;
        } else {
          clearInterval(timer);
          setIsTyping(false);
        }
      }, 20); // Velocidade da digitação

      return () => clearInterval(timer);
    }
  }, [resumoGerado]);

  // Mantém sua lógica de envio
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadedFile(file);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token"); // ← ADICIONE ESTA LINHA
      const response = await fetch(`${API_URL}/api/Conteudo/resumo-file`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}` // ← ADICIONE ESTE HEADER
        },
        body: formData,
      });

      // VERIFICAÇÃO MELHORADA
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro na resposta:", errorText);
        throw new Error(`Erro no upload: ${response.status} - ${errorText}`);
      }

      // TENTA LER COMO JSON, SE FALHAR, LÊ COMO TEXTO
      let resumo;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        resumo = await response.json();
      } else {
        const text = await response.text();
        console.warn("Resposta não é JSON:", text);
        // Se não for JSON, talvez seja só uma mensagem de sucesso
        resumo = { mensagem: text || "Upload realizado com sucesso" };
      }

      console.log("Upload bem-sucedido:", resumo);

    } catch (err) {
      console.error("Erro no upload:", err);
      toast.error("Erro ao fazer upload do arquivo. Tente novamente.");
    }
  };

  // Drag & Drop para UX
  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragOver(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    setUploadedFile(file); // Atualiza a UX
    handleFileUpload({ target: { files: [file] } });
  };

  function handleSelectTipo(tipo) {
    setSelectedTipo(tipo);
    setShowOptions(false); // fecha o menu
  }

  const handleSliderChange = (e) => { setNumQuestions(parseInt(e.target.value)); };

  const handleGenerateSummary = async (topicToGenerate, fileInput, text) => {
    const topic = topicToGenerate || content;
    const fileToSend = fileInput || uploadedFile;

    if (!topic && !fileToSend) {
      toast.info("Digite um tópico ou envie um arquivo para gerar o resumo!");
      return;
    }

    // Reset e flags iniciais
    if (isMountedRef?.current) {
      setIsGeneratingSummary(true);
      setResumoGerado(null);
      setQuiz([]);
      setScore(null);
    }

    const loadingMessages = [
      "Analisando a matéria...",
      "Estruturando os pontos-chave...",
      "Construindo seu resumo inteligente...",
      "Revisando e refinando o texto...",
      "Quase pronto!"
    ];

    let messageIndex = 0;

    // Mantém as funções aqui dentro onde são usadas
    const startMessageInterval = (messages) => {
      if (messageIntervalRef.current) {
        clearInterval(messageIntervalRef.current);
        messageIntervalRef.current = null;
      }
      messageIndex = 0;
      if (isMountedRef.current) setLoadingMessage(messages[messageIndex]);
      messageIntervalRef.current = setInterval(() => {
        messageIndex = (messageIndex + 1) % messages.length;
        if (isMountedRef.current) setLoadingMessage(messages[messageIndex]);
      }, 3000);
    };

    const stopAllIntervals = () => {
      if (messageIntervalRef.current) {
        clearInterval(messageIntervalRef.current);
        messageIntervalRef.current = null;
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };

    const safeToast = (type, msg) => {
      try {
        if (!currentToastIdRef.current || !toast.isActive(currentToastIdRef.current)) {
          currentToastIdRef.current = toast[type](msg);
        }
      } catch {
        toast[type](msg);
      }
    };

    startMessageInterval(loadingMessages);

    try {
      const token = localStorage.getItem("token");

      // === FLUXO DE ARQUIVO ===
      if (fileToSend) {
        if (isMountedRef.current) setIsResumoDeArquivo(true);
        startMessageInterval(["Processando arquivo...", "Extraindo conteúdo...", "Gerando resumo..."]);

        const formData = new FormData();
        formData.append("file", fileToSend);

        const fileRes = await fetch(`${API_URL}/api/Conteudo/resumo-file`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });

        if (!fileRes.ok) {
          const errText = await fileRes.text();
          throw new Error(errText || "Erro ao processar arquivo");
        }

        const data = await fileRes.json();

        // Busca o resumo final (por id)
        const resumoRes = await fetch(`${API_URL}/api/Conteudo/por-id/${data.resumoId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!resumoRes.ok) {
          const errText = await resumoRes.text();
          throw new Error(errText || "Erro ao buscar resumo gerado");
        }

        const resumoData = await resumoRes.json();

        const textoResumo = resumoData.ResumoTexto || data.resumo || "";
        const resumoIdFinal = data.resumoId || resumoData.Id || resumoData.id || null;

        if (isMountedRef.current) {
          setResumoGerado({ texto: textoResumo, id: resumoIdFinal });
          if (resumoIdFinal) setResumoId(resumoIdFinal);
        }

        stopAllIntervals();
        if (isMountedRef.current) setIsGeneratingSummary(false);
        safeToast("success", "Resumo gerado a partir do arquivo!");
        return;
      }

      // === FLUXO DE TEXTO ===
      if (isMountedRef.current) setIsResumoDeArquivo(false);
      startMessageInterval(loadingMessages);

      const res = await fetch(`${API_URL}/api/Conteudo/gerar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          Topico: topic,
          Tipo: text || selectedTipo
        })
      });

      if (!res.ok) {
        let errorMessage = "Erro ao gerar resposta.";
        let errorBody;

        try {
          // Guarda o texto em uma variável antes de tentar parsear
          errorBody = await res.text();
          // Tenta parsear como JSON
          const data = JSON.parse(errorBody);
          errorMessage = data.mensagem || errorMessage;
          if (data.sugestao) safeToast("info", data.sugestao);
        } catch {
          // Se não for JSON válido, usa o texto puro
          errorMessage = errorBody || errorMessage;
        } finally {
          stopAllIntervals();
          if (isMountedRef.current) setIsGeneratingSummary(false);
          safeToast("error", errorMessage);
        }
        return;
      }

      const { requestId, resumoId: resumoIdBackend } = await res.json();
      if (isMountedRef.current) setActiveRequestId(requestId);

      // certifica-se de limpar poll anterior
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }

      // === POLLING DO STATUS ===
      pollIntervalRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`${API_URL}/api/generation/status/${requestId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (!statusRes.ok) {
            // se status endpoint temporariamente falhar, não encerra imediatamente; log para debug
            console.warn("Status check falhou:", statusRes.status);
            return;
          }

          const statusData = await statusRes.json();
          console.log("Status do polling:", statusData);

          if (statusData.status === 2) {
            // sucesso
            stopAllIntervals();
            if (!isMountedRef.current) return;
            if (isMountedRef.current) setIsGeneratingSummary(false);
            if (isMountedRef.current) setActiveRequestId(null);

            let parsedResultado = statusData.resultado;
            if (typeof parsedResultado === "string") {
              try {
                parsedResultado = JSON.parse(parsedResultado);
              } catch {
                parsedResultado = { texto: parsedResultado };
              }
            }

            const resumoFinalId =
              statusData.resumoId ||
              parsedResultado?.id ||
              parsedResultado?.Id ||
              resumoIdBackend ||
              requestId;

            const resumoTexto =
              parsedResultado?.TextoGerado ||
              parsedResultado?.texto ||
              parsedResultado?.ResumoTexto ||
              "Houve algum problema com a IA";

            if (isMountedRef.current) {
              setResumoGerado({ texto: resumoTexto, id: resumoFinalId });
              if (resumoFinalId) setResumoId(resumoFinalId);
            }

            safeToast("success", "Resumo gerado com sucesso!");
          } else if (statusData.status === 3) {
            // erro no processamento
            stopAllIntervals();
            if (!isMountedRef.current) return;
            if (isMountedRef.current) {
              setIsGeneratingSummary(false);
              setActiveRequestId(null);
            }
            const msg = statusData.mensagemErro || "Erro ao gerar resumo";
            safeToast("error", `Erro ao gerar resumo: ${msg}`);
          }
        } catch (pollError) {
          console.error("Erro durante o polling:", pollError);
          stopAllIntervals();
          if (isMountedRef.current) setIsGeneratingSummary(false);
          safeToast("error", "Erro durante o processamento");
        }
      }, 2500); // polling mais reativo
    } catch (err) {
      console.error(err);
      stopAllIntervals();
      if (isMountedRef.current) setIsGeneratingSummary(false);
      safeToast("error", "Erro: " + (err.message || err));
    }
  };

  useEffect(() => {
    return () => {
      clearInterval(messageIntervalRef.current);
      clearInterval(pollIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    const topicoFromLocalStorage = localStorage.getItem('topicoInicial');
    if (!topicoFromLocalStorage || hasGeneratedFromLocalStorage.current) return;

    hasGeneratedFromLocalStorage.current = true;
    const gerarResumo = async () => {
      setContent(topicoFromLocalStorage);
      await handleGenerateSummary(topicoFromLocalStorage);
      localStorage.removeItem('topicoInicial');
    };

    gerarResumo();
  }, []);


  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/Profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUserName(data.nome);
        }
      } catch (error) {
        // //console.error("Falha ao buscar nome do usuário", error);
      }
    };

    fetchUserName();
  }, []); // <-- vazio: roda apenas uma vez


  // --- FUNÇÕES DO QUIZ ---
  // Em src/pages/Dashboard/Dashboard.jsx
  const parseQuestoesJson = (jsonString) => {
    if (!jsonString) return [];
    // Remove possíveis ```json e ``` que o backend pode ter incluído
    let cleaned = jsonString.replace(/```json/g, "").replace(/```/g, "").trim();
    // Escapa backslashes para evitar erros de parsing em LaTeX
    cleaned = cleaned.replace(/\\/g, '\\\\');
    try {
      return JSON.parse(cleaned);
    } catch (err) {
      //console.error("Erro ao parsear JSON das questões:", err, jsonString);
      // Tenta limpar caracteres de escape problemáticos (ex: aspas não escapadas)
      try {
        const fixed = cleaned.replace(/([^\\])"([^"]*)"([^,}\]]*)/g, '$1"$2\\"$3'); // Exemplo simples, pode precisar ajuste
        return JSON.parse(fixed);
      } catch (fixErr) {
        //console.error("Falha ao corrigir JSON:", fixErr);
        return [];
      }
    }
  };

  const handleGenerateQuiz = async () => {
    if (!resumoGerado) {
      toast.info('Você precisa gerar um resumo primeiro!');
      return;
    }

    console.log("🚀 Iniciando geração de simulado...");

    setIsGeneratingQuiz(true);
    setQuiz([]);
    setUserAnswers({});
    setScore(null);
    setSimuladoGerado(null);

    try {
      const token = localStorage.getItem("token");
      let res, data;

      // --- FLUXO DE ARQUIVO (direto) ---
      if (isResumoDeArquivo) {
        // console.log("📂 Modo arquivo — enviando requisição direta para gerar simulado...");
        // console.log("ResumoId:", resumoGerado.id || resumoGerado.Id);
        // console.log("Número de questões:", numQuestions);

        res = await fetch(`${API_URL}/api/Simulado/gerar-direto`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            resumoId: Number(resumoGerado.id || resumoGerado.Id),
            numeroDeQuestoes: numQuestions
          })
        });

        console.log("📨 Resposta recebida do backend (gerar-direto):", res.status);

        data = await res.json().catch(() => ({}));
        console.log("📦 Dados retornados:", data);

        if (!res.ok) {
          console.error("❌ Erro do backend:", data.mensagem);
          toast.error(data.mensagem || "Ocorreu um erro ao gerar o resumo");
          return;
        }

        let questoesJson = data.QuestoesJson || data.questoesJson;
        if (!questoesJson) throw new Error("Questões do simulado estão vazias");

        const questoesArray = parseQuestoesJson(questoesJson);

        if (!Array.isArray(questoesArray)) throw new Error("Formato inválido de questões");

        setQuiz(questoesArray);
        setSimuladoGerado(data);
        toast.success("Simulado gerado com sucesso!");
        setIsGeneratingQuiz(false);
        return;
      }

      // --- FLUXO DE TEXTO (com fila) ---
      // console.log("🧾 Modo texto — enviando simulado para fila...");
      // console.log("ResumoId:", resumoGerado?.id || resumoGerado?.Id);
      // console.log("Número de questões:", numQuestions);

      const response = await fetch(`${API_URL}/api/Simulado/gerar`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          conteudoId: resumoGerado?.id || resumoGerado?.Id,
          numeroDeQuestoes: numQuestions
        })
      });

      // console.log("📨 Resposta recebida (gerar):", response.status);

      if (!response.ok) {
        const text = await response.text();
        console.error("❌ Erro ao enviar simulado:", text);
        throw new Error(text);
      }

      const { requestId } = await response.json();
      console.log("🧩 Simulado enviado para fila. Request ID:", requestId);

      // --- POLLING ---
      console.log("🔁 Iniciando polling para verificar status da geração...");

      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`${API_URL}/api/generation/status/${requestId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          console.log("📬 Verificando status:", statusRes.status);


          if (!statusRes.ok) {
            console.warn("⚠️ Status não OK no polling");
            return;
          }

          const statusData = await statusRes.json();
          console.log("📊 Dados do status:", statusData);

          if (statusData.status === 2) {
            clearInterval(pollInterval);
            if (!statusData.resultado) throw new Error("Simulado gerado mas resultado vazio");
            console.log("✅ Simulado gerado com sucesso. Processando resultado...");

            if (!statusData.resultado) throw new Error("Resultado vazio");

            let resultadoParsed = statusData.resultado;
            if (typeof resultadoParsed === "string") {
              try {
                resultadoParsed = JSON.parse(resultadoParsed);
              } catch (err) {
                console.warn("⚠️ Resultado não era JSON válido:", resultadoParsed);
                // Se for string com array JSON, tenta extrair array:
                try {
                  resultadoParsed = JSON.parse(resultadoParsed.trim());
                } catch {
                  // fallback: mantém como string
                }
              }
            }

            const questoesArray =
              resultadoParsed?.QuestoesJson ||
              resultadoParsed?.questoesJson ||
              resultadoParsed?.questoes ||
              (Array.isArray(resultadoParsed) ? resultadoParsed : null);

            if (!questoesArray) throw new Error("Questões ausentes no resultado");

            let simuladoId = null;
            let parsedOutputMetadata = null;

            // 1) tenta extrair outputMetadata vindo no statusData (forma mais confiável)
            if (statusData.outputMetadata) {
              try {
                parsedOutputMetadata = typeof statusData.outputMetadata === "string"
                  ? JSON.parse(statusData.outputMetadata)
                  : statusData.outputMetadata;
                simuladoId = parsedOutputMetadata?.SimuladoId ?? parsedOutputMetadata?.simuladoId ?? null;
              } catch (e) {
                console.warn("Não foi possível parsear statusData.outputMetadata", e);
              }
            }

            // 2) se não encontrou, tenta olhar dentro do resultado retornado (alguns fluxos gravam metadata ali)
            if (!simuladoId && resultadoParsed) {
              const possibleMeta = resultadoParsed.outputMetadata ?? resultadoParsed.metadata ?? resultadoParsed.OutputMetadata;
              if (possibleMeta) {
                try {
                  const pm = typeof possibleMeta === "string" ? JSON.parse(possibleMeta) : possibleMeta;
                  simuladoId = pm?.SimuladoId ?? pm?.simuladoId ?? simuladoId;
                  if (!parsedOutputMetadata) parsedOutputMetadata = pm;
                } catch (e) {
                  // ignore
                }
              }

              // também tenta campos diretos no resultado (algumas implementações usam SimuladoId direto)
              simuladoId = simuladoId || resultadoParsed.SimuladoId || resultadoParsed.simuladoId || null;
            }

            // 3) fallback final: se houver um campo específico statusData.simuladoId use ele,
            // mas NUNCA trate statusData.id como SimuladoId (requestId)
            simuladoId = simuladoId || statusData.simuladoId || null;

            // Prepara um objeto consistente para simuladoGerado
            const novoSimulado = {
              outputMetadata: parsedOutputMetadata
                ? JSON.stringify(parsedOutputMetadata)
                : JSON.stringify({
                  SimuladoId: simuladoId || null,
                  RequestId: requestId || null
                }),
              id: simuladoId || null,
              rawResult: resultadoParsed
            };

            console.log("🔎 simuladoId determinado:", simuladoId, "parsedOutputMetadata:", parsedOutputMetadata);
            setQuiz(Array.isArray(questoesArray) ? questoesArray : []);
            setSimuladoGerado(novoSimulado);
            toast.success("Simulado gerado com sucesso!");
            setIsGeneratingQuiz(false);

          } else if (statusData.status === 3) {
            clearInterval(pollInterval);
            console.error("❌ Erro ao gerar simulado:", statusData.mensagemErro);
            toast.error(`Erro ao gerar simulado: ${statusData.mensagemErro}`);
            setIsGeneratingQuiz(false);
          } else {
            console.log("⏳ Status ainda em andamento...");
          }
        } catch (pollError) {
          console.error("🚨 Erro durante o polling:", pollError);
          clearInterval(pollInterval);
          setIsGeneratingQuiz(false);
        }
      }, 5000);

    } catch (err) {
      console.error("🔥 Erro geral no handleGenerateQuiz:", err);
      toast.error('Erro: ' + err.message);
      setIsGeneratingQuiz(false);
    }
  };

  const handleSubmitQuiz = async () => {
    const metadata = simuladoGerado.outputMetadata
      ? JSON.parse(simuladoGerado.outputMetadata)
      : null;

    // ✅ Garante que existe algum identificador
    const simuladoId = metadata?.SimuladoId;
    const requestId = metadata?.RequestId;

    // console.log("🧩 simuladoGerado recebido:", simuladoGerado);

    if (!simuladoId && !requestId) {
      alert("Nenhum identificador de simulado encontrado (nem id nem requestId).");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      // 🔹 Se houver ID direto do simulado (gerado ou vindo do backend)
      if (simuladoId) {
        // CORRIGIDO: rota singular "simulado" (controller SimuladoController)
        console.log('Simulado para finalizar', simuladoId)
        const res = await fetch(`${API_URL}/api/Simulado/${simuladoId}/finalizar`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(userAnswers)
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Falha ao finalizar o simulado: ${errorText}`);
        }

        const resultado = await res.json();
        const finalScore = (resultado.acertos / resultado.totalQuestoes) * 100;
        setScore(finalScore);
        toast.success("Simulado finalizado com sucesso!");
        return;
      }

      // 🔹 Se ainda não tem ID, tenta buscar pelo requestId
      if (requestId) {
        //console.log("⏳ Buscando simulado criado a partir do request ID:", requestId);
        const resBusca = await fetch(`${API_URL}/api/Simulado/por-request/${requestId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!resBusca.ok) throw new Error("Não foi possível localizar o simulado gerado.");

        const simulado = await resBusca.json();

        if (!simulado?.id) throw new Error("Simulado retornado não contém ID.");

        //console.log("🎯 Simulado encontrado:", simulado.id);

        const resFinalizar = await fetch(`${API_URL}/api/Simulado/${simulado.id}/finalizar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(userAnswers)
        });

        if (!resFinalizar.ok) {
          const errorText = await resFinalizar.text();
          throw new Error(`Falha ao finalizar o simulado: ${errorText}`);
        }

        const resultado = await resFinalizar.json();
        const finalScore = (resultado.acertos / resultado.totalQuestoes) * 100;
        setScore(finalScore);
        toast.success("Simulado finalizado com sucesso!");
      }

    } catch (error) {
      //console.error("❌ Erro ao finalizar o simulado:", error);
      toast.error(error.message);
    }
  };



  const handleAnswerChange = (questionIndex, answer) => {
    setUserAnswers(prevAnswers => ({ ...prevAnswers, [questionIndex]: answer }));
  };
  // --- FUNÇÃO DE LOGOUT ---
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // --- RENDERIZAÇÃO DO COMPONENTE ---
  return (
    <div className="dashboard">
      <div className="main-content">
        <header className="profile-header-container">
          <div className="profile-header-text">
            <h1 className="profile-header-title">
              Olá, <span className="profile-header-name">{userName || "Estudante"}</span>!
              <Sparkles className="profile-header-icon" />
            </h1>
            <p className="profile-header-subtitle">
              Pronto para começar uma nova sessão de estudos?
            </p>
          </div>
        </header>

        <div className="card">
          <div className="card-content">
            <div className="content-space">
              <div className="unified-search-bar">
                {/* BOTÃO + OPCÕES */}
                <div className="options-dropdown">
                  <button className="options-btn" onClick={() => setShowOptions(!showOptions)} title="Escolher tipo">
                    <Plus size={20} />
                  </button>

                  {showOptions && (
                    <div className="options-menu modern-menu">
                      <div className="menu-header">
                        <span className="menu-title">Escolha o formato</span>
                        <div className="menu-subtitle">Como você quer estudar?</div>
                      </div>

                      <div className="menu-items">
                        <div
                          className="menu-item"
                          onClick={() => handleSelectTipo("Resumo")}
                        >
                          <div className="item-icon">📝</div>
                          <div className="item-content">
                            <span className="item-title">Resumo</span>
                            <span className="item-description">Resumo estruturado do conteúdo</span>
                          </div>
                        </div>

                        <div
                          className="menu-item"
                          onClick={() => handleSelectTipo("PerguntaDireta")}
                        >
                          <div className="item-icon">❓</div>
                          <div className="item-content">
                            <span className="item-title">Pergunta Direta</span>
                            <span className="item-description">Resposta objetiva para dúvidas</span>
                          </div>
                        </div>

                        <div
                          className="menu-item"
                          onClick={() => handleSelectTipo("PesquisaCientifica")}
                        >
                          <div className="item-icon">🔬</div>
                          <div className="item-content">
                            <span className="item-title">Pesquisa Científica</span>
                            <span className="item-description">Análise detalhada e referências</span>
                          </div>
                        </div>

                        <div
                          className="menu-item"
                          onClick={() => handleSelectTipo("EstudarParaProva")}
                        >
                          <div className="item-icon">📚</div>
                          <div className="item-content">
                            <span className="item-title">Estudar Para Prova</span>
                            <span className="item-description">Foco em revisão e exercícios</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* CONTAINER DO INPUT (deve ter position: relative) */}
                <div className={`search-input-container ${isDragOver ? 'drag-over' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}>

                  <input
                    type="text"
                    className="unified-search-input"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={typedPlaceholder}
                    onKeyPress={(e) => e.key === 'Enter' && handleGenerateSummary(null, uploadedFile, selectedTipo)}
                  />

                  {uploadedFile && (
                    <div className="file-indicator">
                      <FileText size={14} />
                      <span>{uploadedFile.name}</span>
                      <button onClick={() => setUploadedFile(null)} className="remove-file-btn">
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  {/* ✅ BADGE DENTRO DO CONTAINER DO INPUT (AQUI ESTÁ CORRETO) */}
                  {selectedTipo && (
                    <div className="selected-option-indicator">
                      <div className="badge-content">
                        <div className="badge-dot"></div>
                        <span className="selected-option-text">{selectedTipo}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* BOTÕES DO LADO DIREITO */}
                <div className="search-actions-right">
                  {/* BOTÃO ANEXAR ARQUIVO */}
                  <button className="options-resumo-btn" onClick={() => document.getElementById('file-upload').click()} title="Anexar arquivo">
                    <Paperclip size={20} />
                  </button>

                  {/* BOTÃO ENVIAR */}
                  <button
                    className="btn-enviar-resumo"
                    onClick={() => handleGenerateSummary(null, uploadedFile, selectedTipo)}
                    disabled={isGeneratingSummary || (!content && !uploadedFile)}>

                    {isGeneratingSummary ? (
                      <div className="loading-spinner-mini"></div>
                    ) : (
                      <MoveUp size={20} />
                    )}
                  </button>
                </div>


                <input type="file" id="file-upload" accept=".pdf,.doc,.docx" onChange={handleFileUpload} className="file-input-hidden" />
              </div>

              {/* ÁREA DE RESULTADOS */}
              <div className="result-section">
                {isGeneratingSummary ? (
                  <div className="professional-loader">
                    <div className="loader-header">
                      <div className="loader-icon">
                        <div className="spinner"></div>
                        <FileText className="file-icon" size={24} />
                      </div>
                      <div className="loader-text">
                        <h3>Estamos trabalhando na sua resposta</h3>
                        <p>{loadingMessage}</p>
                      </div>
                    </div>

                    <div className="progress-container">
                      <div className="progress-bar">
                        <div className="progress-fill"></div>
                      </div>
                      <span className="progress-text">Processando conteúdo...</span>
                    </div>

                    <div className="loader-features">
                      <div className="feature-item">
                        <div className="feature-icon">🔍</div>
                        <span>Analisando pontos-chave</span>
                      </div>
                      <div className="feature-item">
                        <div className="feature-icon">📝</div>
                        <span>Estruturando informações</span>
                      </div>
                      <div className="feature-item">
                        <div className="feature-icon">✨</div>
                        <span>Otimizando para estudo</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  resumoGerado && (
                    <div className="markdown-content">
                      <ReactMarkdown
                        components={{
                          p: ({ node, ...props }) => <ParagraphWithHighlights {...props} />,
                          h1: ({ node, ...props }) => <h1 className="markdown-heading" {...props} />,
                          h2: ({ node, ...props }) => <h2 className="markdown-heading" {...props} />,
                          h3: ({ node, ...props }) => <h3 className="markdown-heading" {...props} />,
                          ul: ({ node, ...props }) => <ul className="markdown-list" {...props} />,
                          ol: ({ node, ...props }) => <ol className="markdown-list" {...props} />,
                          li: ({ node, ...props }) => <li className="markdown-list-item" {...props} />,
                          strong: ({ node, ...props }) => <strong className="markdown-strong" {...props} />,
                          em: ({ node, ...props }) => <em className="markdown-emphasis" {...props} />,
                        }}
                      >
                        {typedText}
                      </ReactMarkdown>

                      {isTyping && <span className="typing-cursor"></span>}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Seção do Simulado */}
        <div className="card simulado-card">
          <div class="practice-header">
            <h2 class="practice-title">
              <span className="title-emoji">🚀</span>
              Hora de colocar conhecimento em ação!
            </h2>
            <p className='practice-text'>Vamos colocar em prática, tudo oque você viu no seu resumo</p>
          </div>

          <div className="card-header-gradient">
            <div className="header-icon-wrapper">
              <Target />
            </div>
            <div className="header-text-wrapper">
              <h2>Simulado Personalizado</h2>
              <p>Teste seus conhecimentos e ganhe pontos</p>
            </div>
          </div>

          {/* 2. Novo Corpo do Card */}
          <div className="card-content">
            <div className="content-space">

              {/* 3. Card Interno de Configuração */}
              <div className="config-card">
                <h4>Configurar Simulado</h4>
                <div className="slider-container">
                  <label className="slider-label">
                    <span>Número de questões</span>
                    <strong>{numQuestions}</strong>
                  </label>
                  <div className="slider-wrapper">
                    <input
                      type="range"
                      min="2"
                      max="20"
                      value={numQuestions}
                      onChange={handleSliderChange}
                      className="slider"
                    />
                    <div className="slider-labels">
                      <span>2</span>
                      <span>20</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                className="btn btn-primary btn-generate-quiz"
                onClick={handleGenerateQuiz}
                disabled={!resumoGerado || isGeneratingSummary}
              >
                <Target size={20} />
                <span>
                  {isGeneratingQuiz
                    ? "Gerando..."
                    : (quiz.length > 0 ? "Gerar Novo Simulado" : "Gerar Simulado")
                  }
                </span>
              </button>
              {/* 5. Dica sobre os Pontos */}


              <div ref={quizContainerRef}> {/* A REF É ANEXADA AQUI */}
                {isGeneratingQuiz ? (
                  // Placeholder de carregamento para o quiz
                  <div className="quiz-container">
                    {[...Array(numQuestions)].map((_, i) => (
                      <div key={i} className="question-card placeholder">
                        <div className="question-header">
                          <div className="question-number placeholder-glow"></div>
                          <div className="question-text placeholder-glow"></div>
                        </div>
                        <div className="options-list">
                          <div className="option-label placeholder-glow"></div>
                          <div className="option-label placeholder-glow"></div>
                          <div className="option-label placeholder-glow"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : quiz.length > 0 && (
                  // Quiz real
                  <div className="quiz-container">
                    {quiz.map((question, qIndex) => {
                      const isQuizFinished = score !== null;
                      const userAnswer = userAnswers[qIndex];
                      const correctAnswer = question.respostaCorreta;
                      return (
                        <div key={qIndex} className="question-card">
                          <div className="question-header">
                            <div className="question-number">{qIndex + 1}</div>
                            <h4 className="question-text">{question.pergunta}</h4>
                          </div>
                          <div className="options-list">
                            {question.alternativas.map((option, oIndex) => {
                              let optionClassName = 'option-label';
                              if (isQuizFinished) {
                                if (option === correctAnswer) optionClassName += ' correct';
                                else if (option === userAnswer) optionClassName += ' incorrect';
                              }
                              return (
                                <label key={oIndex} className={optionClassName}>
                                  <input type="radio" name={`question-${qIndex}`} value={option} checked={userAnswer === option} onChange={() => handleAnswerChange(qIndex, option)} disabled={isQuizFinished} />
                                  <span className="option-text">{option}</span>
                                  {isQuizFinished && option === correctAnswer && <CheckCircle2 className="feedback-icon correct-icon" />}
                                  {isQuizFinished && option !== correctAnswer && option === userAnswer && <XCircle className="feedback-icon incorrect-icon" />}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    {score === null && (<button className="btn-submit-quiz" onClick={handleSubmitQuiz}>Finalizar e Corrigir</button>)}
                  </div>
                )}
              </div>

              {/* --- CARD DE RESULTADO FINAL --- */}
              {score !== null && (
                <div className="final-result-card">
                  <div className="result-header">
                    <div className="result-icon">🏆</div>
                    <h3>Simulado Concluído!</h3>
                    <p>Confira seu desempenho abaixo</p>
                  </div>
                  <div className="result-stats">
                    <div className="stat-item">
                      <span className="stat-label">APROVEITAMENTO</span>
                      <span className="stat-value blue">{score.toFixed(0)}%</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">ACERTOS</span>
                      <span className="stat-value green">{(score / 100 * quiz.length).toFixed(0)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">ERROS</span>
                      <span className="stat-value red">{((100 - score) / 100 * quiz.length).toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
