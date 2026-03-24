export default function SimuladoQuestoes({ simulado }) {
    const {
        quiz,
        userAnswers,
        score,
        setUserAnswers,
        isGeneratingQuiz,
        handleSubmitQuiz
    } = simulado;

    const handleAnswerSelect = (questaoIndex, alternativaIndex) => {
        setUserAnswers(prev => ({
            ...prev,
            [questaoIndex]: alternativaIndex
        }));
    };

    if (isGeneratingQuiz) {
        return (
            <div className="questoes-container">
                <div className="questoes-loading">
                    <div className="loading-spinner"></div>
                    <div className="loading-text">Gerando seu simulado</div>
                </div>
            </div>
        );
    }

    if (!quiz || quiz.length === 0) return null;

    return (
        <div className="questoes-container">
            <div className="questoes-list">
                {quiz.map((questao, questaoIndex) => {
                    const userAnswer = userAnswers[questaoIndex];
                    const correctAnswer = questao.alternativas.indexOf(questao.respostaCorreta);

                    const isFinished = score !== null;

                    return (
                        <div key={questaoIndex} className="questao-item">
                            <h3 className="questao-enunciado">
                                {questaoIndex + 1}. {questao.pergunta}
                            </h3>

                            <div className="alternativas-list">
                                {questao.alternativas.map((alternativa, altIndex) => {
                                    const letra = String.fromCharCode(65 + altIndex);
                                    const isSelected = userAnswer === altIndex;
                                    const isCorrect = altIndex === correctAnswer;

                                    let status = "";
                                    if (isFinished) {
                                        if (isSelected && isCorrect) status = "✔️ Acertou!";
                                        else if (isSelected && !isCorrect) status = "❌ Errou!";
                                        else if (!isSelected && isCorrect) status = "✔️ Correta";
                                    }

                                    return (
                                        <div
                                            key={altIndex}
                                            className={`alternativa-item 
                                    ${isSelected ? "selected" : ""} 
                                    ${isFinished && isCorrect ? "correta" : ""}
                                    ${isFinished && isSelected && !isCorrect ? "errada" : ""}
                                `}
                                            onClick={() => !isFinished && handleAnswerSelect(questaoIndex, altIndex)}
                                        >
                                            <span className="alternativa-letra">{letra}</span>
                                            <span className="alternativa-texto">{alternativa}</span>

                                            {status && (
                                                <span className="alternativa-status">
                                                    <strong>{status}</strong>
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            <button className="btn-finalizar" onClick={handleSubmitQuiz}>
                Finalizar Simulado
            </button>
        </div>
    );
}
