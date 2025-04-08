import React from 'react';

const DashboardHeader = ({ 
  dateRange, 
  handleStartDateChange,
  handleEndDateChange,
  selectedSeller,
  handleSellerChange,
  dashboardData,
  formatDateForInput
}) => {
  return (
    <div className="dashboard-header">
      <h2 className="dashboard-title">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
        Dashboard de Vendas
      </h2>
      
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
        
        <div className="filter-group">
          <label className="filter-label">Vendedor:</label>
          <select 
            className="filter-select"
            value={selectedSeller}
            onChange={handleSellerChange}
          >
            <option value="all">Todos os Vendedores</option>
            {dashboardData.sellerData.map(seller => (
              <option key={seller.id} value={seller.id}>
                {seller.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;