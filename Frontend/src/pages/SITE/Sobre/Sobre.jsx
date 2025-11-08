import React from 'react'
import './Sobre.scss'
import NavigationSite from '../../../components/Layout/NavigationSite/NavigationSite'
import Footer from '../../../components/Layout/Footer/Footer'
import { Brain, Target, User, Zap } from "lucide-react";
import { useNavigate } from 'react-router-dom'
import Foto from '../../../assets/foto.jpg';

const valoresData = [
  {
    icon: <Brain />,
    title: 'Inovação em IA',
    description: 'Utilizamos as mais avançadas tecnologias de inteligência artificial para revolucionar a forma como você estuda.'
  },
  {
    icon: <Target />,
    title: 'Foco no Resultado',
    description: 'Nosso objetivo é claro: ajudar você a alcançar suas metas acadêmicas e profissionais.'
  },
  {
    icon: <User />,
    title: 'Centrado no Aluno',
    description: 'Cada funcionalidade é pensada para facilitar sua vida e potencializar seu aprendizado.'
  },
  {
    icon: <Zap />,
    title: 'Eficiência',
    description: 'Otimizamos seu tempo de estudo para que você aprenda mais em menos tempo.'
  }
];

const Sobre = () => {
  const navigate = useNavigate();

  const handlePlataform = () => {
    navigate('/login')
  }

  return (
    <div className='container-sobre'>
      <NavigationSite />

      <div className='sobre'>
        <h1>Sobre o <span>IntelliStudy</span></h1>
        <p>Uma plataforma de educação digital desenvolvida pela <strong>IdeiaFish</strong>, empresa focada em criar soluções tecnológicas inovadoras para transformar a forma como as pessoas aprendem.</p>
        <p>Nossa missão é democratizar o acesso a ferramentas profissionais, ajudando pessoas a alcançarem seus objetivos de forma mais eficiente.</p>
        <div className='buttons-action'>
          <button className='btn-primary' onClick={handlePlataform}>Comece Agora</button>
        </div>
      </div>

      <section className='historia'>
        <div className='card'>
          <h2>Nossa História</h2>
          <p>
            O <strong>IntelliStudy</strong> nasceu como um projeto ambicioso de educação digital, idealizado para tornar o estudo mais inteligente e eficiente. A plataforma é um produto da <strong>IdeiaFish</strong>, empresa de tecnologia da qual sou <strong>CEO</strong>, junto com <strong>Pedro Augusto Dias, CEO & Fundador</strong>.
          </p>
          <p>
            Como CEO e desenvolvedor principal, fui responsável por criar toda a arquitetura e funcionalidades do sistema, unindo inteligência artificial, design e programação full stack. Nosso foco sempre foi entregar uma solução que realmente faça diferença na vida dos estudantes.
          </p>
          <p>
            Além de nós, a <strong>IdeiaFish</strong> conta com uma equipe de Desenvolvedores dedicados em inovar e garantir que a plataforma continue evoluindo com qualidade e confiabilidade. Cada nova funcionalidade reflete nosso compromisso com educação, tecnologia e experiência do usuário.
          </p>
          <div className='empresa'>
            <a href='https://ideiafish.com.br/' target='_blank' rel='noopener noreferrer'>
              <button className='btn-secondary'>Conheça a IdeiaFish</button>
            </a>
          </div>
        </div>
      </section>

      <section className='valores'>
        <h1>Nossos Valores</h1>
        <div className='valores__cards'>
          {valoresData.map((valor, index) => (
            <div className='valores__card' key={index}>
              <div className='valores__icon'>{valor.icon}</div>
              <h3>{valor.title}</h3>
              <p>{valor.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className='desenvolvedor'>
        <h1>Quem Esta Por Trás</h1>
        <p>Conheça o profissional que idealizou e desenvolveu toda a plataforma IntelliStudy.</p>
        
        <div className='desenvolvedor-container'>
          <div className='desenvolvedor-foto'>
            <div className='img-criador'>
              <img src={Foto} alt='Foto do criador' className='foto-criador'></img>
            </div>
            <div className='desenvolvedor-header'>
              <div className='criador'>
                <p>IdeiaFish . Fundador & Desenvolvedor</p>
              </div>
              <h1>Criador & Desenvolvedor</h1>

              <p>
                Sou o criador e desenvolvedor da <strong>IntelliStudy</strong>, responsável por toda a arquitetura e implementação da plataforma usando C# .NET e React. Este projeto é uma iniciativa da <strong>IdeiaFish</strong>, empresa da qual sou CEO, e representa meu compromisso em transformar ideias em soluções digitais eficientes.
              </p>

              <p>
                O IntelliStudy nasceu como uma ideia inovadora e, atualmente, está em sua fase inicial. Ainda há muito a ser desenvolvido e aprimorado ao longo do tempo para que a plataforma atinja todo o seu potencial e se torne a solução completa que desejamos entregar aos estudantes.
              </p>

              <p>
                Cada funcionalidade implementada reflete meu foco em qualidade, aprendizado contínuo e inovação. Para mim, cada projeto é uma oportunidade de crescimento: testar novas tecnologias, experimentar abordagens diferentes e desenvolver uma aplicação completa, do backend ao frontend, com excelência.
              </p>
            </div>
          </div>

          {/* Seção de Redes Sociais */}
          <div className='sociais'>
            <div className='sociais-links'>
              <a href='https://www.instagram.com/guilherme_rodriguess01?igsh=MTB5M2Nud2Y1enYzbg==' target='_blank' rel='noopener noreferrer' className='social-link'>
                <svg className='social-icon' viewBox='0 0 24 24' fill='currentColor'>
                  <path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' />
                </svg>
              </a>

              <a href='https://github.com/gui-rodrgiues2005' target='_blank' rel='noopener noreferrer' className='social-link'>
                <svg className='social-icon' viewBox='0 0 24 24' fill='currentColor'>
                  <path d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z' />
                </svg>
              </a>

              <a href='https://www.linkedin.com/in/guilherme-rodrigues-costa-a39a15268' target='_blank' rel='noopener noreferrer' className='social-link'>
                <svg className='social-icon' viewBox='0 0 24 24' fill='currentColor'>
                  <path d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' />
                </svg>
              </a>
              <a href='mailto:rodriguesguidev@gmail.com' className='social-link'>
                <svg className='social-icon' viewBox='0 0 24 24' fill='currentColor'>
                  <path d='M12 12.713l-11.985-9.713h23.97l-11.985 9.713zm0 2.574l-12-9.725v15.438h24v-15.438l-12 9.725z' />
                </svg>
              </a>
            </div>
          </div>

          <div className='desenvolvedor-quote'>
            <blockquote>
              "Cada linha de código foi escrita pensando em criar uma experiência que realmente ajude estudantes a alcançarem seus objetivos."
            </blockquote>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}

export default Sobre