import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../../../config';
import './Login.scss';
import { Eye, EyeOff, MoveLeft } from 'lucide-react';
import imagemIlustration from '../../assets/ilustracao_login.jpg';
import Logo from '../../assets/logo.png';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // --- Modal para atualizar senha ---
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [modalMensagem, setModalMensagem] = useState("");
  const [userId, setUserId] = useState(null);

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

      // Se a resposta vier, tenta ler o JSON
      const data = await response.json().catch(() => ({}));

      // --- CASO O BACKEND RETORNE requiresPasswordUpdate ---
      if (response.ok && data.requiresPasswordUpdate) {
        setShowPasswordModal(true);
        setMensagem(data.message);
        return;
      }

      // --- LOGIN NORMAL ---
      if (response.ok && data.token) {
        localStorage.setItem("token", data.token);
        navigate("/dashboard");
      } else {
        setMensagem(data.message || "Email ou senha incorretos.");
      }

    } catch (err) {
      console.warn("Erro de conexão (provável hash antigo):", err);
      setMensagem("Erro de conexão com o servidor.");

      // ⚡ dispara modal de redefinição de senha
      setShowPasswordModal(true);
      setModalMensagem("Precisamos atualizar sua senha por motivos de segurança.");
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

  const handleNavigateSite = () => {
    navigate('/')
  }

  return (
    <div className="auth-container">
      <div className='imagem-container'>
        <img src={imagemIlustration} alt='Ilustração'></img>
      </div>

      <div className="auth-card">
        <button className='voltar-site' onClick={handleNavigateSite}><MoveLeft /></button>
        <div className="auth-header">
          <img src={Logo} alt='IntelliStudy Logo' className="brand-name"></img>
          <h2>Bem-vindo de volta!</h2>
          <p>Continue sua jornada de aprendizado.</p>
          <p className="order-by">OrderBY <strong>IdeiaFish</strong></p>
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

        <p className="boas-vindas">
          Obrigado por confiar na <strong>IntelliStudy</strong>! Esta plataforma é dedicada exclusivamente a estudos educacionais e profissionais.
        </p>
      </div>

      {/* {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Atualização de segurança</h3>
            <p>{modalMensagem || mensagem}</p>

            <div className="form-group">
              <label htmlFor="newPassword">Nova senha</label>
              <input
                type="password"
                id="newPassword"
                placeholder="Digite uma nova senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <button
              onClick={async () => {
                setModalMensagem("Atualizando senha...");

                try {
                  const response = await fetch(`${API_URL}/api/User/update-password`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      email,
                      oldPassword: password,
                      newPassword
                    }),
                  });

                  if (response.ok) {
                    setModalMensagem("Senha atualizada com sucesso! Agora faça login novamente.");
                    setTimeout(() => {
                      setShowPasswordModal(false);
                      setNewPassword("");
                      setMensagem("");
                    }, 3000);
                  } else {
                    const errorText = await response.text();
                    setModalMensagem("Erro: " + errorText);
                  }
                } catch (error) {
                  setModalMensagem("Erro ao atualizar. Tente novamente.");
                }
              }}
            >
              Atualizar senha
            </button>
          </div>
        </div>
      )} */}

    </div>
  );
};

export default Login;
