import React, { useState, useEffect } from 'react';
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

    // --- Carregar dados do usuário incluindo plano ---
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

    const iniciarPagamento = async () => {
        try {
            const response = await fetch(`${API_URL}/api/Pagamento/gerar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    valor: 0.1,
                    descricao: 'Plano Mestre'
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                toast.error('Erro ao gerar pagamento, tente novamente mais tarde: ' + errorText);
                setShowModal(true);
                return;
            }

            const data = await response.json();

            if (data.qrcodeUrl) {
                window.location.href = "/pagamentoPix";
            } else if (data.pixCopiaECola) {
                toast.info('Use este código Pix para pagar: ' + data.pixCopiaECola);
            } else {
                toast.info('Erro: dados de pagamento inválidos.');
            }
        } catch (e) {
            console.error('Erro inesperado ao iniciar pagamento:', e);
            toast.info('Erro inesperado ao iniciar pagamento: ' + e.message);
            setShowModal(true); // abre modal em caso de erro
        }
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
                        <li><Check size={18} className="check-icon" /> 5 Resumos por dia</li>
                        <li><Check size={18} className="check-icon" /> 5 Simulados por dia (5 questões)</li>
                        <li><Check size={18} className="check-icon" /> 1 Plano de Estudos por semana</li>
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
                        <button className="plan-button premium-button" onClick={handleUpgradeClick}>
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
