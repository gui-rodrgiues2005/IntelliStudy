import React from 'react'
import { useEffect, useState } from 'react';
import { API_URL } from '../../../config';
import { Sparkles } from 'lucide-react';
import './Saudacao.scss';


const Saudacao = () => {
    const [userName, setUserName] = useState('');

    useEffect(() => {
        const fetchUserName = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;

                const res = await fetch(`${API_URL}/api/Profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setUserName(data.nome);
                }
            } catch (error) {
                console.error("Falha ao buscar nome do usuário", error);
            }
        };

        fetchUserName();
    }, []);

    return (
        <div>
            <header className="profile-header-container">
                <div className="profile-header-text">
                    <h1 className="profile-header-title">
                        <Sparkles className="profile-header-icon" size={40}/>
                        Olá,<span className="profile-header-name">{userName || "Estudante"}</span>!
                    </h1>
                    <p className="profile-header-subtitle">
                        Pronto para começar uma nova sessão de estudos?
                    </p>
                </div>
            </header>
        </div>
    )
}

export default Saudacao
