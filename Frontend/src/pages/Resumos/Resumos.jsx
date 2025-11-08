// Em src/pages/Meusconteudos.jsx

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Trash2, Download, Menu, X, AlignStartVertical, ArrowRight, List, AlignHorizontalJustifyEnd } from 'lucide-react';
import { API_URL } from '../../../config';
import './Resumos.scss';

function conteudos() {
  const [listaConteudos, setListaConteudos] = useState([]);
  const [conteudoSelecionado, setConteudoSelecionado] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // Estados para responsividade mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  // Efeito para detectar mudança de tamanho da tela
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false); // Fecha sidebar mobile em telas grandes
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Função para alternar a sidebar mobile
  const toggleSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };



  // Efeito que busca a lista de conteudos quando a página carrega
  useEffect(() => {
    const fetchListaConteudo = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/Resumo`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Falha ao buscar lista de conteudos.");

        const data = await res.json();
        setListaConteudos(data);
      } catch (error) {
        console.error(error);
        alert(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchListaConteudo();
  }, []); // O array vazio [] garante que isso só roda uma vez

  // Função para buscar um conteudo completo quando o usuário clica em um item da lista
  const handleSelecionarConteudo = async (resumoId) => {
    setConteudoSelecionado(null); // Limpa o conteudo anterior
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/Resumo/meus-resumos/${resumoId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Falha ao buscar o conteudo selecionado.");

      const data = await res.json();
      setConteudoSelecionado(data);
      console.log(data);
      if (isMobile) {
        setIsMobileOpen(false);
      }
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConteudo = async (resumoId, event) => {
    event.stopPropagation(); // Impede que o clique no ícone também selecione o conteudo.

    if (!window.confirm("Tem certeza que deseja deletar este conteudo?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/Resumo/${resumoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error("Falha ao deletar o conteudo.");
      }

      // Se deletou com sucesso, remove o conteudo da lista no estado.
      setListaConteudos(listaConteudos.filter(r => r.id !== resumoId));
      // Se o conteudo deletado era o que estava selecionado, limpa a tela.
      if (conteudoSelecionado?.id === resumoId) {
        setConteudoSelecionado(null);
      }

    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  const handleDownloadConteudo = async (resumoId, e) => {
    e.stopPropagation(); // ⬅️ Essencial: impede que o evento de clique suba e selecione o conteudo

    // Aqui você fará a chamada para a API do Backend que gera o PDF
    // Por enquanto, vamos simular a ação:
    // console.log(`Iniciando download do conteudo ID: ${conteudoId}`);

    // ⚠️ SUBSTITUA ESTE CONSOLE.LOG PELA CHAMADA REAL DA API:
    // Exemplo: window.open(`http://localhost:5051/api/conteudo/download/${conteudoId}?token=${token}`, '_blank');
    // Ou faça um fetch e crie o blob, como na Seção 3.

    toast.info(`A função de download para o ID ${resumoId} esta sendo criada.`);
  };

  return (
    <div className="meus-conteudos-page">
      {/* Botão de menu mobile */}

      {isMobile && (
        <button className="conteudos-mobile-menu-btn" onClick={toggleSidebar}>
          {isMobileOpen ? <ArrowRight size={15} /> : <List size={15} />}
        </button>
      )}

      <aside className={`conteudos-sidebar ${isMobile ? (isMobileOpen ? 'open' : 'closed') : ''}`}>
        <h3>Conteudos</h3>
        <ul className="conteudos-list">
          {listaConteudos.map(conteudo => (
            <li
              key={conteudo.id}
              onClick={() => handleSelecionarConteudo(conteudo.id)}
              className={conteudoSelecionado?.id === conteudo.id ? 'active' : ''}
            >
              <div className="item-content">
                <span className="topico-titulo">{conteudo.topicoOriginal}</span>
                <span className="topico-data">
                  {new Date(conteudo.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* 🎯 NOVO: Contêiner para os botões de Ação */}
              <div className="actions-container">

                {/* Botão de DOWNLOAD */}
                <button
                  className="download-btn"
                  onClick={(e) => handleDownloadConteudo(conteudo.id, e)}
                >
                  <Download size={18} />
                </button>

                {/* Botão de DELETAR (Você já tinha essa lógica) */}
                <button
                  className="delete-btn"
                  onClick={(e) => handleDeleteConteudo(conteudo.id, e)}
                >
                  <Trash2 size={18} />
                </button>

              </div>
            </li>
          ))}
        </ul>
      </aside>

      <main className="conteudo-content">
        {isLoading && <p>Carregando...</p>}

        {!isLoading && !conteudoSelecionado && (
          <div className="placeholder-content">
            <h2>Selecione um conteudo da lista para visualizar.</h2>
          </div>
        )}

        {conteudoSelecionado && (
          <div className="markdown-content">
            <ReactMarkdown>{conteudoSelecionado.textoGerado}</ReactMarkdown>
          </div>
        )}
      </main>
    </div>
  );
}

export default conteudos;
