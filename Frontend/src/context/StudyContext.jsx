import { createContext, useState, useContext } from 'react';
const StudyContext = createContext();

// 2. Cria o "Provedor" do contexto. É ele que vai guardar os dados.
export function StudyProvider({ children }) {
    const [resumoGerado, setResumoGerado] = useState(null);
    const [simuladoGerado, setSimuladoGerado] = useState(null);
    const [quiz, setQuiz] = useState([]);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
    const [topicoInicial, setTopicoInicial] = useState('');

    const iniciarEstudoComTopico = (topico) => {
        setTopicoInicial(topico);
        setResumoGerado(null);
        setSimuladoGerado(null);
        setQuiz([]);
    };

    const value = {
        resumoGerado,
        setResumoGerado,
        simuladoGerado,
        setSimuladoGerado,
        quiz,
        setQuiz,
        isGeneratingSummary,
        setIsGeneratingSummary,
        isGeneratingQuiz,
        setIsGeneratingQuiz,
        topicoInicial,
        setTopicoInicial,
        iniciarEstudoComTopico
    };

    return (
        <StudyContext.Provider value={value}>
            {children}
        </StudyContext.Provider>
    );
}

export const useStudy = () => {
  const context = useContext(StudyContext);
  if (context === undefined) {
    throw new Error('useStudy must be used within a StudyProvider');
  }
  return context;
};