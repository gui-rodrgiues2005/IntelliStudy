// Em src/pages/Meusconteudos.jsx

import { useState, useEffect } from 'react';
import { Trash2, Download, List, ArrowRight } from 'lucide-react';
import { API_URL } from '../../../config';
import { toast } from "react-toastify";
import './MeusConteudos.scss';

const MeusConteudos = ({ modo = "conteudos", onSelectChat }) => {

  const [listaResumos, setListaResumos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // ----- RESPONSIVIDADE -----
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);

      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  // ----- BUSCAR LISTA -----
  useEffect(() => {
    const fetchListaResumo = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(`${API_URL}/api/Resumo`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Falha ao buscar lista.");

        const data = await res.json();
        setListaResumos(data);

      } catch (error) {
        console.error(error);
        alert(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchListaResumo();
  }, []);

  // ----- DOWNLOAD -----
  const handleDownloadResumo = async (resumoId, e) => {
    e.stopPropagation();
    toast.info(`A função de download ainda está sendo criada.`);
  };

  return (
    <div className="meus-conteudos-page">

      {/* BOTÃO MOBILE */}
      {isMobile && (
        <button
          className="conteudos-mobile-menu-btn"
          onClick={toggleSidebar}
        >
          {isMobileOpen ? <ArrowRight size={15} /> : <List size={15} />}
        </button>
      )}

      {/* SIDEBAR */}
      <aside className={`conteudos-sidebar ${isMobile ? (isMobileOpen ? 'open' : 'closed') : ''}`}>
        <h3>Conteúdos</h3>

        <ul className="conteudos-list">
          {listaResumos.map(resumo => (
            <li
              key={resumo.id}
              onClick={() => {
                onSelectChat(resumo.id); // agora sempre chama a função do pai
              }}
            >

              <div className="item-content">
                <span className="topico-titulo">{resumo.topicoOriginal}</span>
                <span className="topico-data">
                  {new Date(resumo.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="actions-container">
                <button
                  className="download-btn"
                  onClick={(e) => handleDownloadResumo(resumo.id, e)}
                >
                  <Download size={18} />
                </button>

                {/* futuro delete */}
              </div>
            </li>
          ))}
        </ul>
      </aside>

    </div>
  );
};

export default MeusConteudos;
