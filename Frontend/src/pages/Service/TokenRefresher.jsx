import { useEffect, useState } from "react";
import axios from "axios";
import { Navigate } from "react-router-dom";
import { API_URL } from '../../../config';

export const TokenRefresher = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const refresh = async () => {
            try {
                const token = localStorage.getItem("token");
                const refreshToken = localStorage.getItem("refreshToken");

                const response = await axios.post(`${API_URL}/api/User/refresh-token`, {
                    token,
                    refreshToken,
                });

                localStorage.setItem("token", response.data.token);
                localStorage.setItem("refreshToken", response.data.refreshToken);
                setAuthorized(true);
            } catch (err) {
                console.error("Erro ao renovar token:", err);
                setAuthorized(false);
            } finally {
                setLoading(false);
            }
        };

        refresh();
    }, []);

    if (loading) return < p > Verificando sessão...</ p >;
    if (!authorized) return < Navigate to="/login" />;

    return children;
};
