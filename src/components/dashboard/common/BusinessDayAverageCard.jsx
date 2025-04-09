import React from 'react';
import { calculateBusinessDayAverage, countBusinessDays } from '../../../utils/BusinessDaysUtils';

/**
 * Componente que exibe a média de métricas por dia útil
 * 
 * @param {Object} props - Propriedades do componente
 * @param {Object} props.data - Dados a serem exibidos (vendas, leads, etc)
 * @param {Date} props.startDate - Data inicial do período
 * @param {Date} props.endDate - Data final do período
 * @param {string} props.title - Título opcional para o card
 * @param {string} props.className - Classes CSS adicionais
 * @param {boolean} props.showDecimals - Se deve mostrar casas decimais (padrão: false)
 */
const BusinessDayAverageCard = ({ 
  data, 
  startDate, 
  endDate, 
  title = "Média por Dia Útil", 
  className = "",
  showDecimals = false
}) => {
  // Contar dias úteis no período
  const businessDays = countBusinessDays(startDate, endDate);
  
  // Calcular médias por dia útil
  const averageSales = calculateBusinessDayAverage(data.vendas, startDate, endDate);
  const averageLeads = calculateBusinessDayAverage(data.leads, startDate, endDate);
  const averageBats = calculateBusinessDayAverage(data.bats, startDate, endDate);
  
  // Formatar valores conforme a preferência (com ou sem casas decimais)
  const formatValue = (value) => {
    return showDecimals ? value.toFixed(2) : Math.round(value);
  };

  return (
    <div className={`business-day-average-card ${className}`}>
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
        <div className="business-days-info">
          <span className="business-days-count">{businessDays} dias úteis no período</span>
          <span className="business-days-dates">
            {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
          </span>
        </div>
      </div>
      
      <div className="metrics-container">
        <div className="metric-item">
          <span className="metric-label">Vendas</span>
          <span className="metric-value">{formatValue(averageSales)}</span>
          <span className="metric-subtitle">média/dia útil</span>
        </div>
        
        <div className="metric-item">
          <span className="metric-label">Leads</span>
          <span className="metric-value">{formatValue(averageLeads)}</span>
          <span className="metric-subtitle">média/dia útil</span>
        </div>
        
        <div className="metric-item">
          <span className="metric-label">BATS</span>
          <span className="metric-value">{formatValue(averageBats)}</span>
          <span className="metric-subtitle">média/dia útil</span>
        </div>
      </div>
    </div>
  );
};

export default BusinessDayAverageCard;