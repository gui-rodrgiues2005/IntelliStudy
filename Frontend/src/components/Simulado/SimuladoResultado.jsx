import React from "react";


export default function SimuladoResultado({ simulado }) {
  const { score, quiz } = simulado;

  if (score === null) return null;

  const total = quiz.length;
  const acertos = Math.round((score / 100) * total);
  const erros = total - acertos;

  return (
    <div className="final-result-card">
      <div className="result-header">
        <div className="result-icon">🏆</div>
        <h3>Simulado Concluído!</h3>
        <p>Confira seu desempenho abaixo</p>
      </div>

      <div className="result-stats">
        <div className="stat-item">
          <span className="stat-label">APROVEITAMENTO</span>
          <span className="stat-value blue">{score.toFixed(0)}%</span>
        </div>

        <div className="stat-item">
          <span className="stat-label">ACERTOS</span>
          <span className="stat-value green">{acertos}</span>
        </div>

        <div className="stat-item">
          <span className="stat-label">ERROS</span>
          <span className="stat-value red">{erros}</span>
        </div>
      </div>
    </div>
  );
}
