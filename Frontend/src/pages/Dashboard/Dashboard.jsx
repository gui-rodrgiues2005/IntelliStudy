import { useState, useEffect, useRef } from 'react';
import { useNavigate, NavLink } from 'react-router-dom'; // Para a função de logout
import ReactMarkdown from 'react-markdown';
import { toast } from "react-toastify";

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
  Clock
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';

import './Dashboard.scss';

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
    setIsGeneratingQuiz
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
  const API_URL = process.env.REACT_APP_API_URL;
 
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const token = localStorage.getItem("token");
        // Reutilizando o endpoint de perfil que já busca o nome
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/Profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUserName(data.nome); // Salva o nome no estado
        }
      } catch (error) {
        console.error("Falha ao buscar nome do usuário", error);
      }
    };
    fetchUserName();
  }, []);

  useEffect(() => {
    if (quiz.length > 0 && !isGeneratingQuiz) {
      quizContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [quiz, isGeneratingQuiz]);

  // --- FUNÇÕES DE MANIPULAÇÃO DE ARQUIVOS E SLIDER ---
  const handleFileUpload = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/Resumo/resumo-file`, {
      method: "POST",
      body: formData
    });

    const resumo = await response.json();
    console.log(resumo);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragOver(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setUploadedFile(files[0]);
      console.log('Arquivo arrastado:', files[0].name);
    }
  };
  const handleSliderChange = (e) => { setNumQuestions(parseInt(e.target.value)); };

  const handleGenerateSummary = async (topicToGenerate, fileInput, text) => {
    console.log("⚠️ handleGenerateSummary disparado!", { text });

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

        const fileRes = await fetch(`${process.env.REACT_APP_API_URL}/api/Resumo/resumo-file`, {
          method: "POST",
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        if (!fileRes.ok) throw new Error(await fileRes.text());
        const data = await fileRes.json();

        // Busca resumo completo pelo ID retornado
        const resumoRes = await fetch(`${process.env.REACT_APP_API_URL}/api/Resumo/por-id/${data.resumoId}`, {
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
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/Resumo/gerar`, {
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

      //Acho que é o ID certo
      console.log('request_Id', requestId)

      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`${process.env.REACT_APP_API_URL}/api/generation/status/${requestId}`, {
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

            console.log('ResumoFinalId', resumoFinalId);
            console.log('resumoTexto', resumoTexto);

            setResumoGerado({
              texto: typeof resumoTexto === "string" ? resumoTexto : JSON.stringify(resumoTexto),
              id: resumoFinalId
            });
            setResumoId(resumoFinalId);
            console.log('Resumo id final guardado', resumoFinalId)

            toast.success("Resumo gerado com sucesso!");
          } else if (statusData.status === 3) {
            clearInterval(pollInterval);
            clearInterval(messageInterval);
            toast.error(`Erro ao gerar resumo: ${statusData.mensagemErro}`);
            setIsGeneratingSummary(false);
            setActiveRequestId(null);
          }
        } catch (pollError) {
          console.error("Erro durante o polling:", pollError);
        }
      }, 5000);

    } catch (err) {
      console.error(err);
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
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/Profile`, {
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
      console.error("Erro ao parsear JSON das questões:", err, jsonString);
      // Tenta limpar caracteres de escape problemáticos (ex: aspas não escapadas)
      try {
        const fixed = cleaned.replace(/([^\\])"([^"]*)"([^,}\]]*)/g, '$1"$2\\"$3'); // Exemplo simples, pode precisar ajuste
        return JSON.parse(fixed);
      } catch (fixErr) {
        console.error("Falha ao corrigir JSON:", fixErr);
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
        console.log("📤 Enviando simulado (Direto):", {
          resumoId: resumoGerado.id,
          numeroDeQuestoes: numQuestions
        });

        res = await fetch(`${process.env.REACT_APP_API_URL}/api/Simulado/gerar-direto`, {
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
      console.log('Simulado pra criar', resumoGerado.id)
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/Simulado/gerar`, {
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
      console.log("📦 Enviando simulado com payload:", {
        resumoId: resumoGerado?.id || resumoGerado?.Id,
        numeroDeQuestoes: numQuestions
      });

      if (!response.ok) throw new Error(await response.text());
      const { requestId } = await response.json();
      console.log('🧩 Simulado enviado para fila. Request ID:', requestId);

      // Polling
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`${process.env.REACT_APP_API_URL}/api/generation/status/${requestId}`, {
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
                console.warn("⚠️ Resultado não era JSON válido:", resultadoParsed);
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
          console.error("Erro durante o polling:", pollError);
          clearInterval(pollInterval);
          setIsGeneratingQuiz(false);
        }
      }, 5000);

    } catch (err) {
      console.error("Erro geral no handleGenerateQuiz:", err);
      toast.error('Erro: ' + err.message);
      setIsGeneratingQuiz(false);
    }
  };


  const handleSubmitQuiz = async () => {
    console.log("📘 Submetendo simulado:", simuladoGerado);

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
        console.log("🎯 Enviando respostas para simulado ID:", simuladoId);
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/Simulado/${simuladoId}/finalizar`, {
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
        console.log("⏳ Buscando simulado criado a partir do request ID:", requestId);
        const resBusca = await fetch(`http://localhost:5051/api/Simulado/por-request/${requestId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!resBusca.ok) throw new Error("Não foi possível localizar o simulado gerado.");

        const simulado = await resBusca.json();

        if (!simulado?.id) throw new Error("Simulado retornado não contém ID.");

        console.log("🎯 Simulado encontrado:", simulado.id);

        const resFinalizar = await fetch(`http://localhost:5051/api/Simulado/${simulado.id}/finalizar`, {
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
      console.error("❌ Erro ao finalizar o simulado:", error);
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
        <header className="header">
          <h1 className="header-title">
            Olá, {userName || 'Estudante'}!
            <Sparkles className="title-icon" />
          </h1>
          <p className="header-subtitle">
            Pronto para começar uma nova sessão de estudos?
          </p>
        </header>

        <div className="card">
          <div className="card-content">
            <div className="content-space">
              <div className="form-group">
                <label className="form-label" htmlFor="materia-textarea">
                  <h3><FileText size={20} /> Entrada da Matéria</h3>
                  <span>Cole ou digite aqui o conteúdo que você deseja estudar.</span>
                </label>
                <textarea
                  id="materia-textarea"
                  className="form-textarea"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Ex: 'O que foi o Renascimento?' ou cole um texto completo....."
                />
              </div>
              <div className={`upload-area ${isDragOver ? 'drag-over' : ''}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                <FileUp className="upload-icon" />
                <p className="upload-text">{uploadedFile ? `Arquivo selecionado: ${uploadedFile.name}` : 'Ou faça upload de PDF/DOCX'}</p>
                <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} className="file-input" id="file-upload" />
                <label htmlFor="file-upload" className="upload-link">Clique para selecionar arquivos</label>
              </div>

              <button
                className="btn btn-primary"
                onClick={() => handleGenerateSummary(null, uploadedFile)}
                disabled={isGeneratingSummary}
              >
                <FileText size={20} />
                {isGeneratingSummary ? loadingMessage : "Gerar Resumo"}
              </button>

              <div className="points-tip">
                <Gift size={18} />
                <span>Cada resumo equivale a <strong>+5 minutos</strong> de estudos nas suas conquistas !</span>
              </div>
              <div className="result-section">
                {isGeneratingSummary ? (
                  <div className="summary-placeholder">
                    <div className="placeholder-line"></div>
                    <div className="placeholder-line"></div>
                    <div className="placeholder-line short"></div>
                  </div>
                ) : (
                  resumoGerado && (
                    <div className="markdown-content">
                      <ReactMarkdown>
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
              <div className="points-tip">
                <Clock size={18} />
                <span>Cada acerto no simulado vale <strong>+10 pontos</strong> para o ranking!</span>
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
                    {score === null && (<button className="btn btn-success" onClick={handleSubmitQuiz}>Finalizar e Corrigir</button>)}
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
