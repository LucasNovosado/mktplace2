// src/components/import/DateReferenceSelector.jsx
import React from 'react';
import PropTypes from 'prop-types';
import './DateReferenceSelector.css';
import { 
  formatDateYYYYMMDD, 
  formatDateDDMMYYYY, 
  parseDateYYYYMMDD 
} from '../../utils/DateValidation';

/**
 * Componente para seleção de data de referência
 * Usado em diversas partes do sistema para garantir consistência nas importações
 * 
 * @param {Object} props - Propriedades do componente
 * @param {Date} props.date - Data atual selecionada
 * @param {Function} props.onChange - Função chamada quando a data é alterada
 * @param {Boolean} props.disabled - Se o seletor deve estar desabilitado
 */
const DateReferenceSelector = ({ date, onChange, disabled = false }) => {
  // Converter a data para formato adequado para input date (YYYY-MM-DD)
  const formattedDate = formatDateYYYYMMDD(date);

  // Manipulador de evento para quando a data é alterada
  const handleDateChange = (e) => {
    const newDate = parseDateYYYYMMDD(e.target.value);
    onChange(newDate);
  };

  return (
    <div className="date-reference-container">
      <div className="date-selector">
        <label htmlFor="referenceDate">Data de Referência:</label>
        <input
          type="date"
          id="referenceDate"
          value={formattedDate}
          onChange={handleDateChange}
          disabled={disabled}
          className="date-input"
        />
      </div>
      
      <div className="date-info">
        As importações de leads e vendas serão associadas à data: <strong>{formatDateDDMMYYYY(date)}</strong>
      </div>
    </div>
  );
};

DateReferenceSelector.propTypes = {
  date: PropTypes.instanceOf(Date).isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default DateReferenceSelector;