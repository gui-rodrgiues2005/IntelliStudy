import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import Logo from '../../../assets/logo.png';
import Logo_icon from '../../../assets/logo_icon.svg';
import {
  BookOpen, FileText, Target, User, Award, CalendarDays,
  CheckCheck, Star, LogOut, ChevronsLeft, Menu, X, MessageCircle
} from 'lucide-react';
import './MainLayout.scss';

function MainLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Estados existentes
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // NOVO: Estado para o menu de chats
  const [isChatsOpen, setIsChatsOpen] = useState(false);

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

  // Fechar menus mobile quando mudar de rota
  useEffect(() => {
    if (isMobile) {
      setIsMobileOpen(false);
      setIsChatsOpen(false);
    }
  }, [location.pathname, isMobile]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  const toggleChats = () => {
    setIsChatsOpen(!isChatsOpen);
  };

  return (
    <div className={`layout-container ${isCollapsed ? 'sidebar-collapsed' : ''} ${isMobile ? 'mobile' : ''} ${isMobileOpen ? 'mobile-open' : ''} ${isChatsOpen ? 'chats-open' : ''}`}>

      {/* Botão hamburger para mobile */}
      {isMobile && (
        <button onClick={toggleSidebar} className="mobile-menu-btn">
          {isMobileOpen ? <X size={15} /> : <Menu size={15} />}
        </button>
      )}

      {/* Botão para abrir chats em mobile */}
      {isMobile && (
        <button onClick={toggleChats} className="mobile-chats-btn">
          <MessageCircle size={15} />
        </button>
      )}

      {/* Overlay para mobile */}
      {isMobile && (isMobileOpen || isChatsOpen) && (
        <div className="mobile-overlay" onClick={() => {
          setIsMobileOpen(false);
          setIsChatsOpen(false);
        }}></div>
      )}

      {/* Sidebar Principal */}
      <aside className="main-sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            {isCollapsed ? (
              <img src={Logo_icon} alt="IntelliStudy Icon" className="logo-icon" />
            ) : (
              <img src={Logo} alt="IntelliStudy" className="logo-full" />
            )}
          </div>

          <div className="sidebar-header-actions">
            {/* Botão existente de toggle */}
            {!isMobile && (
              <button onClick={toggleSidebar} className="sidebar-toggle-btn">
                <ChevronsLeft size={20} />
              </button>
            )}
          </div>
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

            <li className="nav-item">
              <NavLink to="/desenvolvimento" className="nav-link" onClick={isMobile ? toggleSidebar : undefined}>
                <CalendarDays className="nav-icon" />
                <span className="nav-text">Analystics</span>
              </NavLink>
            </li>

            <li className="nav-category-title">
              <span className="nav-text">Sua Biblioteca</span>
            </li>

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