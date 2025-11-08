import React from "react";
import "./Termos.scss";
import NavigationSite from "../Layout/NavigationSite/NavigationSite";

const TermosDeUso = () => {
  return (
    <div className="termos-container">
      <NavigationSite />
      <div className="termos-content">
        <h1>Termos de Uso</h1>
        <p className="update-date">Última atualização: Outubro de 2025</p>

        <section>
          <h2>1. Aceitação dos Termos</h2>
          <p>
            Ao acessar e utilizar a plataforma <strong>IntelliStudy</strong>, você concorda em
            cumprir e estar vinculado a estes Termos de Uso. Caso não concorde com
            qualquer parte dos termos, recomendamos que não utilize a plataforma.
          </p>
        </section>

        <section>
          <h2>2. Sobre a Plataforma</h2>
          <p>
            O IntelliStudy é uma plataforma digital desenvolvida com o objetivo de oferecer
            ferramentas para apoio aos estudos, como tipos de pesquisas diretas, simulados e
            planos de estudo otimizados. A plataforma é mantida pela <strong>IdeiaFish</strong>,
            empresa de tecnologia e desenvolvimento de software.
          </p>
        </section>

        <section>
          <h2>3. Uso da Plataforma</h2>
          <p>
            O uso do IntelliStudy é destinado exclusivamente a fins pessoais e educacionais.
            É proibida a utilização da plataforma para atividades ilícitas, reprodução não
            autorizada de conteúdo, engenharia reversa ou qualquer prática que comprometa
            a segurança do sistema.
          </p>
        </section>

        <section>
          <h2>4. Conta de Usuário</h2>
          <p>
            Para acessar determinadas funcionalidades, o usuário poderá criar uma conta
            com informações pessoais básicas. O usuário é responsável por manter a
            confidencialidade de suas credenciais e por todas as atividades realizadas sob
            sua conta.
          </p>
        </section>

        <section>
          <h2>5. Privacidade e Dados</h2>
          <p>
            As informações coletadas são utilizadas apenas para funcionamento da plataforma
            e melhoria da experiência do usuário. Nenhum dado é vendido, compartilhado ou
            divulgado a terceiros sem autorização. Para mais detalhes, consulte nossa
            <a href="/privacidade"> Política de Privacidade</a>.
          </p>
        </section>

        <section>
          <h2>6. Propriedade Intelectual</h2>
          <p>
            Todo o conteúdo, design, código e marca IntelliStudy são de propriedade do
            desenvolvedor e protegidos por direitos autorais. O uso indevido pode resultar
            em medidas legais cabíveis.
          </p>
        </section>

        <section>
          <h2>7. Isenção de Responsabilidade</h2>
          <p>
            O IntelliStudy é fornecido “como está”, sem garantias de qualquer tipo.
            Apesar dos esforços para manter o sistema funcional e atualizado, o
            desenvolvedor não se responsabiliza por perdas de dados, interrupções
            temporárias ou eventuais falhas técnicas.
          </p>
        </section>

        <section>
          <h2>8. Alterações nos Termos</h2>
          <p>
            Estes Termos podem ser modificados a qualquer momento, sem aviso prévio.
            As alterações entram em vigor a partir de sua publicação nesta página.
            Recomendamos revisar esta seção periodicamente.
          </p>
        </section>

        <section>
          <h2>9. Contato</h2>
          <p>
            Em caso de dúvidas sobre estes Termos, entre em contato através do e-mail:{" "}
            <a href="mailto:ideiafish2025@gmail.com">
              ideiafish2025@gmail.com
            </a>
          </p>
        </section>

        <p className="assinatura">© 2025 IntelliStudy — Todos os direitos reservados.</p>
      </div>
    </div>
  );
};

export default TermosDeUso;
