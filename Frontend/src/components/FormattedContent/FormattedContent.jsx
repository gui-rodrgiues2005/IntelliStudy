// src/components/FormattedContent/FormattedContent.jsx
import React from "react";
import './FormattedContent.scss';

// COMPONENTE DE HIGHLIGHT RESUMIDO
// COMPONENTE DE HIGHLIGHT RESUMIDO - VERSÃO MAIS SELETIVA
// COMPONENTE DE HIGHLIGHT UNIVERSAL
const ParagraphWithHighlights = ({ children }) => {
  // CATEGORIAS DE PALAVRAS-CHAVE (expandível)
  const keywordCategories = {
    // CONCEITOS FUNDAMENTAIS (todas as áreas)
    fundamentos: [
      "conceito", "definição", "princípio", "teoria", "fundamento", "base",
      "premissa", "axioma", "postulado", "dogma", "lei", "regra"
    ],
    
    // OBJETIVOS E PROPÓSITOS
    objetivos: [
      "objetivo", "finalidade", "propósito", "meta", "intuito", "fim",
      "alvo", "diretriz", "intenção"
    ],
    
    // CARACTERÍSTICAS E PROPRIEDADES
    caracteristicas: [
      "característica", "atributo", "propriedade", "qualidade", "aspecto",
      "particularidade", "especificação", "natureza"
    ],
    
    // VANTAGENS E BENEFÍCIOS
    vantagens: [
      "vantagem", "benefício", "vantagens", "benefícios", "prós",
      "lucro", "ganho", "positivo", "favorece"
    ],
    
    // DESVANTAGENS E PROBLEMAS
    desvantagens: [
      "desvantagem", "limitação", "problema", "dificuldade", "obstáculo",
      "contratempo", "negativo", "prejuízo", "contra", "desvantagens"
    ],
    
    // IMPORTÂNCIA E RELEVÂNCIA
    importancia: [
      "importante", "essencial", "crucial", "fundamental", "primordial",
      "vital", "necessário", "indispensável", "básico", "central"
    ],
    
    // EXEMPLOS E APLICAÇÕES
    exemplos: [
      "exemplo", "ilustração", "caso", "aplicação", "uso", "prática",
      "implementação", "cenário", "situação"
    ],
    
    // CONCLUSÕES E RESULTADOS
    conclusoes: [
      "portanto", "consequentemente", "assim", "logo", "então",
      "dessa forma", "por consequência", "resultado"
    ],
    
    // CONTRASTES E EXCEÇÕES
    contrastes: [
      "entretanto", "contudo", "porém", "no entanto", "todavia",
      "mas", "apesar", "embora", "exceto", "salvo"
    ],
    
    // ADIÇÕES E COMPLEMENTOS
    adicoes: [
      "além disso", "também", "ademais", "outrossim", "igualmente",
      "similarmente", "paralelamente"
    ]
  };

  // CORES POR CATEGORIA
  const categoryColors = {
    fundamentos: "rgba(147, 197, 253, 0.3)",      // Azul claro - conceitos
    objetivos: "rgba(134, 239, 172, 0.3)",        // Verde - objetivos
    caracteristicas: "rgba(253, 230, 138, 0.3)",  // Amarelo - características
    vantagens: "rgba(134, 239, 172, 0.4)",        // Verde forte - vantagens
    desvantagens: "rgba(252, 165, 165, 0.3)",     // Vermelho - problemas
    importancia: "rgba(249, 168, 212, 0.3)",      // Rosa - importância
    exemplos: "rgba(196, 181, 253, 0.3)",         // Roxo - exemplos
    conclusoes: "rgba(94, 234, 212, 0.3)",        // Ciano - conclusões
    contrastes: "rgba(253, 186, 116, 0.3)",       // Laranja - contrastes
    adicoes: "rgba(209, 213, 219, 0.3)"           // Cinza - adições
  };

  const highlightKeywords = (text) => {
    if (typeof text !== "string") return text;

    // Junta todas as keywords em um array
    const allKeywords = Object.values(keywordCategories).flat();
    
    return text.split(/(\s+)/).map((word, i) => {
      const clean = word.toLowerCase().replace(/[.,!?;:]/g, "");
      
      // Verifica se a palavra está em alguma categoria
      let category = null;
      for (const [cat, keywords] of Object.entries(keywordCategories)) {
        if (keywords.includes(clean)) {
          category = cat;
          break;
        }
      }

      if (!category) return word;

      return (
        <span key={i}
          style={{
            backgroundColor: categoryColors[category],
            padding: "0.08rem 0.25rem",
            borderRadius: "4px",
            margin: "0 0.08rem",
            fontWeight: "500",
            border: `1px solid ${categoryColors[category].replace('0.3', '0.5')}`
          }}>
          {word}
        </span>
      );
    });
  };

  return <p>{highlightKeywords(children)}</p>;
};
const FormattedContent = ({ content }) => {
    const formatContent = (text) => {
        if (!text) return null;

        // Divide em parágrafos
        const paragraphs = text.split(/\n+/).filter(p => p.trim() !== "");

        return paragraphs.map((paragraph, index) => {
            const trimmed = paragraph.trim();

            // Detecta títulos (texto em negrito ou com :)
            if (trimmed.startsWith("**") && trimmed.endsWith("**") || trimmed.includes(":")) {
                return (
                    <h3 key={index} className="content-title">
                        {trimmed.replace(/\*\*/g, '')}
                    </h3>
                );
            }

            // Detecta listas
            if (trimmed.startsWith("- [ ]") || trimmed.startsWith("- [x]") || trimmed.startsWith("- ")) {
                return (
                    <div key={index} className="content-list-item">
                        {trimmed.startsWith("- [ ]") || trimmed.startsWith("- [x]") ? (
                            <div className="checkbox-item">
                                <span className={`checkbox ${trimmed.startsWith("- [x]") ? 'checked' : ''}`}>
                                    {trimmed.startsWith("- [x]") ? '✓' : ''}
                                </span>
                                <span>{trimmed.replace(/^- \[[x ]\] /, '')}</span>
                            </div>
                        ) : (
                            <div className="bullet-item">• {trimmed.replace(/^- /, '')}</div>
                        )}
                    </div>
                );
            }

            // Detecta tópicos numerados
            if (/^\d+\./.test(trimmed)) {
                return (
                    <div key={index} className="numbered-item">
                        {trimmed}
                    </div>
                );
            }

            // Parágrafo normal com highlights
            return (
                <div key={index} className="content-paragraph">
                    <ParagraphWithHighlights>
                        {trimmed}
                    </ParagraphWithHighlights>
                </div>
            );
        });
    };

    return <div className="formatted-content">{formatContent(content)}</div>;
};

export default FormattedContent;