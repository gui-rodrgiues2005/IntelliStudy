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
        <p>Transforme suas sessões de estudo com IA. Crie resumos inteligentes, faça simulados personalizados e siga um plano de estudos otimizado para seus objetivos.</p>

        <div className='buttons-action'>
          <button className='btn-primary' onClick={handlePlataform}>Comece Agora</button>
        </div>
      </div>

      <section className='historia'>
        <div className='card'>
          <h2>Nossa História</h2>
          <p>
            O IntelliStudy surgiu como um desafio pessoal: criar uma plataforma que fosse útil, prática
            e que agregasse valor real aos estudantes. Desenvolvi tudo do zero, unindo IA, design e
            programação em um só projeto.
          </p>
          <p>
            O objetivo sempre foi tornar o estudo mais acessível e eficiente, com recursos que realmente
            ajudem quem busca aprender de forma independente. Hoje, o IntelliStudy continua evoluindo com
            base no feedback dos usuários e no compromisso de melhorar sempre, marcando um passo importante
            na minha jornada como desenvolvedor.
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
        <div className='desenvolvedor-container'>
          <div className='desenvolvedor-foto'>
            <div className='img-criador'>
              <img src={Foto} alt='Foto do criador' className='foto-criador'></img>
            </div>
            <div className='desenvolvedor-header'>
              <h1>Criador & Desenvolvedor Full Stack</h1>

              <p>
                Sou estudante de Ciência da Computação e Desenvolvedor Full Stack. Trabalho com C# .NET e React, atuando no desenvolvimento e estruturação de aplicações completas e integradas.
              </p>

              <p>
                Comecei o <strong>IntelliStudy</strong> como um projeto comum, apenas explorando uma ideia que achei interessante. Com o tempo, fui aprimorando o sistema, adicionando recursos mais robustos e aplicando o que aprendia durante meus estudos.
              </p>

              <p>
                O projeto acabou se tornando uma forma de aprendizado constante — onde posso testar novas tecnologias, aprimorar minhas habilidades e entender melhor o funcionamento de uma aplicação completa, desde o backend em .NET até o frontend em React.
              </p>

              <p>
                Gosto de encarar cada projeto como um passo na minha evolução como desenvolvedor. Não busco apenas criar algo perfeito, mas aprender, experimentar e ver até onde posso chegar com minhas próprias ideias.
              </p>
            </div>

          </div>

          {/* <div className='desenvolvedor-stats'>
            <div className='stat-item'>
              <div className='stat-value'>100%</div>
              <div className='stat-label'>Dedicação</div>
            </div>
            <div className='stat-item'>
              <div className='stat-value'>2025</div>
              <div className='stat-label'>Lançamento</div>
            </div>
            <div className='stat-item'>
              <div className='stat-value'>100%</div>
              <div className='stat-label'>Qualidade</div>
            </div>
          </div> */}

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