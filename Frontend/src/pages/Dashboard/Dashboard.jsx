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
    setIsGeneratingQuiz,
    topicoInicial,
    setTopicoInicial
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

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const token = localStorage.getItem("token");
        // Reutilizando o endpoint de perfil que já busca o nome
        const res = await fetch('http://localhost:5051/api/Profile', {
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

    const response = await fetch("http://localhost:5051/api/Resumo/resumo-file", {
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

  const handleGenerateSummary = async (topicToGenerate, fileInput) => {
    const topic = topicToGenerate || content;
    const fileToSend = fileInput || uploadedFile;

    // Se não tiver nem texto nem arquivo, exibe aviso e sai
    if (!topic && !fileToSend) {
      toast.info('Digite um tópico ou envie um arquivo para gerar o resumo!');
      return;
    }

    setIsGeneratingSummary(true);
    setResumoGerado(null);
    setQuiz([]);
    setScore(null);

    const messages = [
      "Analisando a matéria...",
      "Estruturando os pontos-chave...",
      "Construindo seu resumo inteligente...",
      "Revisando e refinando o texto...",
      "Quase pronto!"
    ];
    let messageIndex = 0;
    setLoadingMessage(messages[messageIndex]);

    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length;
      setLoadingMessage(messages[messageIndex]);
    }, 3000);

    try {
      const token = localStorage.getItem("token");
      let res;

      // 🧩 Se enviou arquivo, usa o endpoint de arquivo
      if (fileToSend) {
        const formData = new FormData();
        formData.append("file", fileToSend);

        res = await fetch("http://localhost:5051/api/Resumo/resumo-file", {
          method: "POST",
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
      }
      // 🧩 Se digitou texto, usa o endpoint normal
      else {
        res = await fetch("http://localhost:5051/api/Resumo/gerar", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ Topico: topic })
        });
      }

      if (!res.ok) {
        throw new Error(`Erro ao enviar pedido: ${await res.text()}`);
      }

      const { requestId } = await res.json();
      setActiveRequestId(requestId);

      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`http://localhost:5051/api/generation/status/${requestId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (!statusRes.ok) return;
          const statusData = await statusRes.json();

          if (statusData.status === 2) { // Concluído
            clearInterval(pollInterval);
            clearInterval(messageInterval);

            if (statusData.resultado) {
              try {
                const resumoFinal = JSON.parse(statusData.resultado);
                setResumoGerado(resumoFinal);
              } catch (e) {
                console.error("Falha ao fazer o parse do JSON:", e);
              }
            } else {
              toast.error("O resumo foi gerado, mas o resultado está vazio.");
            }

            setIsGeneratingSummary(false);
            setActiveRequestId(null);
          }
          else if (statusData.status === 3) { // Falhou
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
    const fetchUserName = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch('http://localhost:5051/api/Profile', {
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

    if (topicoInicial) {
      setContent(topicoInicial);
      handleGenerateSummary(topicoInicial);
      setTopicoInicial('');
    }
  }, [topicoInicial, setTopicoInicial]);

  // --- FUNÇÕES DO QUIZ ---
  // Em src/pages/Dashboard/Dashboard.jsx

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
      const res = await fetch('http://localhost:5051/api/Simulado/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ resumoId: resumoGerado.Id, numeroDeQuestoes: numQuestions })
      });


      if (!res.ok) {
        throw new Error(await res.text());
      }

      const { requestId } = await res.json();

      // 2. Inicia o polling para verificar o status do simulado
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`http://localhost:5051/api/generation/status/${requestId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (!statusRes.ok) return;

          const statusData = await statusRes.json();

          if (statusData.status === 2) {
            clearInterval(pollInterval);

            if (statusData.resultado) {
              try {
                const simuladoFinal = JSON.parse(statusData.resultado);

                if (simuladoFinal) {
                  setSimuladoGerado(simuladoFinal);
                  if (simuladoFinal.QuestoesJson) {
                    const questoesDoSimulado = JSON.parse(simuladoFinal.QuestoesJson);
                    setQuiz(questoesDoSimulado);
                  }
                  else {
                    console.error("Objeto Simulado recebido, mas 'QuestoesJson' está faltando.", simuladoFinal);
                    toast.info("O simulado foi gerado, mas as questões não foram encontradas.");
                  }
                } else {
                  toast.error("Ocorreu um erro ao processar o resultado do simulado.");
                }
              } catch (e) {
                console.error("Falha ao fazer o parse do resultado do simulado:", e);
                toast.info("O simulado foi gerado, mas houve um problema ao formatá-lo.");
              }
            } else {
              toast.error("O simulado foi gerado, mas houve um problema ao exibi-lo.");
            }

            setIsGeneratingQuiz(false);
          }
        } catch (pollError) {
          console.error("Erro durante o polling do simulado:", pollError);
        }
      }, 5000); // Verifica a cada 5 segundos

    } catch (err) {
      console.error("Erro ao enfileirar o simulado:", err);
      alert(err.message);
      setIsGeneratingQuiz(false);
    }
  };

  const handleAnswerChange = (questionIndex, answer) => {
    setUserAnswers(prevAnswers => ({ ...prevAnswers, [questionIndex]: answer }));
  };

  const handleSubmitQuiz = async () => {
    if (!simuladoGerado || !simuladoGerado.Id) {
      alert("ID do simulado não encontrado. Não é possível finalizar.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5051/api/Simulado/${simuladoGerado.Id}/finalizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(userAnswers)
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Falha ao finalizar o simulado: ${errorText}`);
      }

      const resultado = await res.json();
      const finalScore = (resultado.acertos / resultado.totalQuestoes) * 100;
      setScore(finalScore);

    } catch (error) {
      console.error("Erro ao finalizar o simulado:", error);
      alert(error.message);
    }
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
                  resumoGerado && <div className="markdown-content"><ReactMarkdown>{resumoGerado.ResumoTexto}</ReactMarkdown></div>
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
                      max="10"
                      value={numQuestions}
                      onChange={handleSliderChange}
                      className="slider"
                    />
                    <div className="slider-labels">
                      <span>2 questões</span>
                      <span>10 questões</span>
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
