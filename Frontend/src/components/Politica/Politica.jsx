import React from "react";
import "./Politica.scss";
import NavigationSite from "../Layout/NavigationSite/NavigationSite";

const PoliticaPrivacidade = () => {
    return (
        <div className="privacidade-container">
            <NavigationSite />
            <div className="privacidade-content">
                <h1>Política de Privacidade</h1>
                <p className="update-date">Última atualização: Outubro de 2025</p>

                <section>
                    <h2>1. Introdução</h2>
                    <p>
                        Esta Política de Privacidade descreve como o <strong>IntelliStudy</strong> coleta,
                        utiliza, armazena e protege as informações dos usuários. Ao utilizar nossa plataforma,
                        você concorda com as práticas descritas neste documento.
                    </p>
                </section>

                <section>
                    <h2>2. Informações Coletadas</h2>
                    <div className="info-grid">
                        <div className="info-category">
                            <h3>📝 Dados de Cadastro</h3>
                            <ul>
                                <li>Nome completo</li>
                                <li>Endereço de e-mail</li>
                                <li>Senha (criptografada)</li>
                            </ul>
                        </div>

                        <div className="info-category">
                            <h3>💳 Dados para Planos</h3>
                            <ul>
                                <li>Número de cartão e dados essenciais</li>
                                <li>Nome do titular</li>
                                <li>Dados de pagamento (processados externamente)</li>
                            </ul>
                        </div>

                        <div className="info-category">
                            <h3>📊 Dados de Uso</h3>
                            <ul>
                                <li>Progresso nos estudos</li>
                                <li>Preferências de aprendizado</li>
                                <li>Logs de acesso</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <section>
                    <h2>3. Como Usamos Suas Informações</h2>
                    <div className="usage-list">
                        <div className="usage-item">
                            <span className="usage-icon">🔐</span>
                            <div>
                                <h4>Autenticação e Segurança</h4>
                                <p>Para criar e proteger sua conta, com senhas armazenadas de forma criptografada</p>
                            </div>
                        </div>

                        <div className="usage-item">
                            <span className="usage-icon">🎯</span>
                            <div>
                                <h4>Personalização</h4>
                                <p>Para adaptar a experiência de estudo às suas necessidades específicas</p>
                            </div>
                        </div>

                        <div className="usage-item">
                            <span className="usage-icon">💳</span>
                            <div>
                                <h4>Processamento de Pagamentos</h4>
                                <p>Para gerenciar assinaturas através do serviço da Stripe</p>
                            </div>
                        </div>

                        <div className="usage-item">
                            <span className="usage-icon">📈</span>
                            <div>
                                <h4>Melhoria da Plataforma</h4>
                                <p>Para analisar o uso e implementar melhorias contínuas</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <h2>4. Proteção de Dados</h2>
                    <div className="security-features">
                        <div className="security-item">
                            <h3>🔒 Criptografia</h3>
                            <p>Todas as senhas são armazenadas usando algoritmos de hash modernos, garantindo que nem mesmo nossa equipe tenha acesso às suas senhas em texto simples.</p>
                        </div>

                        <div className="security-item">
                            <h3>🛡️ Dados Sensíveis</h3>
                            <p>CPF e telefone são coletados apenas quando necessário para assinatura de planos pagos, e armazenados de forma segura com acesso restrito.</p>
                        </div>

                        <div className="security-item">
                            <h3>🔐 Pagamentos Seguros</h3>
                            <p>As transações financeiras são processadas exclusivamente pela <strong>Stripe</strong>, empresa especializada e confiável em processamento de pagamentos. Não armazenamos dados de cartão de crédito em nossos servidores.</p>
                        </div>
                    </div>
                </section>

                <section>
                    <h2>5. Compartilhamento de Dados</h2>
                    <p>
                        <strong>Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros</strong>,
                        exceto quando necessário para:
                    </p>
                    <ul>
                        <li>Processamento de pagamentos através da Stripe</li>
                        <li>Cumprimento de obrigações legais</li>
                        <li>Proteção dos direitos e segurança da plataforma</li>
                    </ul>
                </section>

                <section>
                    <h2>6. Retenção de Dados</h2>
                    <p>
                        Mantemos seus dados apenas pelo tempo necessário para fornecer os serviços
                        solicitados ou conforme exigido por lei. Você pode solicitar a exclusão de
                        sua conta e dados a qualquer momento através das configurações da plataforma
                        ou entrando em contato conosco.
                    </p>
                </section>

                <section>
                    <h2>7. Seus Direitos</h2>
                    <div className="rights-grid">
                        <div className="right-item">
                            <h4>👁️ Acesso</h4>
                            <p>Visualizar os dados que coletamos sobre você</p>
                        </div>

                        <div className="right-item">
                            <h4>✏️ Correção</h4>
                            <p>Atualizar informações desatualizadas ou incorretas</p>
                        </div>

                        <div className="right-item">
                            <h4>🗑️ Exclusão</h4>
                            <p>Solicitar a remoção de seus dados pessoais</p>
                        </div>

                        <div className="right-item">
                            <h4>📝 Portabilidade</h4>
                            <p>Receber seus dados em formato estruturado</p>
                        </div>
                    </div>
                </section>

                <section>
                    <h2>8. Cookies e Tecnologias Similares</h2>
                    <p>
                        Utilizamos cookies essenciais para o funcionamento da plataforma e cookies
                        analíticos para entender como os usuários interagem com nosso serviço.
                        Você pode gerenciar suas preferências de cookies através do seu navegador.
                    </p>
                </section>

                <section>
                    <h2>9. Alterações nesta Política</h2>
                    <p>
                        Podemos atualizar esta Política de Privacidade periodicamente.
                        Notificaremos os usuários sobre mudanças significativas através do e-mail
                        cadastrado ou por meio de avisos na plataforma.
                    </p>
                </section>

                <section>
                    <h2>10. Contato</h2>
                    <p>
                        Em caso de dúvidas sobre esta Política de Privacidade ou sobre o tratamento
                        de seus dados, entre em contato conosco:
                    </p>
                    <div className="contact-info">
                        <p><strong>E-mail:</strong> rodriguesguidev@gmail.com</p>
                        <p><strong>Responsável:</strong> Guilherme Rodrigues Costa</p>
                    </div>
                </section>

                <div className="security-note">
                    <h3>🏆 Nosso Compromisso com Sua Privacidade</h3>
                    <p>
                        Desenvolvi a IntelliStudy com a privacidade e segurança como prioridades.
                        Cada decisão técnica foi tomada pensando na proteção dos seus dados e na
                        transparência sobre como os utilizamos para melhorar sua experiência de estudo.
                    </p>
                </div>

                <p className="assinatura">© 2025 IntelliStudy — Protegendo sua privacidade</p>
            </div>
        </div>
    );
};

export default PoliticaPrivacidade;