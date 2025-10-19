import React, { useState } from 'react'; // Importe o useState
import { NavLink, useNavigate } from 'react-router-dom';
import Logo from '../../assets/logo.svg';
import Logo_icon from '../../assets/logo_icon.svg';

// Ícones: Adicionei ChevronsLeft para o botão de recolher
import {
  BookOpen, FileText, Target, User, Award, CalendarDays,
  CheckCheck, Star, LogOut, ChevronsLeft
} from 'lucide-react';

import './MainLayout.scss';

function MainLayout({ children }) {
  const navigate = useNavigate();

  // --- MUDANÇA 1: Adicionar estado para controlar a sidebar ---
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Função para alternar o estado da sidebar
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    // --- MUDANÇA 2: Adicionar classe dinâmica ao container principal ---
    <div className={`layout-container ${isCollapsed ? 'sidebar-collapsed' : ''}`}>

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
          <button onClick={toggleSidebar} className="sidebar-toggle-btn">
            <ChevronsLeft size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className="nav-link primary-action">
            <BookOpen className="nav-icon" />
            <span className="nav-text">Criar Estudo</span>
          </NavLink>

          <ul className="nav-list">
            <li className="nav-item">
              <NavLink to="/plano-de-estudo" className="nav-link">
                <CalendarDays className="nav-icon" />
                <span className="nav-text">Plano de Estudos</span>
              </NavLink>
            </li>

            <li className="nav-category-title">
              <span className="nav-text">Sua Biblioteca</span>
            </li>
            <li className="nav-item">
              <NavLink to="/meus-resumos" className="nav-link">
                <FileText className="nav-icon" />
                <span className="nav-text">Meus Resumos</span>
              </NavLink>
            </li>
            {/* ... Repita o padrão de envolver o texto em <span className="nav-text"> para todos os itens ... */}
            <li className="nav-item">
              <NavLink to="/meus-simulados" className="nav-link">
                <Target className="nav-icon" />
                <span className="nav-text">Meus Simulados</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/historico-de-planos" className="nav-link">
                <CheckCheck className="nav-icon" />
                <span className="nav-text">Planos Concluídos</span>
              </NavLink>
            </li>

            <li className="nav-category-title">
              <span className="nav-text">Comunidade</span>
            </li>
            <li className="nav-item">
              <NavLink to="/ranking" className="nav-link">
                <Award className="nav-icon" />
                <span className="nav-text">Ranking</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <NavLink to="/planos" className="nav-link upgrade-link">
            <Star className="nav-icon" />
            <span className="nav-text">Seja Premium</span>
          </NavLink>
          <NavLink to="/perfil" className="nav-link">
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
