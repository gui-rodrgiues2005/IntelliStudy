import React, { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../../../assets/logo.svg";
import { Menu, X } from "lucide-react";
import "./NavigationSite.scss";

const NavigationSite = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="navegacao-site">
      <nav className="nav-container">
        <div className="logo">
          <img src={Logo} alt="Logo IntelliStudy" />
        </div>

        {/* Links principais */}
        <ul className={`nav-links ${menuOpen ? "open" : ""}`}>
          <li>
            <Link className="nav-link" to="/inicio" onClick={closeMenu}>
              Início
            </Link>
          </li>
          <li>
            <Link className="nav-link" to="/sobre" onClick={closeMenu}>
              Sobre
            </Link>
          </li>
          <li>
            <Link className="nav-link" to="/contato" onClick={closeMenu}>
              Contato
            </Link>
          </li>
          <li>
            <a className="nav-link" href="#termos" onClick={closeMenu}>
              Termos de Uso
            </a>
          </li>



          <div className="auth-buttons mobile-only">
            <Link to="/login" className="btn-login" onClick={closeMenu}>
              Entrar
            </Link>
            <Link to="/registro" className="btn-register" onClick={closeMenu}>
              Criar Conta
            </Link>
          </div>
        </ul>

        {/* Botões desktop */}
        <div className="auth-buttons desktop-only">
          <Link to="/login" className="btn-login">
            Entrar
          </Link>
          <Link to="/registro" className="btn-register">
            Criar Conta
          </Link>
        </div>

        {/* Ícone hambúrguer */}
        <div className="menu-toggle" onClick={toggleMenu}>
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </div>
      </nav>
    </header>
  );
};

export default NavigationSite;
