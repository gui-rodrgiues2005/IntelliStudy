import { useEffect, useState } from "react";
import { Copy, Check, Brain,Rocket  } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import './PixPage.scss';

const PixPage = () => {
    const [pix, setPix] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        async function fetchPix() {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5051/api/Pagamento/meu-pix", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setPix(data);
        }
        fetchPix();
    }, []);

    const copiarCodigo = () => {
        navigator.clipboard.writeText(pix.pixCopiaECola);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!pix)
        return (
            <div className="pix-container loading-state">
                <div className="loading-text">Gerando seu Pix...</div>
            </div>
        );

    return (
        <div className="pix-container">
            {/* Cabeçalho com destaque visual */}
            <header className="pix-header-hero">
                <h1>Desperte o poder da <span>IA</span> nos seus estudos</h1>
                <p>Desbloqueie o potencial da Inteligência Artificial e acelere seu aprendizado.</p>
            </header>

            {/* Aviso importante */}
            <section className="pix-disclaimer">
                <h4>Aviso Importante</h4>
                <p>
                    Todos os pagamentos são administrados pelo desenvolvedor e proprietário da plataforma,{" "}
                    <strong>Guilherme Rodrigues Costa</strong>. Para segurança, transparência e suporte, entre em contato:
                </p>
                <ul>
                    <li>
                        Email: <a href="mailto:rodriguesguidev@gmail.com">rodriguesguidev@gmail.com</a>
                    </li>
                    <li>
                        Portfólio:{" "}
                        <a href="https://guilherme.dev" target="_blank" rel="noopener noreferrer">
                            Conheça o Desenvolvedor
                        </a>
                    </li>
                </ul>
                <p>
                    Após o pagamento, o acesso à plataforma será liberado automaticamente.
                </p>
                <em>Obrigado pela confiança! Aproveite ao máximo sua experiência com a IntelliStudy  <Rocket  className="rocket_icon"/></em>
            </section>

            {/* Área de pagamento */}
            <div className="pix-payment-grid">
                {/* PIX */}
                <div className="pix-card pix-left">
                    <h2>Pagamento via PIX</h2>
                    <p className="pix-subtitle">Escaneie o QR Code ou copie o código abaixo</p>

                    <div className="pix-amount">
                        <span>Valor a pagar</span>
                        <strong>R$ {pix.valor}</strong>
                    </div>

                    <div className="qr-wrapper">
                        <QRCodeCanvas value={pix.pixCopiaECola} size={200} includeMargin={true} />
                    </div>

                    <div className="copy-section">
                        <label>Código Pix (Copia e Cola)</label>
                        <div className="copy-container">
                            <input type="text" value={pix.pixCopiaECola} readOnly />
                            <button onClick={copiarCodigo} className={copied ? "copied" : ""}>
                                {copied ? <Check size={18} /> : <Copy size={18} />}
                                {copied ? "Copiado!" : "Copiar"}
                            </button>
                        </div>
                    </div>

                    <ul className="pix-benefits">
                        <li>✅ Pagamento instantâneo</li>
                        <li>✅ Sem taxas adicionais</li>
                        <li>✅ 100% seguro</li>
                        <li>✅ Acesso imediato à plataforma</li>
                    </ul>
                </div>

                {/* Outras opções */}
                <div className="pix-card pix-right">
                    <h3>Outras Formas de Pagamento</h3>
                    <p>Em breve, novas opções estarão disponíveis para você.</p>
                    <span className="soon-badge">Em Breve</span>
                </div>
            </div>
        </div>
    );
};

export default PixPage;
