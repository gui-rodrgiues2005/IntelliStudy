import React from 'react';
import './TipoModal.scss';

const TipoModal = ({ showOptions, setShowOptions, handleSelectTipo }) => {
    if (!showOptions) return null; // evita renderização desnecessária

    return (
        <div
            className="tipo-modal-overlay"
            onClick={() => setShowOptions(false)}
        >
            <div
                className="tipo-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <button className="close-btn" onClick={() => setShowOptions(false)}>
                    ✖
                </button>

                <h3>Escolha o formato</h3>

                {[ 
                    { label: "Criar um Resumo", value: "Resumo", icon: "📝" },
                    { label: "Uma Pergunta Direta", value: "PerguntaDireta", icon: "❓" },
                    { label: "Pesquisa Científica", value: "PesquisaCientifica", icon: "🔬" },
                    { label: "Estudar Para Prova", value: "EstudarParaProva", icon: "📚" }
                ].map((option) => (
                    <div
                        key={option.value}
                        className="tipo-item"
                        onClick={() => {
                            handleSelectTipo(option.value);
                            setShowOptions(false);
                        }}
                    >
                        <span className="tipo-icon">{option.icon}</span>
                        {option.label}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TipoModal;
