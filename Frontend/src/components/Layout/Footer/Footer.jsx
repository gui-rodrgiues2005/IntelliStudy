import React from "react";
import { Twitter, Instagram, Linkedin, Mail } from "lucide-react";
import Logo from "../../../assets/logo.svg";
import "./Footer.scss";

const Footer = () => {
  return (
    <footer className="footer" id="termos">
      <div className="footer__content">
        {/* --- COLUNA 1 --- */}
        <div className="footer__brand">
          <img src={Logo} alt="IntelliStudy Logo" className="footer__logo" />
          <p>
            Sua plataforma de estudos com IA. Resumos inteligentes, simulados
            personalizados e planos de estudo otimizados.
          </p>
        </div>

        {/* --- COLUNA 2 --- */}
        <div className="footer__links">
          <h4>Produto</h4>
          <ul>
            <li><a href="/login">Plataforma</a></li>
            <li><a href="/inicio">Inicio</a></li>
            <li><a href="/sobre">Sobre</a></li>
          </ul>
        </div>

        {/* --- COLUNA 3 --- */}
        <div className="footer__links">
          <h4>Legal</h4>
          <ul>
            <li><a href="/termos">Termos de Uso</a></li>
            <li><a href="/politica">Política de Privacidade</a></li>
            <li><a href="/contato">Contato</a></li>
          </ul>
        </div>

        {/* --- COLUNA 4 --- */}
        <div className="footer__social">
          <h4>Conecte-se</h4>
          <div className="footer__icons">
            <a
              href="https://www.instagram.com/guilherme_rodriguess01?igsh=MTB5M2Nud2Y1enYzbg=="
              target="_blank"
              rel="noopener noreferrer"
            >
              <Instagram size={20} />
            </a>

            <a
              href="https://www.linkedin.com/in/guilherme-rodrigues-costa-a39a15268"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Linkedin size={20} />
            </a>
          </div>

          <p className="footer__email">
            <Mail size={18} /> rodriguesguidev@gmail.com
          </p>
        </div>
      </div>

      <div className="footer__bottom">
        <p>© 2025 IntelliStudy. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;
