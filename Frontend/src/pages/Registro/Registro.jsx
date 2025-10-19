import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NavigationSite from '../../components/Layout/NavigationSite/NavigationSite'
import '../Login/Login.scss';

// --- MUDANÇA 1: Importe os ícones de olho ---
import { Book, Brain, Target, FlaskConical, Lightbulb, Eye, EyeOff } from 'lucide-react';

const Registro = () => {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensagem, setMensagem] = useState("");
  const navigate = useNavigate();

  // --- MUDANÇA 2: Adicione o estado para visibilidade da senha ---
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setMensagem("Criando sua conta...");

    try {
      const response = await fetch("http://localhost:5051/api/User/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nome, email, password }),
      });

      if (response.ok) {
        setMensagem("Conta criada com sucesso! Redirecionando para o login...");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
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
      <NavigationSite/>
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
          <h1 className="brand-name">StudyAI</h1>
          <h2>Crie sua Conta</h2>
          <p>Comece sua jornada rumo à maestria.</p>
        </div>

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="name">Nome</label>
            <input
              type="text"
              id="name"
              placeholder="Como podemos te chamar?"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>
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
              type={showPassword ? "text" : "password"}
              id="password"
              placeholder="Crie uma senha forte"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </div>
          </div>
          {mensagem && <p className="auth-message">{mensagem}</p>}
          <button type="submit" className="auth-button">Criar Conta</button>
        </form>

        <div className="auth-footer">
          <p>Já tem uma conta? <Link to="/login">Faça login</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Registro;
