import React from 'react';

const ErrorState = ({ error, onRetry }) => {
  return (
    <div className="sales-dashboard">
      <div className="dashboard-header">
        <h2 className="dashboard-title">Dashboard de Vendas</h2>
      </div>
      <div className="error-message">{error}</div>
      <button className="filter-button" onClick={onRetry}>
        Tentar Novamente
      </button>
    </div>
  );
};

export default ErrorState;