import { useState } from "react";
import { API_URL } from "../../config";

export function useIAChatAPI() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const getToken = () => localStorage.getItem("token");

    // Carregar todo o chat salvo
    const fetchHistorico = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${API_URL}/api/Resumo/chat/historico`, {
                headers: {
                    "Authorization": `Bearer ${getToken()}`
                }
            });

            if (!response.ok) throw new Error("Erro ao carregar histórico");

            return await response.json();
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    // Enviar pergunta e receber resposta
    const sendMensagem = async (pergunta) => {
        try {
            setIsLoading(true);

            const response = await fetch(`${API_URL}/api/Resumo/chat/enviar`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${getToken()}`
                },
                body: JSON.stringify({ pergunta })
            });

            if (!response.ok) throw new Error("Erro ao enviar mensagem");

            return await response.json();
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isLoading,
        error,
        fetchHistorico,
        sendMensagem
    };
}
