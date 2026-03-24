// src/pages/Dashboard/Dashboard.jsx
import React, {
  useState,
  useEffect,
  useRef
} from "react";
import { useActionData, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { API_URL } from "../../../config";
import Saudacao from "../../components/Saudacao/Saudacao";
import Imput from "../../components/Imput/Imput";
import TipoModal from "../../components/TipoModal/TipoModal";
import ButtonSimulado from "../../components/ButtonSimulado/ButtonSimulado";
import FormattedContent from "../../components/FormattedContent/FormattedContent";
import MeusConteudos from "../../components/MeusConteudos/MeusConteudos";
import { MessageCircle } from 'lucide-react';
import { useStudy } from "../../context/StudyContext";

import "./Dashboard.scss";

function Dashboard() {
  const navigate = useNavigate();
  const [isResumoDeArquivo, setResumoDeArquivo] = useState(false);
  const [resumoSelecionado, setResumoSelecionado] = useState(null);
  const [chatSelecionado, setChatSelecionado] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lista, setLista] = useState([]);


  const {
    resumoGerado,
    setResumoGerado,
    isGeneratingSummary,
    setIsGeneratingSummary,
    chats
  } = useStudy();

  // UI
  const [content, setContent] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [selectedTipo, setSelectedTipo] = useState("Resumo");
  const [showOptions, setShowOptions] = useState(false);
  const [showChats, setShowChats] = useState(false);
  const [conteudoChat, setConteudoChat] = useState(null);
  const [loadingChat, setLoadingChat] = useState(false);


  // animação suave
  const [isLoadingAnimation, setIsLoadingAnimation] = useState(false);

  // placeholder
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [typedPlaceholder, setTypedPlaceholder] = useState("");

  // drag
  const [isDragOver, setIsDragOver] = useState(false);

  // controle de geração
  const pollIntervalRef = useRef(null);
  const activeRequestIdRef = useRef(null);
  const mountedRef = useRef(true);

  //Botão do simulado
  const [summaryResult, setSummaryResult] = useState("");

  //Chats
  const [chatAberto, setChatAberto] = useState(null);
  console.log("Chat aberto:", chatAberto);

  // ------------------------------
  // LIMPEZA GLOBAL
  // ------------------------------
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      clearInterval(pollIntervalRef.current);
    };
  }, []);

  // ------------------------------------------------
  // FUNÇÃO: Iniciar chat com o resumo atual
  // ------------------------------------------------

  const buscarConteudoResumo = async (id) => {
    setConteudoChat(null);
    setLoadingChat(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/api/Resumo/meus-resumos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Falha ao buscar o conteúdo.");

      const data = await res.json();
      setConteudoChat(data);

    } catch (error) {
      alert(error.message);

    } finally {
      setLoadingChat(false);
    }
  };

  // No Dashboard.jsx - função handleIniciarChat atualizada
  const handleIniciarChat = async () => {
    if (!resumoGerado) {
      toast.info("Gere um resumo primeiro para iniciar um chat!");
      return;
    }

    // Verifica se já existe chat para este resumo
    const chatExistente = chats.find(chat => chat.resumoId === resumoGerado.id);

    if (chatExistente) {
      // Navega para MeusChats abrindo o chat existente
      navigate('/meus-chats', {
        state: { chatId: chatExistente.id }
      });
    } else {
      // Navega para MeusChats criando um novo chat
      navigate('/meus-chats', {
        state: { resumoGerado: resumoGerado }
      });
    }
  };

  const buscarConteudos = async () => {
    const endpoint =
      modo === "chats"
        ? "/chat/listar"
        : "/conteudos";

    const resp = await api.get(endpoint);
    setLista(resp.data);
  };


  // ------------------------------------------------
  // FUNÇÃO: Alternar visibilidade dos chats
  // ------------------------------------------------
  const toggleChats = () => {
    setShowChats(!showChats);
  };


  // ------------------------------
  // FILE UPLOAD
  // ------------------------------
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) setUploadedFile(file);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) setUploadedFile(file);
    setIsDragOver(false);
  };

  // ------------------------------------------------
  // INÍCIO DO POLLING
  // ------------------------------------------------
  const startPolling = (requestId) => {
    activeRequestIdRef.current = requestId;

    clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      if (!mountedRef.current) return;

      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/api/generation/status/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) return;
      const data = await res.json();

      // AGORA SIM você pode validar status
      if (data.status === 4) {
        return;
      }

      if (data.status === 2) {
        clearInterval(pollIntervalRef.current);
        setIsGeneratingSummary(false);
        setIsLoadingAnimation(false);

        let result = data.resultado;
        if (typeof result === "string") {
          try { result = JSON.parse(result); } catch { }
        }

        const texto = limparMarkdown(
          result?.TextoGerado ||
          result?.texto ||
          data?.texto ||
          "Resumo gerado"
        );

        setResumoGerado({ texto, id: requestId });
        console.log('resultado', result);
      }

      if (data.status === 3) {
        clearInterval(pollIntervalRef.current);
        setIsGeneratingSummary(false);
        setIsLoadingAnimation(false);
        toast.error(data.mensagemErro || "Erro ao gerar");
      }
    }, 2000);
  };

  // ------------------------------------------------
  // GERAÇÃO PRINCIPAL
  // ------------------------------------------------
  const handleGenerateSummary = async (topicToGenerate, fileOverride, tipoOverride) => {
    const topic = topicToGenerate || content;
    const file = fileOverride || uploadedFile;

    if (!topic && !file) {
      toast.info("Envie um arquivo ou digite algo para gerar.");
      return;
    }

    if (file) {
      setResumoDeArquivo(true);
    }

    setResumoGerado(null);
    setIsGeneratingSummary(true);
    setIsLoadingAnimation(true);

    try {
      const token = localStorage.getItem("token");

      // -------------------------
      // FLUXO DE ARQUIVO
      // -------------------------
      if (file) {
        const form = new FormData();
        form.append("file", file);
        form.append("tipo", tipoOverride || selectedTipo);

        const resFile = await fetch(`${API_URL}/api/resumo/resumo-file`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form
        });

        if (!resFile.ok) throw new Error("Erro ao enviar arquivo");

        const data = await resFile.json();

        const resumoRes = await fetch(`${API_URL}/api/resumo/por-id/${data.conteudoId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const resumoData = await resumoRes.json();

        setResumoGerado({
          texto: resumoData.conteudo || resumoData.texto,
          id: resumoData.conteudoId
        });

        setIsGeneratingSummary(false);
        setIsLoadingAnimation(false);
        return;
      }

      // -------------------------
      // FLUXO DE TEXTO
      // -------------------------
      const res = await fetch(`${API_URL}/api/resumo/gerar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          Topico: topic,
          Tipo: tipoOverride || selectedTipo
        })
      });

      if (!res.ok) throw new Error("Erro ao iniciar geração");

      const body = await res.json();
      const requestId = body.requestId;

      startPolling(requestId);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Erro inesperado");
      setIsGeneratingSummary(false);
      setIsLoadingAnimation(false);
    }
  };
  //
  //Abri Simulado
  //

  const handleOpenSimulado = () => {
    navigate("/configurar-simulado", {
      state: {
        resumoGerado,
        isResumoDeArquivo
      }
    });
  };

  // ------------------------------------------------
  // LOGOUT
  // ------------------------------------------------
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Limpar Makdon 

  function limparMarkdown(texto) {
    if (!texto) return "";

    let limpo = texto;

    // Remove blocos de código ``` ```
    limpo = limpo.replace(/```[\s\S]*?```/g, "");

    // Remove inline code `code`
    limpo = limpo.replace(/`([^`]+)`/g, "$1");

    // Remove títulos # ## ### ####
    limpo = limpo.replace(/^#{1,6}\s?(.*)/gm, "$1");

    // Negrito **texto**
    limpo = limpo.replace(/\*\*(.*?)\*\*/g, "$1");

    // Itálico *texto*
    limpo = limpo.replace(/\*(.*?)\*/g, "$1");

    // Sublinhado __texto__
    limpo = limpo.replace(/__(.*?)__/g, "$1");

    // Links [texto](link)
    limpo = limpo.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

    // Imagens ![alt](img)
    limpo = limpo.replace(/!\[([^\]]*)\]\([^)]+\)/g, "");

    // Citações >
    limpo = limpo.replace(/^>\s?/gm, "");

    // Listas -, *, +
    limpo = limpo.replace(/^\s*[-*+]\s+/gm, "");

    // Números de lista tipo:
    // 1. texto
    // 2) texto
    limpo = limpo.replace(/^\s*\d+[\.\)]\s+/gm, "");

    // Remove traços grandes ou separadores
    limpo = limpo.replace(/[-=]{3,}/g, "");

    // Remove emojis
    limpo = limpo.replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF][\uDC00-\uDFFF])/g,
      ""
    );

    // Remove caracteres especiais indesejados
    limpo = limpo.replace(/[{}[\]|<>~^_]/g, "");

    // Remove espaços antes de pontuação
    limpo = limpo.replace(/\s+([.,!?])/g, "$1");

    // Remove múltiplos espaços
    limpo = limpo.replace(/ {2,}/g, " ");

    // Remove várias linhas vazias consecutivas
    limpo = limpo.replace(/\n{3,}/g, "\n\n");

    return limpo.trim();
  }

  const carregarMensagens = async (conversaId) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
     
      const response = await fetch(`${API_URL}/api/Resumo/conversas/${conversaId}`, {
        headers: {
          Authorization: `Bearer ${token}`,"Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const erroTexto = await response.text();
        console.error("Resposta do servidor:", erroTexto);
        throw new Error("Falha ao carregar mensagens.");
      }

      if (!response.ok) throw new Error("Falha ao carregar mensagens.");
      const data = await response.json();
      setMensagens(data);
      setIsLoading(false);

    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
      alert("Erro ao carregar mensagens.");
    }
  }

  const abrirChat = async (conversaId) => {
    setResumoSelecionado(null);
    setChatSelecionado(conversaId);
    await carregarMensagens(conversaId);
  };

  // const handleNovoResumo = (resumo) => {
  //   setChatAberto(null); // esconde o chat
  //   setResumoGerado(resumo); // mostra o resumo
  // };


  // ------------------------------------------------
  // RENDER
  // ------------------------------------------------
  return (
    <div className={`dashboard ${resumoGerado ? "has-response" : "empty"} ${showChats ? "chats-open" : ""}`}>
      <div className={`sidebar-chats ${showChats ? "open" : ""}`}>
        <MeusConteudos
          modo="chats"
          onSelectChat={(conversaId) => abrirChat(conversaId)}
        />
      </div>
      <div className="main-content">

        {!resumoGerado && <Saudacao />}

        <Imput
          content={content}
          setContent={setContent}
          uploadedFile={uploadedFile}
          setUploadedFile={setUploadedFile}
          selectedTipo={selectedTipo}
          setSelectedTipo={setSelectedTipo}
          isGeneratingSummary={isGeneratingSummary}
          showOptions={showOptions}
          setShowOptions={setShowOptions}
          isDragOver={isDragOver}
          resumoGerado={resumoGerado}

          // Funções
          handleGenerateSummary={handleGenerateSummary}
          handleFileUpload={handleFileUpload}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
          handleOpenSimulado={handleOpenSimulado}
        />

        <TipoModal
          showOptions={showOptions}
          setShowOptions={setShowOptions}
          handleSelectTipo={setSelectedTipo}
        />

        {!chatAberto && resumoGerado && (
          <div className="resumo-container">
            <div className="resumo-box">
              <FormattedContent content={resumoGerado.texto} />

              <div className="resumo-actions">
                <ButtonSimulado onClick={handleOpenSimulado} />

                <button className="btn-chat" onClick={handleIniciarChat}>
                  <MessageCircle size={16} />
                  Iniciar Chat
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
