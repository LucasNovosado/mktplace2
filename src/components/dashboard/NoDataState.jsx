import React from 'react';

const NoDataState = ({ 
  dateRange, 
  handleStartDateChange, 
  handleEndDateChange, 
  formatDateForInput 
}) => {
  return (
    <div className="sales-dashboard">
      <div className="dashboard-header">
        <h2 className="dashboard-title">Dashboard de Vendas</h2>
        <div className="dashboard-filters">
          <div className="filter-group">
            <label className="filter-label">Data Inicial:</label>
            <input 
              type="date" 
              className="filter-input"
              value={formatDateForInput(dateRange.startDate)}
              onChange={handleStartDateChange}
            />
          </div>
          <div className="filter-group">
            <label className="filter-label">Data Final:</label>
            <input 
              type="date" 
              className="filter-input"
              value={formatDateForInput(dateRange.endDate)}
              onChange={handleEndDateChange}
            />
          </div>
        </div>
      </div>
      <div className="no-data">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 8v4"></path>
          <path d="M12 16h.01"></path>
        </svg>
        <p>Nenhum dado encontrado para o período selecionado.</p>
      </div>
    </div>
  );
};

export default NoDataState;