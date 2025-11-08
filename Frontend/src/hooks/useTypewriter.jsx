// components/TypewriterMarkdown.jsx
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

const useTypewriter = ({ 
  content, 
  speed = 20,
  onComplete,
  components = {} 
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!content) {
      setDisplayedContent('');
      setCurrentIndex(0);
      return;
    }

    // Reset quando o conteúdo muda
    setDisplayedContent('');
    setCurrentIndex(0);
  }, [content]);

  useEffect(() => {
    if (!content || currentIndex >= content.length) {
      onComplete?.();
      return;
    }

    const timer = setTimeout(() => {
      setDisplayedContent(prev => prev + content[currentIndex]);
      setCurrentIndex(prev => prev + 1);
    }, speed);

    return () => clearTimeout(timer);
  }, [currentIndex, content, speed, onComplete]);

  return (
    <ReactMarkdown components={components}>
      {displayedContent}
    </ReactMarkdown>
  );
};

export default useTypewriter;