import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./AuthLogin.scss";

const AutoLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const { exp } = jwtDecode(token);
      const now = Date.now() / 1000;
      const publicRoutes = ["/", "/login", "/registro"];
      const isPublic = publicRoutes.includes(location.pathname);

      if (exp > now && isPublic) {
        setLoading(true);

        // Animação de saída mais suave
        setTimeout(() => setFadeOut(true), 1800);

        // Redirecionamento após animação completa
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 2200);
      }
    } catch (err) {
      console.error("Erro ao decodificar token:", err);
    }
  }, [navigate, location]);

  if (!loading) return null;

  return (
    <div className={`auto-login-overlay ${fadeOut ? 'fade-out' : ''}`}>
      <div className="auto-login-card">
        <div className="auto-login-icon"></div>
        
        <h2 className="auto-login-title">
          Conta Encontrada!
        </h2>
        
        <p className="auto-login-text">
          Estamos redirecionando você para a plataforma de estudos...
        </p>
        
        <div className="auto-login-loader">
          <div className="progress-loader">
            <div className="progress-fill"></div>
          </div>
          
          <div className="loader-dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
          
          <div className="loader-text">
            Preparando seu ambiente de aprendizado...
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoLogin;