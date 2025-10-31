import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./AuthLogin.scss";

const AutoLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showOverlay, setShowOverlay] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [remove, setRemove] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      const now = Date.now() / 1000;
      const publicRoutes = ["/", "/login", "/registro"];
      const isPublicRoute = publicRoutes.includes(location.pathname);

      if (decoded.exp <= now) {
        localStorage.removeItem("token");
        return;
      }

      if (isPublicRoute) {
        setShowOverlay(true);

        const fadeTimeout = setTimeout(() => setFadeOut(true), 1800);
        const navTimeout = setTimeout(() => {
          navigate("/dashboard", { replace: true });
          setRemove(true); // remove do DOM após o fade
        }, 2200);

        return () => {
          clearTimeout(fadeTimeout);
          clearTimeout(navTimeout);
        };
      }
    } catch (err) {
      localStorage.removeItem("token");
    }
  }, [navigate, location]);

  if (!showOverlay || remove) return null;
  
  return (
    <div className={`auto-login-overlay ${fadeOut ? "fade-out" : ""}`}>
      <div className="auto-login-card">
        <div className="auto-login-icon" />
        <h2 className="auto-login-title">Conta Encontrada!</h2>
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
          <div className="loader-text">Preparando seu ambiente de aprendizado...</div>
        </div>
      </div>
    </div>
  );
};

export default AutoLogin;
