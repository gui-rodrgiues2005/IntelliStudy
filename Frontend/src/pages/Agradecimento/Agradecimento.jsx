import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Brain, ArrowRight } from "lucide-react";
import "./Agradecimento.scss";

const AgradecimentoPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="thanks-container">
      <div className="thanks-card">
        <div className="thanks-icon">
          <Brain size={64} />
        </div>

        <h1>Obrigado pela confiança!</h1>
        <p>
          Sua compra foi concluída com sucesso. <br />
          Esperamos que tenha uma experiência incrível com a <strong>IntelliStudy</strong> —
          sua plataforma de estudos com <span>Inteligência Artificial</span>.
        </p>

        <button className="thanks-button" onClick={() => navigate("/dashboard")}>
          Voltar à Plataforma <ArrowRight size={18} />
        </button>

        <div className="thanks-footer">
          <Sparkles size={16} />
          <span>Continue aprendendo e evoluindo com a ajuda da IA 💡</span>
        </div>
      </div>
    </div>
  );
};

export default AgradecimentoPage;
