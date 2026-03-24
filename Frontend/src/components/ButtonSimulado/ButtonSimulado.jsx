import React from 'react';
import { ArrowBigRightDash } from 'lucide-react';

const ButtonSimulado = ({ onClick }) => {
  return (
    <button className="btn-simulado" onClick={onClick}>
      <ArrowBigRightDash className="simulado-icon" />
      Criar Simulado
    </button>
  );
};

export default ButtonSimulado;
