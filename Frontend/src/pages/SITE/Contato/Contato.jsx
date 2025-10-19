import React from "react";
import { useForm, ValidationError } from "@formspree/react";
import { useNavigate } from 'react-router-dom'
import NavigationSite from '../../../components/Layout/NavigationSite/NavigationSite'
import Footer from '../../../components/Layout/Footer/Footer'
import './Contato.scss';

// Importe uma imagem para o lado (pode ser uma ilustração de feedback/ideias)
import Ilustracao from '../../../assets/ilustracao_contato.jpg';

function Contato() {
  const [state, handleSubmit] = useForm("xkgqyynb");
  const navigate = useNavigate();

  const handlePlataform = () => {
    navigate('/login')
  }

  const handleSite = () => {
    navigate('/')
  }

  if (state.succeeded) {
    return (
      <div className="contato-success-wrapper">
        <NavigationSite />
        <div className="success-message">
          <div className="success-content">
            <div className="success-icon">💫</div>
            <h3>Ideia Registrada!</h3>
            <p>Obrigado por contribuir! Sua sugestão é muito valiosa para melhorarmos a plataforma.</p>
            
            <div className="success-actions">
              <button className="btn-primary" onClick={handlePlataform}>
                🚀 Entrar na plataforma
              </button>
              <button className="btn-secondary" onClick={handleSite}>
                ↩️ Voltar para o site
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="contato-wrapper">
      <NavigationSite />
      
      <div className="contato-hero">
        <div className="contato-container">
          <div className="contato-content">
            <div className="contato-header">
              <div className="header-badge">
                <span>💡 Sua Opinião é Importante</span>
              </div>
              <h1>Contribua com suas <span>ideias</span></h1>
              <p>
                Tem alguma sugestão, dúvida ou funcionalidade que gostaria de ver no IntelliStudy?
                Compartilhe sua ideia e me ajude a melhorar a plataforma!
              </p>
            </div>

            <form onSubmit={handleSubmit} className="contato-form">
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  📧 Seu Email
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="seu@email.com"
                  required
                  className="form-input"
                  disabled={state.submitting}
                />
                <ValidationError
                  prefix="Email"
                  field="email"
                  errors={state.errors}
                  className="validation-error"
                />
              </div>

              <div className="form-group">
                <label htmlFor="message" className="form-label">
                  ✏️ Sua Mensagem
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows="6"
                  placeholder="Conte-me sua ideia, sugestão ou dúvida... 
Ex: Gostaria de ver uma funcionalidade para...
Tenho uma ideia para melhorar..."
                  required
                  className="form-textarea"
                  disabled={state.submitting}
                />
                <ValidationError
                  prefix="Message"
                  field="message"
                  errors={state.errors}
                  className="validation-error"
                />
              </div>

              <button
                type="submit"
                disabled={state.submitting}
                className={`submit-button ${state.submitting ? 'loading' : ''}`}
              >
                {state.submitting ? (
                  <>
                    <div className="button-spinner"></div>
                    Enviando sua ideia...
                  </>
                ) : (
                  <>
                    <span className="button-icon">🚀</span>
                    Enviar Minha Ideia
                  </>
                )}
              </button>
            </form>

            <div className="contato-footer">
              <div className="footer-note">
                <span>💌</span>
                <p>Prometo ler cada mensagem pessoalmente e responder o mais breve possível!</p>
              </div>
            </div>
          </div>

          <div className="contato-visual">
            <div className="visual-container">
              <div className="illustration-wrapper">
                <img src={Ilustracao} alt="ilustração" className="ilustracao_contato"></img>
                <div className="visual-text">
                  <h3>Sua voz molda o futuro do IntelliStudy</h3>
                  <p>Cada sugestão me ajuda a criar uma plataforma melhor para todos os estudantes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

export default Contato;