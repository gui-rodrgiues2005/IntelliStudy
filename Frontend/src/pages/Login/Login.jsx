import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NavigationSite from '../../components/Layout/NavigationSite/NavigationSite'
import './Login.scss';

// --- MUDANÇA 1: Importe os ícones de olho ---
import { Book, Brain, Target, FlaskConical, Lightbulb, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensagem, setMensagem] = useState("");
  const navigate = useNavigate();

  // --- MUDANÇA 2: Adicione o estado para visibilidade da senha ---
  const [showPassword, setShowPassword] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || "https://backend-production-69f3.up.railway.app";
;

  const handleLogin = async (e) => {
    e.preventDefault();
    setMensagem("Entrando...");

    try {
      const response = await fetch(`${API_URL}/api/User/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("token", data.token);
        navigate("/dashboard");
      } else {
        const error = await response.text();
        setMensagem("Erro: " + error);
      }
    } catch (err) {
      setMensagem("Erro de conexão com o servidor. Tente novamente.");
    }
  };

  return (
    <div className="auth-container">
      <NavigationSite />
      <div className="aurora-background">
        <div className="aurora-blob blob-1"></div>
        <div className="aurora-blob blob-2"></div>
        <div className="aurora-blob blob-3"></div>
      </div>

      <div className="floating-elements">
        <Book className="float-icon icon-1" size={48} />
        <Brain className="float-icon icon-2" size={64} />
        <Target className="float-icon icon-3" size={40} />
        <FlaskConical className="float-icon icon-4" size={56} />
        <Lightbulb className="float-icon icon-5" size={44} />
      </div>

      <div className="auth-card">
        <div className="auth-header">
          <h1 className="brand-name">IntelliStudy</h1>
          <h2>Bem-vindo de volta!</h2>
          <p>Continue sua jornada de aprendizado.</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {/* --- MUDANÇA 3: Crie um wrapper para o campo de senha e o ícone --- */}
          <div className="form-group password-group">
            <label htmlFor="password">Senha</label>
            <input
              // O tipo do input agora depende do estado
              type={showPassword ? "text" : "password"}
              id="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {/* O ícone que alterna a visibilidade */}
            <div className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </div>
          </div>
          {mensagem && <p className="auth-message">{mensagem}</p>}
          <button type="submit" className="auth-button">Entrar</button>
        </form>

        <div className="auth-footer">
          <p>Não tem uma conta? <Link to="/registro">Crie uma agora</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
