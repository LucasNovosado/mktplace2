// src/components/StyledCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './StyledCard.css';

/**
 * Componente de card estilizado com botão para navegação
 * 
 * @param {Object} props - Propriedades do componente
 * @param {string} props.title - Título do card
 * @param {string} props.description - Descrição do conteúdo
 * @param {string} props.icon - Nome da classe de ícone (opcional)
 * @param {string} props.buttonText - Texto do botão
 * @param {string} props.to - Caminho para redirecionamento
 * @param {string} props.bgColor - Cor de fundo personalizada (opcional)
 * @param {React.ReactNode} props.children - Conteúdo adicional (opcional)
 */
const StyledCard = ({ 
  title, 
  description, 
  icon, 
  buttonText = "Ver mais", 
  to, 
  bgColor,
  children 
}) => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate(to);
  };

  // Estilo inline para cor de fundo personalizada (opcional)
  const cardStyle = bgColor ? { 
    background: `linear-gradient(135deg, ${bgColor} 0%, rgba(42, 42, 42, 0.8) 100%)` 
  } : {};

  return (
    <div className="styled-card" style={cardStyle}>
      <div className="styled-card-header">
        {icon && <span className={`styled-card-icon ${icon}`}></span>}
        <h3 className="styled-card-title">{title}</h3>
      </div>
      
      <div className="styled-card-content">
        <p className="styled-card-description">{description}</p>
        {children}
      </div>
      
      <div className="styled-card-footer">
        <button 
          className="styled-card-button" 
          onClick={handleNavigate}
          aria-label={`Ir para ${buttonText}`}
        >
          {buttonText}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="arrow-icon">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default StyledCard;