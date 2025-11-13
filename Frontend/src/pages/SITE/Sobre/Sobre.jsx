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
        <p>Uma plataforma de educação digital criada com o propósito de transformar a forma como estudantes aprendem e se preparam, utilizando o poder da inteligência artificial para gerar conteudos, simulados e quizzes personalizados.</p>
        <p>Nossa missão é democratizar o acesso a ferramentas profissionais e acessíveis, ajudando pessoas a alcançarem seus objetivos acadêmicos e profissionais de maneira mais eficiente.</p>
        <div className='buttons-action'>
          <button className='btn-primary' onClick={handlePlataform}>Comece Agora</button>
        </div>
      </div>

      <section className='historia'>
        <div className='card'>
          <h2>Nossa História</h2>
          <p>
            O <strong>IntelliStudy</strong> nasceu como um projeto independente, idealizado para tornar o estudo mais inteligente e acessível. A plataforma foi desenvolvida do zero, unindo tecnologia, design e inteligência artificial para criar uma experiência de aprendizado moderna e eficaz.
          </p>
          <p>
            Todo o sistema — desde o backend em <strong>C# .NET</strong> até o frontend em <strong>React</strong> — foi construído com foco em desempenho, escalabilidade e experiência do usuário. O objetivo sempre foi entregar uma ferramenta prática, intuitiva e realmente útil para quem busca aprender de forma otimizada.
          </p>
          <p>
            Hoje, o IntelliStudy continua evoluindo constantemente, com base no feedback dos usuários e em novas ideias que surgem a cada atualização. O foco é garantir uma plataforma sólida, confiável e com inovação contínua.
          </p>
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
        <h1>Quem Está Por Trás</h1>
        <p>Conheça o criador e desenvolvedor responsável por transformar o IntelliStudy em realidade.</p>

        <div className='desenvolvedor-container'>
          <div className='desenvolvedor-foto'>
            <div className='img-criador'>
              <img src={Foto} alt='Foto do criador' className='foto-criador'></img>
            </div>
            <div className='desenvolvedor-header'>
              <div className='criador'>
                <p>Fundador & Desenvolvedor</p>
              </div>
              <h1>Guilherme Rodrigues Costa</h1>

              <p>
                Sou o criador e desenvolvedor da <strong>IntelliStudy</strong>, responsável por toda a arquitetura e implementação da plataforma usando C# .NET e React. Este projeto representa minha dedicação em unir tecnologia e educação, criando soluções que realmente impactam o aprendizado.
              </p>

              <p>
                O IntelliStudy nasceu como uma ideia independente e evoluiu com o tempo para se tornar uma aplicação completa, que utiliza IA para automatizar e personalizar o estudo. Ainda há muito a ser aprimorado, mas cada atualização reflete meu compromisso em entregar qualidade e inovação.
              </p>

              <p>
                Cada funcionalidade foi criada com foco em melhorar a experiência do usuário e explorar o potencial da tecnologia para facilitar o processo de aprendizado. Para mim, programar é mais do que escrever código — é transformar ideias em impacto real.
              </p>
            </div>
          </div>

          {/* Redes Sociais */}
          {/* Redes Sociais */}
          <div className='sociais'>
            <div className='sociais-links'>
              <a
                href='https://www.instagram.com/guilherme_rodriguess01?igsh=MTB5M2Nud2Y1enYzbg=='
                target='_blank'
                rel='noopener noreferrer'
                className='social-link'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 24 24'
                  fill='currentColor'
                  className='social-icon'
                >
                  <path d='M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm4.25-.75a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5Z' />
                </svg>
              </a>

              <a
                href='https://github.com/gui-rodrgiues2005'
                target='_blank'
                rel='noopener noreferrer'
                className='social-link'
              >
                <svg className='social-icon' viewBox='0 0 24 24' fill='currentColor'>
                  <path d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z' />
                </svg>
              </a>

              <a
                href='https://www.linkedin.com/in/guilherme-rodrigues-costa-a39a15268'
                target='_blank'
                rel='noopener noreferrer'
                className='social-link'
              >
                <svg className='social-icon' viewBox='0 0 24 24' fill='currentColor'>
                  <path d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' />
                </svg>
              </a>

              <a
                href='mailto:rodriguesguidev@gmail.com'
                className='social-link'
              >
                <svg className='social-icon' viewBox='0 0 24 24' fill='currentColor'>
                  <path d='M12 12.713l-11.985-9.713h23.97l-11.985 9.713zm0 2.574l-12-9.725v15.438h24v-15.438l-12 9.725z' />
                </svg>
              </a>
            </div>
          </div>

          <div className='desenvolvedor-quote'>
            <blockquote>
              "Cada linha de código foi escrita com o propósito de criar uma experiência que realmente ajude estudantes a alcançarem seus objetivos."
            </blockquote>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}

export default Sobre
