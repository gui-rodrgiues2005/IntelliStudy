import React from 'react'
import NavigationSite from '../../../components/Layout/NavigationSite/NavigationSite'
import Footer from '../../../components/Layout/Footer/Footer';
import { useNavigate } from 'react-router-dom'
import ilustracao from '../../../assets/ilustracao.jpg'

import {
    Brain,
    Target,
    Calendar,
    Zap,
    Shield,
    LineChart,
    Check,
    X,
    Crown,
    Star,
} from "lucide-react";

import './Inicio.scss'

const features = [
    {
        icon: <Brain size={28} />,
        title: "Resumos Inteligentes",
        description: "IA analisa seu conteúdo e cria resumos otimizados para memorização eficiente.",
    },
    {
        icon: <Target size={28} />,
        title: "Simulados Personalizados",
        description: "Questões geradas automaticamente baseadas no seu nível e objetivos.",
    },
    {
        icon: <Calendar size={28} />,
        title: "Plano de Estudos",
        description: "Cronograma inteligente que se adapta à sua rotina e metas.",
    },
    {
        icon: <Zap size={28} />,
        title: "Aprendizado Rápido",
        description: "Técnicas comprovadas para acelerar sua absorção de conhecimento.",
    },
    {
        icon: <Shield size={28} />,
        title: "Dados Seguros",
        description: "Seus materiais e progresso protegidos com criptografia de ponta.",
    },
    {
        icon: <LineChart size={28} />,
        title: "Acompanhamento",
        description: "Analytics detalhado do seu desempenho e evolução.",
    },
];


const Inicio = () => {
    const navigate = useNavigate();

    const handlePlataform = () => {
        navigate('/login')
    }

    const handleSobre = () => {
        navigate('/sobre')
    }

    return (
        <div className='container-inicio'>
            <NavigationSite />
            <div className='inicio'>
                <div className='inicio-container'>
                    <div className='inicio-content'>
                        <h1>Sua <span>Jornada De Estudos</span> Guiada pela IA</h1>
                        <p>Transforme suas sessões de estudo com IA. Crie resumos inteligentes, faça simulados personalizados e siga um plano de estudos otimizado para seus objetivos.</p>
                        <div className='buttons-action'>
                            <button className='btn-primary' onClick={handlePlataform}>Comece Agora</button>
                            <button className='btn-secondary' onClick={handleSobre}>Quem somos nós ?</button>
                        </div>
                    </div>
                    <div className='inicio-image'>
                        <img src={ilustracao} alt='Ilustração de estudante usando tecnologia' />
                    </div>
                </div>
            </div>


            <div className="container-cards">
                <h1>Tudo que você precisa para estudar melhor</h1>
                <p>Ferramentas inteligentes que se adaptam ao seu jeito de aprender</p>

                <div className="cards">
                    {features.map((feature, index) => (
                        <div className="card" key={index}>
                            <div className="icon">{feature.icon}</div>
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="plano-upgrade-container">
                <h1>Comece Gratuitamente</h1>
                <p>Comece grátis e evolua quando precisar</p>

                <div className="upgrade-grid">
                    {/* --- PLANO GRÁTIS --- */}
                    <div className="upgrade-card free-tier">
                        <div className="upgrade-header">
                            <h3>Aprendiz</h3>
                            <p className="upgrade-price">
                                R$0<span>/mês</span>
                            </p>
                            <button className="upgrade-button disabled">Seu Plano Atual</button>
                        </div>
                        <ul className="upgrade-features">
                            <li><Check size={18} className="icon-check" /> 3 Resumos por dia</li>
                            <li><Check size={18} className="icon-check" /> 3 Simulados por dia (5 questões)</li>
                            <li><Check size={18} className="icon-check" /> 1 Plano de Estudos por semana</li>
                            <li className="feature-disabled"><X size={18} /> Acesso ao Ranking Global</li>
                            <li className="feature-disabled"><X size={18} /> Conquistas Premium</li>
                            <li className="feature-disabled"><X size={18} /> Histórico de Planos</li>
                            <li className="feature-disabled"><X size={18} /> Exportar Resumos</li>
                        </ul>
                    </div>

                    {/* --- PLANO PREMIUM --- */}
                    <div className="upgrade-card pro-tier">
                        <div className="badge-popular">
                            <Star size={14} /> PREMIUM
                        </div>
                        <div className="upgrade-header">
                            <h3>Mestre</h3>
                            <p className="upgrade-price">
                                R$12<span>/mês</span>
                            </p>
                            <button className="upgrade-button highlight" onClick={handlePlataform}>
                                <Zap size={16} /> Fazer Upgrade Agora
                            </button>
                        </div>
                        <ul className="upgrade-features">
                            <li><Check size={18} className="icon-check highlight-check" /> Tudo no plano Aprendiz, e mais:</li>
                            <li className="feature-pro"><Crown size={18} /> Resumos e Simulados Ilimitados</li>
                            <li className="feature-pro"><Crown size={18} /> Planos de Estudo Ilimitados</li>
                            <li className="feature-pro"><Crown size={18} /> Simulados com até 20 questões</li>
                            <li className="feature-pro"><Crown size={18} /> Acesso completo ao Ranking Global</li>
                            <li className="feature-pro"><Crown size={18} /> Desbloqueie todas as Conquistas</li>
                            <li className="feature-pro"><Crown size={18} /> Histórico Completo de Estudos</li>
                            <li className="feature-pro"><Crown size={18} /> Exporte seus resumos (PDF/DOCX)</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="card_action">
                <h2>Pronto para transformar seus estudos?</h2>
                <p>Junte-se a milhares de estudantes que já estão alcançando seus objetivos com o IntelliStudy.</p>
                <button className="btn-primary btn-lg" onClick={handlePlataform}>Criar Conta</button>
            </div>

            <Footer />
        </div>
    )
}

export default Inicio