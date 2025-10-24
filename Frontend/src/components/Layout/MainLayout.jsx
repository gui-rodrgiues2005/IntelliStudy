import React, { useState, useEffect } from 'react'; // Importe o useState
import { NavLink, useNavigate } from 'react-router-dom';
import Logo from '../../assets/logo.svg';
import Logo_icon from '../../assets/logo_icon.svg';

// Ícones: Adicionei ChevronsLeft para o botão de recolher
import {
  BookOpen, FileText, Target, User, Award, CalendarDays,
  CheckCheck, Star, LogOut, ChevronsLeft, Menu, X
} from 'lucide-react';

import './MainLayout.scss';

function MainLayout({ children }) {
  const navigate = useNavigate();

  // --- MUDANÇA 1: Adicionar estado para controlar a sidebar ---
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Detectar se é mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false); // Fechar sidebar mobile em telas grandes
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Função para alternar o estado da sidebar
  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    // --- MUDANÇA 2: Adicionar classe dinâmica ao container principal ---
    <div className={`layout-container ${isCollapsed ? 'sidebar-collapsed' : ''} ${isMobile ? 'mobile' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>

      {/* Botão hamburger para mobile */}
      {isMobile && (
        <button onClick={toggleSidebar} className="mobile-menu-btn">
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      {/* Overlay para mobile */}
      {isMobile && isMobileOpen && (
        <div className="mobile-overlay" onClick={toggleSidebar}></div>
      )}

      {/* --- MUDANÇA 3: Adicionar classe dinâmica à sidebar --- */}
      <aside className="main-sidebar">

        <div className="sidebar-header">
          <div className="logo-container">
            {isCollapsed ? (
              <img src={Logo_icon} alt="IntelliStudy Icon" className="logo-icon" />
            ) : (
              <img src={Logo} alt="IntelliStudy" className="logo-full" />
            )}
          </div>

          {/* --- MUDANÇA 4: Adicionar o botão de toggle --- */}
          {!isMobile && (
            <button onClick={toggleSidebar} className="sidebar-toggle-btn">
              <ChevronsLeft size={20} />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className="nav-link primary-action" onClick={isMobile ? toggleSidebar : undefined}>
            <BookOpen className="nav-icon" />
            <span className="nav-text">Criar Estudo</span>
          </NavLink>

          <ul className="nav-list">
            <li className="nav-item">
              <NavLink to="/plano-de-estudo" className="nav-link" onClick={isMobile ? toggleSidebar : undefined}>
                <CalendarDays className="nav-icon" />
                <span className="nav-text">Plano de Estudos</span>
              </NavLink>
            </li>

            <li className="nav-category-title">
              <span className="nav-text">Sua Biblioteca</span>
            </li>
            <li className="nav-item">
              <NavLink to="/meus-resumos" className="nav-link" onClick={isMobile ? toggleSidebar : undefined}>
                <FileText className="nav-icon" />
                <span className="nav-text">Meus Resumos</span>
              </NavLink>
            </li>
            {/* ... Repita o padrão de envolver o texto em <span className="nav-text"> para todos os itens ... */}
            <li className="nav-item">
              <NavLink to="/meus-simulados" className="nav-link" onClick={isMobile ? toggleSidebar : undefined}>
                <Target className="nav-icon" />
                <span className="nav-text">Meus Simulados</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/historico-de-planos" className="nav-link" onClick={isMobile ? toggleSidebar : undefined}>
                <CheckCheck className="nav-icon" />
                <span className="nav-text">Planos Concluídos</span>
              </NavLink>
            </li>

            <li className="nav-category-title">
              <span className="nav-text">Comunidade</span>
            </li>
            <li className="nav-item">
              <NavLink to="/ranking" className="nav-link" onClick={isMobile ? toggleSidebar : undefined}>
                <Award className="nav-icon" />
                <span className="nav-text">Ranking</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <NavLink to="/planos" className="nav-link upgrade-link" onClick={isMobile ? toggleSidebar : undefined}>
            <Star className="nav-icon" />
            <span className="nav-text">Seja Premium</span>
          </NavLink>
          <NavLink to="/perfil" className="nav-link" onClick={isMobile ? toggleSidebar : undefined}>
            <User className="nav-icon" />
            <span className="nav-text">Perfil</span>
          </NavLink>
          <button onClick={handleLogout} className="nav-link logout-button">
            <LogOut className="nav-icon" />
            <span className="nav-text">Sair</span>
          </button>
        </div>
      </aside>

      <main className="main-page-content">
        {children}
      </main>
    </div>
  );
}

export default MainLayout;
