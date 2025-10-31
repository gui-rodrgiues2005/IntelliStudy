import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, NavLink } from 'react-router-dom'; // Para a função de logout
import ReactMarkdown from 'react-markdown';
import { toast } from "react-toastify";
import { API_URL } from '../../../config';

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

  useEffect(() => {
    let charIndex = 0;
    let forward = true; // controla digitar/apagar
    let timeout;

    const type = () => {
      const currentText = inspiringPlaceholders[placeholderIndex];

      if (forward) {
        // Digita letra por letra
        setTypedPlaceholder(currentText.slice(0, charIndex));
        charIndex++;
        if (charIndex > currentText.length) {
          forward = false;
          timeout = setTimeout(type, 1500); // pausa antes de apagar
          return;
        }
      } else {
        // Apaga letra por letra
        setTypedPlaceholder(currentText.slice(0, charIndex));
        charIndex--;
        if (charIndex < 0) {
          forward = true;
          setPlaceholderIndex((prev) => (prev + 1) % inspiringPlaceholders.length);
          return;
        }
      }

      timeout = setTimeout(type, 100);
    };

    type();

    return () => clearTimeout(timeout);
  }, [placeholderIndex]);


  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const token = localStorage.getItem("token");
        // Reutilizando o endpoint de perfil que já busca o nome
        const res = await fetch(`${API_URL}/api/Profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUserName(data.nome); // Salva o nome no estado
        }
      } catch (error) {
        //console.error("Falha ao buscar nome do usuário", error);
      }
    };
    fetchUserName();
  }, []);

  useEffect(() => {
    if (quiz.length > 0 && !isGeneratingQuiz) {
      quizContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [quiz, isGeneratingQuiz]);

  // Mantém sua lógica de envio
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadedFile(file);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token"); // ← ADICIONE ESTA LINHA
      const response = await fetch(`${API_URL}/api/Resumo/resumo-file`, {
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

  const handleSliderChange = (e) => { setNumQuestions(parseInt(e.target.value)); };

  const handleGenerateSummary = async (topicToGenerate, fileInput, text) => {
    // //console.log("⚠️ handleGenerateSummary disparado!", { text });

    const topic = topicToGenerate || content;
    const fileToSend = fileInput || uploadedFile;

    if (!topic && !fileToSend) {
      toast.info('Digite um tópico ou envie um arquivo para gerar o resumo!');
      return;
    }

    setIsGeneratingSummary(true);
    setResumoGerado(null);
    setQuiz([]);
    setScore(null);

    const loadingMessages = [
      "Analisando a matéria...",
      "Estruturando os pontos-chave...",
      "Construindo seu resumo inteligente...",
      "Revisando e refinando o texto...",
      "Quase pronto!"
    ];
    let messageIndex = 0;
    setLoadingMessage(loadingMessages[messageIndex]);

    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[messageIndex]);
    }, 3000);

    try {
      const token = localStorage.getItem("token");

      // --- FLUXO DE ARQUIVO ---
      if (fileToSend) {
        setIsResumoDeArquivo(true);
        const formData = new FormData();
        formData.append("file", fileToSend);

        const fileRes = await fetch(`${API_URL}/api/Resumo/resumo-file`, {
          method: "POST",
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        if (!fileRes.ok) throw new Error(await fileRes.text());
        const data = await fileRes.json();

        // Busca resumo completo pelo ID retornado
        const resumoRes = await fetch(`${API_URL}/api/Resumo/por-id/${data.resumoId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!resumoRes.ok) throw new Error(await resumoRes.text());
        const resumoData = await resumoRes.json();

        const textoResumo = resumoData.ResumoTexto || data.resumo || "";
        const resumoIdFinal = data.resumoId;

        setResumoGerado({ texto: textoResumo, id: resumoIdFinal });
        setResumoId(resumoIdFinal);

        toast.success("Resumo gerado a partir do arquivo!");
        clearInterval(messageInterval);
        setIsGeneratingSummary(false);
        return;
      }

      // --- FLUXO DE TEXTO ---
      setIsResumoDeArquivo(false);
      const res = await fetch(`${API_URL}/api/Resumo/gerar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ Topico: topic })
      });

      if (!res.ok) {
        let errorMessage = "Erro ao gerar resumo.";

        try {
          const data = await res.json();
          errorMessage = data.mensagem || errorMessage;

          // Se tiver sugestão, dá pra exibir junto:
          if (data.sugestao) {
            toast.info(data.sugestao, { autoClose: 8000 });
          }

        } catch {
          // fallback se o backend não retornar JSON
          const text = await res.text();
          errorMessage = text || errorMessage;
        }

        toast.error(errorMessage);
        clearInterval(messageInterval);
        setIsGeneratingSummary(false);
        return;
      }

      const { requestId, resumoId: resumoIdBackend } = await res.json();
      setActiveRequestId(requestId);

      // //Acho que é o ID certo
      // //console.log('request_Id', requestId)

      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`${API_URL}/api/generation/status/${requestId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (!statusRes.ok) return;
          const statusData = await statusRes.json();

          if (statusData.status === 2) {
            clearInterval(pollInterval);
            clearInterval(messageInterval);
            setIsGeneratingSummary(false);
            setActiveRequestId(null);

            let parsedResultado = {};
            try {
              parsedResultado = JSON.parse(statusData.resultado);
            } catch {
              parsedResultado = { texto: statusData.resultado };
            }

            const resumoFinalId = statusData.resumoId || parsedResultado.id || parsedResultado.Id || requestId;
            const resumoTexto = parsedResultado.texto || parsedResultado.ResumoTexto || parsedResultado.resumo || parsedResultado;

            // //console.log('ResumoFinalId', resumoFinalId);
            // //console.log('resumoTexto', resumoTexto);

            setResumoGerado({
              texto: typeof resumoTexto === "string" ? resumoTexto : JSON.stringify(resumoTexto),
              id: resumoFinalId
            });
            setResumoId(resumoFinalId);
            // //console.log('Resumo id final guardado', resumoFinalId)

            toast.success("Resumo gerado com sucesso!");
          } else if (statusData.status === 3) {
            clearInterval(pollInterval);
            clearInterval(messageInterval);
            toast.error(`Erro ao gerar resumo: ${statusData.mensagemErro}`);
            setIsGeneratingSummary(false);
            setActiveRequestId(null);
          }
        } catch (pollError) {
          // //console.error("Erro durante o polling:", pollError);
        }
      }, 5000);

    } catch (err) {
      // //console.error(err);
      toast.error('Erro: ' + err.message);
      clearInterval(messageInterval);
      setIsGeneratingSummary(false);
    }
  };

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

        data = await res.json();

        if (!res.ok) {
          toast.error(data.mensagem || "Ocorreu um erro ao gerar o resumo");
          return;
        }

        let questoesJson = data.QuestoesJson || data.questoesJson;
        if (!questoesJson) throw new Error("Questões do simulado estão vazias");

        // ✅ Backend agora retorna JSON puro
        const questoesArray = parseQuestoesJson(questoesJson);

        if (!Array.isArray(questoesArray)) throw new Error("Formato inválido de questões");

        setQuiz(questoesArray);
        setSimuladoGerado(data);
        toast.success("Simulado gerado com sucesso!");
        setIsGeneratingQuiz(false);
        return;
      }

      // --- FLUXO DE TEXTO (com fila) ---
      //console.log('Simulado pra criar', resumoGerado.id)
      const response = await fetch(`${API_URL}/api/Simulado/gerar`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          resumoId: resumoGerado?.id || resumoGerado?.Id,
          numeroDeQuestoes: numQuestions
        })

      });

      if (!response.ok) throw new Error(await response.text());
      const { requestId } = await response.json();
      //console.log('🧩 Simulado enviado para fila. Request ID:', requestId);

      // Polling
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`${API_URL}/api/generation/status/${requestId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (!statusRes.ok) return;
          const statusData = await statusRes.json();

          if (statusData.status === 2) {
            clearInterval(pollInterval);

            if (!statusData.resultado) throw new Error("Simulado gerado mas resultado vazio");

            // ✅ Resultado vem como string JSON — converter
            let resultadoParsed = statusData.resultado;
            if (typeof resultadoParsed === "string") {
              try {
                resultadoParsed = JSON.parse(resultadoParsed);
              } catch (err) {
                //console.warn("⚠️ Resultado não era JSON válido:", resultadoParsed);
              }
            }

            let questoesJson = resultadoParsed.QuestoesJson || resultadoParsed.questoesJson;
            if (!questoesJson) throw new Error("Questões do simulado ausentes no resultado");

            const questoesArray = parseQuestoesJson(questoesJson);
            if (!Array.isArray(questoesArray)) throw new Error("Formato inválido de questões");

            setQuiz(questoesArray);
            setSimuladoGerado(resultadoParsed);

            toast.success("Simulado gerado com sucesso!");
            setIsGeneratingQuiz(false);
          } else if (statusData.status === 3) {
            clearInterval(pollInterval);
            toast.error(`Erro ao gerar simulado: ${statusData.mensagemErro}`);
            setIsGeneratingQuiz(false);
          }
        } catch (pollError) {
          //console.error("Erro durante o polling:", pollError);
          clearInterval(pollInterval);
          setIsGeneratingQuiz(false);
        }
      }, 5000);

    } catch (err) {
      //console.error("Erro geral no handleGenerateQuiz:", err);
      toast.error('Erro: ' + err.message);
      setIsGeneratingQuiz(false);
    }
  };


  const handleSubmitQuiz = async () => {
    //console.log("📘 Submetendo simulado:", simuladoGerado);

    // ✅ Garante que existe algum identificador
    const simuladoId = simuladoGerado?.id || simuladoGerado?.Id;
    const requestId = simuladoGerado?.requestId || simuladoGerado?.RequestId;

    if (!simuladoId && !requestId) {
      alert("Nenhum identificador de simulado encontrado (nem id nem requestId).");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      // 🔹 Se houver ID direto do simulado (gerado ou vindo do backend)
      if (simuladoId) {
        //console.log("🎯 Enviando respostas para simulado ID:", simuladoId);
        const res = await fetch(`${API_URL}/api/Simulado/${simuladoId}/finalizar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
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
                <div
                  className={`search-input-container ${isDragOver ? 'drag-over' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type="text"
                    className="unified-search-input"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={typedPlaceholder}
                    onKeyPress={(e) => e.key === 'Enter' && handleGenerateSummary(null, uploadedFile)}
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
                </div>

                {/* BOTÕES DO LADO DIREITO */}
                <div className="search-actions-right">
                  <button
                    className="options-resumo-btn"
                    onClick={() => document.getElementById('file-upload').click()}
                    title="Anexar arquivo"
                  >
                    <Paperclip size={20} />
                  </button>

                  <button
                    className="btn-enviar-resumo"
                    onClick={() => handleGenerateSummary(null, uploadedFile)}
                    disabled={isGeneratingSummary || (!content && !uploadedFile)}
                  >
                    {isGeneratingSummary ? <div className="loading-spinner-mini"></div> : <MoveUp size={20} />}
                  </button>
                </div>

                <input
                  type="file"
                  id="file-upload"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="file-input-hidden"
                />
              </div>

              {/* DICA DE PONTOS - VERSÃO COMPACTA */}
              <div
                className="points-tip-compact"
                onClick={() => setShowPointsText(!showPointsText)}
                style={{ cursor: 'pointer' }}
              >
                <Gift size={16} />
                {showPointsText && (
                  <span><strong>+5min</strong> de estudos por resumo</span>
                )}
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
                        <h3>Preparando seu Resumo Inteligente</h3>
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
                          // Personaliza parágrafos para destacar palavras-chave
                          p: ({ node, ...props }) => <ParagraphWithHighlights {...props} />,
                          // Mantém outros elementos do markdown
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
                        {typeof resumoGerado === "string"
                          ? resumoGerado
                          : resumoGerado.texto || resumoGerado.ResumoTexto || ""}
                      </ReactMarkdown>
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
              <div
                className="points-tip-compact"
                onClick={() => setShowPointsText(!showPointsText)}
                style={{ cursor: 'pointer' }}
              >
                <Gift size={16} />
                {showPointsText && (
                  <span>Cada acerto no simulado <strong>+10 pontos no Hall da Fama</strong></span>
                )}
              </div>

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
