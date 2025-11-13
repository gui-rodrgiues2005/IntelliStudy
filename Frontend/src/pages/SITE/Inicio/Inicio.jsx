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
    TrendingUp,
    SunSnow
} from "lucide-react";

import './Inicio.scss'

const features = [
    {
        icon: <Brain size={28} />,
        title: "Resumos, Pesquisas e tudo direto ao ponto",
        description: "IA analisa seu conteúdo e cria oque você precisa de forma otimizada para memorização eficiente.",
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
                        <div className='tec'><SunSnow /> Tecnologia de ponta em educação digital</div>
                        <h1>IntelliStudy</h1>
                        <h2>A plataforma corporativa de educação digital</h2>
                        <p>Revolucione seus estudos com inteligência artificial. Estudos automatizados, simulados personalizados e planejamento inteligente em uma única plataforma profissional e direta ao ponto.</p>
                        <div className='buttons-action'>
                            <button className='btn-primary' onClick={handlePlataform}>Comece Agora</button>
                            <button className='btn-secondary' onClick={handleSobre}>Quem somos nós ?</button>
                        </div>
                    </div>
                    <div className='inicio-image'>
                        <div className='ilustre1'>
                            <div className='chart'>
                                <TrendingUp />
                            </div>
                            <p><span>Seu Desempenho</span> Vai Longe !</p>
                        </div>

                        <img src={ilustracao} alt='Ilustração de estudante usando tecnologia' />

                        <div className='ilustre2'>
                            <div className='chart'>
                                <Brain />
                            </div>
                            <p>IA <span>Ativa</span></p>
                        </div>
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

            <div className="card_action">
                <h1>Comece Sua Jornada Hoje</h1>
                <p>Junte-se aos estudantes que estão revolucionando sua forma de aprender com o IntelliStudy.</p>
                <button className="btn-primary btn-lg" onClick={handlePlataform}>Criar Conta</button>
            </div>

            <Footer />
        </div>
    )
}

export default Inicio