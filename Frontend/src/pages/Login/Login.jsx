import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NavigationSite from '../../components/Layout/NavigationSite/NavigationSite';
import { API_URL } from '../../../config';
import './Login.scss';
import { Book, Brain, Target, FlaskConical, Lightbulb, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // --- Modal para atualizar senha ---
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [modalMensagem, setModalMensagem] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMensagem("Entrando...");

    try {
      const response = await fetch(`${API_URL}/api/User/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);

        // Se o backend indicar que precisa atualizar senha
        if (data.requiresPasswordUpdate) {
          setShowPasswordModal(true);
        } else {
          navigate("/dashboard");
        }
      } else {
        setMensagem("Erro: " + data.message || "Email ou senha incorretos.");
      }
    } catch (err) {
      setMensagem("Erro de conexão com o servidor. Tente novamente.");
    }
  };

  const handleUpdatePassword = async () => {
    setModalMensagem("Atualizando senha...");
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/User/update-password`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword: password, newPassword }),
      });

      if (response.ok) {
        setShowPasswordModal(false);
        setMensagem("Senha atualizada com sucesso! Faça login novamente.");
        setPassword(""); // Limpa senha antiga
      } else {
        const error = await response.text();
        setModalMensagem("Erro: " + error);
      }
    } catch (err) {
      setModalMensagem("Erro de conexão. Tente novamente.");
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

          <div className="form-group password-group">
            <label htmlFor="password">Senha</label>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
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

      {/* --- Modal simples para atualizar senha --- */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Estamos atualizando nossa segurança</h3>
            <p>Por questões de segurança, confirme sua senha.</p>
            <input
              type="password"
              placeholder="Nova senha"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            {modalMensagem && <p className="modal-message">{modalMensagem}</p>}
            <button onClick={handleUpdatePassword}>Atualizar senha</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
