import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useSimulado from "../../hooks/useSimulado";
import SimuladoConfig from "../../components/Simulado/SimuladoConfig";
import SimuladoQuestoes from "../../components/Simulado/SimuladoQuestoes";
import SimuladoResultado from "../../components/Simulado/SimuladoResultado";
import ButtonVoltar from "../../components/Simulado/ButtonVoltar"
import SuspenseCorrigindo from "../../components/Simulado/SuspenseCorrigindo";
import './CriarSimulado.scss';

export default function CriarSimulado() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const containerRef = useRef(null);

    useEffect(() => {
        if (!state) {
            navigate("/dashboard", { replace: true });
        }
    }, [state]);

    // 2) Enquanto redireciona, não renderiza nada
    if (!state) return null;

    // 3) Agora sim, está seguro extrair
    const resumoGerado = state.resumoGerado;
    const isResumoDeArquivo = state.isResumoDeArquivo;

    // 4) Garante que o objeto realmente existe
    if (!resumoGerado) {
        console.log("❌ resumoGerado veio undefined!");
        navigate("/dashboard", { replace: true });
        return null;
    }

    const simulado = useSimulado(resumoGerado, isResumoDeArquivo);
    if (!simulado) {
        return <div>Carregando simulado...</div>;
    }

    // Efeito para scroll automático quando o simulado é finalizado
    useEffect(() => {
        if (!simulado.isFinishing && simulado.score !== null) {
            // Scroll instantâneo para o topo
            if (containerRef.current) {
                containerRef.current.scrollTop = 0;
            }
        }
    }, [simulado.isFinishing, simulado.score]);

    const handleOpenConteudo = () => {
        navigate("/dashboard")
    };

    return (
        <div className="simulado-page">
            <div className="simulado-container" ref={containerRef}>
                <div className="simulado-content">
                    <header className="simulado-header-container">
                        <div className="simulado-header-text">
                            <h1 className="simulado-header-title">
                                Vamos colocar todo conhecimento em ação !
                            </h1>
                            <p className="simulado-header-subtitle">
                                Coloque em prática, todo conteúdo estudado
                            </p>
                        </div>
                    </header>
                    <ButtonVoltar onClick={handleOpenConteudo} />
                    <SimuladoConfig simulado={simulado} />

                    {simulado.isFinishing && (
                        <SuspenseCorrigindo />
                    )}

                    {!simulado.isFinishing && simulado.score !== null && (
                        <SimuladoResultado simulado={simulado} />
                    )}

                    {/* 👉 Sempre mostrar as questões, mesmo finalizado */}
                    {!simulado.isFinishing && (
                        <SimuladoQuestoes simulado={simulado} />
                    )}
                </div>
            </div>
        </div>
    );
}