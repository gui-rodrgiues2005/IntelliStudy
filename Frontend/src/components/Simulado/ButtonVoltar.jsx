import React from 'react';
import './ButtonVoltar.scss';
import { ArrowBigLeftDash  } from 'lucide-react';

const ButtonSimulado = ({ onClick }) => {
    return (
        <button className="btn-voltar" onClick={onClick}>
            <ArrowBigLeftDash  className="simulado-icon"/>
            Dashboard
        </button>
    );
};

export default ButtonSimulado;
