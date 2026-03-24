import React, { useState } from "react";
import "./SimuladoConfig.scss";

export default function SimuladoConfig({ simulado }) {
  // 1) Impede crash
  if (!simulado) {
    return <div>Carregando simulado...</div>;
  }

  const { numQuestions, setNumQuestions, isGeneratingQuiz, handleGenerateQuiz, quiz } = simulado;

  return (
    <div className="simulado-config">
      <div className="config-header">
        <h2>Simulado Personalizado</h2>
        <p>Configure sua prova !</p>
      </div>

      <div className="config-content">
        <div className="quantity-section">
          <label className="quantity-label">Quantidade de questões {numQuestions}</label>
          <div className="slider-container">
            <input
              type="range"
              className="question-slider"
              min="2"
              max="20"
              value={numQuestions}
              onChange={(e) => setNumQuestions(parseInt(e.target.value))}
            />
            <div className="slider-labels">
              <span>2</span>
              <span>20</span>
            </div>
          </div>
        </div>

        <button
          className={`btn-gerar ${isGeneratingQuiz ? 'generating' : ''}`}
          onClick={handleGenerateQuiz}
          disabled={isGeneratingQuiz}
        >
          {isGeneratingQuiz
            ? "Gerando..."
            : quiz?.length > 0
              ? "Novo Simulado"
              : "Gerar Simulado"}
        </button>
      </div>
    </div>
  );
}