import React, { useState, useEffect } from 'react';
import { loadStripe } from "@stripe/stripe-js";
import { Check, X, Star, Crown, Zap } from 'lucide-react';
import { API_URL } from '../../../config';
import './PricingPage.scss';
import { toast } from 'react-toastify';

const PricingPage = () => {
    const [showModal, setShowModal] = useState(false);
    const [cpf, setCpf] = useState('');
    const [telefone, setTelefone] = useState('');
    const [usuarioCarregado, setUsuarioCarregado] = useState(false);
    const [plano, setPlano] = useState('Gratuito');
    const [ultimoPagamento, setUltimoPagamento] = useState(null);
    const token = localStorage.getItem('token');
    const stripePromise = loadStripe("pk_live_51SMXVsDqJgnRbRyfDQ9I407VCxFu17n8fCE05ECZ1enEz6AdMy4MuGnzM6hgWeNjHCdx1XI0BYCwEzSoK0URFuNb00QBsgadsz");

    useEffect(() => {
        const carregarDadosUsuario = async () => {
            if (!token) return;
            try {
                const response = await fetch(`${API_URL}/api/User/meus-dados`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!response.ok) return;

                const data = await response.json();
                setCpf(data.cpf || '');
                setTelefone(data.telefone || '');
                setPlano(data.plano || 'Gratuito');
                setUltimoPagamento(data.ultimoPagamento ? new Date(data.ultimoPagamento) : null);
                setUsuarioCarregado(true);
            } catch (e) {
                // console.error('Erro ao carregar dados do usuário:', e);
            }
        };

        carregarDadosUsuario();
    }, [token]);



    useEffect(() => {
        const confirmarPagamento = async () => {
            const sessionId = new URLSearchParams(window.location.search).get("session_id");
            if (!sessionId) return; // Nenhum session_id na URL, sai do efeito

            try {
                const response = await fetch(`${API_URL}/api/Pagamento/confirmar-session`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ sessionId })
                });

                if (!response.ok) {
                    throw new Error("Erro ao confirmar pagamento");
                }

                const data = await response.json();
                toast.success("Pagamento confirmado com sucesso!");
                console.log("Dados do pagamento:", data);

                // Recarregar dados do usuário após confirmação
                const carregarDadosUsuario = async () => {
                    if (!token) return;
                    try {
                        const response = await fetch(`${API_URL}/api/User/meus-dados`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (!response.ok) return;

                        const data = await response.json();
                        setCpf(data.cpf || '');
                        setTelefone(data.telefone || '');
                        setPlano(data.plano || 'Gratuito');
                        setUltimoPagamento(data.ultimoPagamento ? new Date(data.ultimoPagamento) : null);
                        setUsuarioCarregado(true);
                    } catch (e) {
                        // console.error('Erro ao carregar dados do usuário:', e);
                    }
                };

                await carregarDadosUsuario();
            } catch (err) {
                console.error(err);
                toast.error("Não foi possível confirmar o pagamento.");
            }
        };

        confirmarPagamento();
    }, [token]);


    const handleUpgradeClick = () => {
        if (plano === 'Premium') {
            toast.info('Você já possui o plano Premium!');
            return;
        }

        if (!cpf || !telefone) {
            setShowModal(true);
        } else {
            iniciarPagamento();
        }
    };

    // --- 3️⃣ Salvar dados do usuário e iniciar pagamento ---
    const handleSalvarDados = async () => {
        if (!cpf || !telefone) {
            toast.info('Por favor, preencha todos os campos.');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/User/atualizar-dados`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ cpf, telefone })
            });

            if (!response.ok) {
                const errorText = await response.text();
                alert('Erro ao salvar dados: ' + errorText);
                return;
            }

            // console.log('✅ Dados salvos com sucesso!');
            setShowModal(false);

            // Após salvar os dados, iniciar pagamento
            await iniciarPagamento();
        } catch (e) {
            console.error('Erro inesperado ao salvar dados:', e);
            alert('Erro inesperado ao salvar dados: ' + e.message);
        }
    };

    async function handlePagamento(valor) {
        try {
            console.log("[LOG] Iniciando handlePagamento com valor:", valor);

            // Obter dados do usuário para incluir UserId
            console.log("[LOG] Obtendo dados do usuário...");
            const userResponse = await fetch(`${API_URL}/api/User/meus-dados`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!userResponse.ok) {
                const errorText = await userResponse.text();
                console.error("[ERROR] Erro ao obter dados do usuário:", errorText);
                throw new Error("Erro ao obter dados do usuário");
            }
            const userData = await userResponse.json();
            console.log("[LOG] Dados do usuário obtidos:", userData);

            console.log("[LOG] Criando checkout no backend...");
            const res = await fetch(`${API_URL}/api/Pagamento/criar-checkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: userData.id, valor })
            });

            console.log("[LOG] Resposta do backend - Status:", res.status);
            if (!res.ok) {
                const text = await res.text();
                console.error("[ERROR] Erro no servidor:", text);
                throw new Error(`Erro no servidor: ${text}`);
            }

            const data = await res.json();
            console.log("[LOG] Dados recebidos do backend:", data);

            const stripe = await stripePromise;
            console.log("[LOG] Redirecionando para Stripe Checkout...");
            await stripe.redirectToCheckout({ sessionId: data.sessionId });

        } catch (err) {
            console.error("Erro ao criar checkout:", err);
            toast.error("Não foi possível iniciar o pagamento.");
        }
    }

    const iniciarPagamento = async () => {
        await handlePagamento(12);
    };


    return (
        <div className="pricing-container">
            <div className="pricing-header">
                <h1>Desbloqueie seu Potencial Máximo</h1>
                <p>Escolha o plano que se encaixa na sua jornada de aprendizado e acelere seus resultados.</p>
            </div>

            <div className="pricing-grid">
                {/* --- PLANO GRATUITO --- */}
                <div className={`plan-card${plano === 'Gratuito' ? ' atual' : ''}`}>
                    {plano === 'Gratuito' && (
                        <span className="badge-atual">Plano Atual</span>
                    )}
                    <div className="plan-header">
                        <h3>Aprendiz</h3>
                        <p className="price">R$0<span>/mês</span></p>
                        <button className="plan-button disabled">Seu Plano Atual</button>
                    </div>
                    <ul className="features-list">
                        <li><Check size={18} className="check-icon" /> 3 Resumos por dia</li>
                        <li><Check size={18} className="check-icon" /> 3 Simulados por dia </li>
                        <li><Check size={18} className="check-icon" /> 1 Plano de Estudos por semana</li>
                        <li><Check size={18} className="check-icon" /> Conquistas da plataforma são limitadas</li>
                    </ul>
                </div>

                {/* --- PLANO PREMIUM --- */}
                <div className={`plan-card premium${plano === 'Premium' || plano === 'Mestre' ? ' atual' : ''}`}>
                    {(plano === 'Premium' || plano === 'Mestre') && (
                        <span className="badge-atual">Plano Atual Ativo</span>
                    )}
                    <div className="premium-badge">
                        <Star size={14} /> POPULAR
                    </div>
                    <div className="plan-header">
                        <h3>Mestre</h3>
                        <p className="price">R$12<span>/mês</span></p>
                        <button
                            className="plan-button premium-button"
                            onClick={() => handlePagamento(12)}
                        >
                            <Zap size={16} /> Fazer Upgrade Agora
                        </button>

                    </div>
                    <ul className="features-list">
                        <li><Check size={18} className="check-icon premium-check" /> Tudo no plano Aprendiz, e mais:</li>
                        <li className="premium-feature"><Crown size={18} /> Resumos e Simulados Ilimitados</li>
                        <li className="premium-feature"><Crown size={18} /> Planos de Estudo Ilimitados</li>
                        <li className="premium-feature"><Crown size={18} /> Simulados com até 20 questões</li>
                        <li className="premium-feature"><Crown size={18} /> Desbloqueie todas as Conquistas</li>
                        <li className="premium-feature"><Crown size={18} /> Experiência única</li>
                        {/* <li className="premium-feature"><Crown size={18} /> Exporte seus resumos (PDF/DOCX)</li> */}
                    </ul>
                </div>
            </div>

            {/* --- MODAL --- */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>Complete seus dados</h2>
                        <p>Precisamos de algumas informações antes de continuar com o pagamento.</p>

                        <label>CPF</label>
                        <input
                            type="text"
                            value={cpf}
                            onChange={(e) => setCpf(e.target.value)}
                            placeholder="Digite seu CPF"
                            maxLength={14}
                        />


                        <label>Telefone</label>
                        <input
                            type="text"
                            value={telefone}
                            onChange={(e) => setTelefone(e.target.value)}
                            placeholder="(00) 00000-0000"
                        />

                        <div className="modal-buttons">
                            <button className="cancel-button" onClick={() => setShowModal(false)}>Cancelar</button>
                            <button className="save-button" onClick={handleSalvarDados}>Salvar e Continuar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PricingPage;
