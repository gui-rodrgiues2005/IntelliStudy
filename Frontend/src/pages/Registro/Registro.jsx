import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Registro.scss';
import { API_URL } from '../../../config';
// --- MUDANÇA 1: Importe os ícones de olho ---
import { Book, Brain, Target, FlaskConical, Lightbulb, Eye, EyeOff, MoveLeft } from 'lucide-react';
import Logo from '../../assets/logo.png';

const validarNome = (nome) => {
  const nomeLimpo = nome.trim();

  if (!nomeLimpo) return { valido: false, motivo: "O nome não pode estar vazio" };
  if (nomeLimpo.length < 2) return { valido: false, motivo: "O nome é muito curto" };
  if (nomeLimpo.length > 13) return { valido: false, motivo: "O nome é muito longo" };

  // Regex básico: letras, acentos, espaço, hífen e apóstrofo
  const regexValido = /^[A-Za-zÀ-ú0-9\s'-]+$/;
  if (!regexValido.test(nomeLimpo)) return { valido: false, motivo: "O nome contém caracteres inválidos ou emojis" };

  // Normaliza o nome para remover acentos e transformar em minúsculo
  const nomeNormalizado = nomeLimpo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const nomeSemEspacos = nomeNormalizado.replace(/\s/g, "");

  const palavrasProibidas = [
    "xxx", "porn", "porno", "sex", "sexo", "nude", "nudes", "boobs", "tetas", "peitos", "puta", "foda", "fuck", "shit", "bitch", "slut", "cock", "dick", "pussy", "ass", "boobies",
    "merda", "caralho", "cu", "burro", "idiota", "estupido", "imbecil", "otario", "babaca", "viado", "gayzinho", "gay", "retard", "bastard", "moron",
    "admin", "moderator", "mod", "staff", "god", "root", "null", "undefined", "test", "teste", "user", "guest", "anonymous", "anon", "bot", "robot",
    "noob", "hacker", "loli", "pedo", "pedophile", "pedofilo", "incest", "incestuoso", "kill", "murder", "terror", "fuckboy", "fuckgirl",
    "p0rn", "x0x", "s3x", "f0d4", "b1tch", "c0ck", "d1ck", "pu55y"
  ];

  for (const palavra of palavrasProibidas) {
    if (nomeSemEspacos.includes(palavra)) {
      return { valido: false, motivo: "O nome contém palavras proibidas" };
    }
  }

  // Bloquear repetições excessivas tipo "aaaaaa" ou "xxxx"
  if (/([a-zA-Z0-9])\1{2,}/.test(nomeSemEspacos)) {
    return { valido: false, motivo: "O nome contém repetições de caracteres inválidas" };
  }

  return { valido: true, motivo: "" };
};

const Registro = () => {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    const validacao = validarNome(nome);
    if (!validacao.valido) {
      setMensagem(validacao.motivo);
      return;
    }

    setMensagem("Criando sua conta...");

    try {
      const response = await fetch(`${API_URL}/api/User/register`, {
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

  const handleNavigateSite = () => {
    navigate('/');
  };

  return (
    <div className="registro-container">
      <div className="registro-card">
        <button className='voltar-site' onClick={handleNavigateSite}>
          <MoveLeft size={20} />
        </button>

        <div className="registro-header">
          <img src={Logo} alt='IntelliStudy Logo' className="brand-logo" />
          <h2>Crie sua Conta</h2>
          <p>Comece sua jornada rumo à maestria.</p>
        </div>

        <form onSubmit={handleRegister} className="registro-form">
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
            <div
              className="password-toggle-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </div>
          </div>

          {mensagem && (
            <p className={`registro-message ${mensagem.includes('sucesso') ? 'success' :
                mensagem.includes('Erro') ? 'error' : 'info'
              }`}>
              {mensagem}
            </p>
          )}

          <button type="submit" className="registro-button">
            Criar Conta
          </button>
        </form>

        <div className="registro-footer">
          <p>Já tem uma conta? <Link to="/login">Faça login</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Registro;
