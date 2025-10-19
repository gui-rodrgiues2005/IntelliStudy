// Em src/pages/MeusResumos.jsx

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Trash2 } from 'lucide-react'; 
import './Resumos.scss';

function Resumos() {
  const [listaResumos, setListaResumos] = useState([]);
  const [resumoSelecionado, setResumoSelecionado] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Efeito que busca a lista de resumos quando a página carrega
  useEffect(() => {
    const fetchListaResumos = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch('http://localhost:5051/api/Resumo', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Falha ao buscar lista de resumos.");

        const data = await res.json();
        setListaResumos(data);
      } catch (error) {
        console.error(error);
        alert(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchListaResumos();
  }, []); // O array vazio [] garante que isso só roda uma vez

  // Função para buscar um resumo completo quando o usuário clica em um item da lista
  const handleSelecionarResumo = async (resumoId) => {
    setResumoSelecionado(null); // Limpa o resumo anterior
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5051/api/Resumo/${resumoId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Falha ao buscar o resumo selecionado.");

      const data = await res.json();
      setResumoSelecionado(data);
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteResumo = async (resumoId, event) => {
    event.stopPropagation(); // Impede que o clique no ícone também selecione o resumo.

    if (!window.confirm("Tem certeza que deseja deletar este resumo?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5051/api/Resumo/${resumoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error("Falha ao deletar o resumo.");
      }

      // Se deletou com sucesso, remove o resumo da lista no estado.
      setListaResumos(listaResumos.filter(r => r.id !== resumoId));
      // Se o resumo deletado era o que estava selecionado, limpa a tela.
      if (resumoSelecionado?.id === resumoId) {
        setResumoSelecionado(null);
      }

    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <div className="meus-resumos-page">
      <aside className="resumos-sidebar">
        <h3>Meus Resumos</h3>
        <ul className="resumos-list">
          {listaResumos.map(resumo => (
            <li
              key={resumo.id}
              onClick={() => handleSelecionarResumo(resumo.id)}
              className={resumoSelecionado?.id === resumo.id ? 'active' : ''}
            >
              <div className="item-content">
                <span className="topico-titulo">{resumo.topicoOriginal}</span>
                <span className="topico-data">
                  {new Date(resumo.createdAt).toLocaleDateString()}
                </span>
              </div>
              <button className="delete-btn" onClick={(e) => handleDeleteResumo(resumo.id, e)}>
                <Trash2 size={18} />
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <main className="resumo-content">
        {isLoading && <p>Carregando...</p>}

        {!isLoading && !resumoSelecionado && (
          <div className="placeholder-content">
            <h2>Selecione um resumo da lista para visualizar.</h2>
          </div>
        )}

        {resumoSelecionado && (
          <div className="markdown-content">
            <ReactMarkdown>{resumoSelecionado.resumoTexto}</ReactMarkdown>
          </div>
        )}
      </main>
    </div>
  );
}

export default Resumos;
