// components/TypewriterMarkdown.jsx
import ReactMarkdown from 'react-markdown';
import useTypewriter from '../hooks/useTypewriter';
import { useEffect } from 'react';

const TypewriterMarkdown = ({ 
  content, 
  speed = 20,
  onComplete,
  components = {} 
}) => {
  const typedContent = useTypewriter(content, speed);

  useEffect(() => {
    if (typedContent === content && onComplete) {
      onComplete();
    }
  }, [typedContent, content, onComplete]);

  return (
    <ReactMarkdown components={components}>
      {typedContent}
    </ReactMarkdown>
  );
};

export default TypewriterMarkdown;