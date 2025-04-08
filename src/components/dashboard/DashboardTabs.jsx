import React from 'react';

const DashboardTabs = ({ activeTab, setActiveTab }) => {
  return (
    <div className="dashboard-tabs">
      <button 
        className={`dashboard-tab ${activeTab === 'overview' ? 'active' : ''}`}
        onClick={() => setActiveTab('overview')}
      >
        Visão Geral
      </button>
      <button 
        className={`dashboard-tab ${activeTab === 'vendedores' ? 'active' : ''}`}
        onClick={() => setActiveTab('vendedores')}
      >
        Vendedores
      </button>
      <button 
        className={`dashboard-tab ${activeTab === 'canais' ? 'active' : ''}`}
        onClick={() => setActiveTab('canais')}
      >
        Canais
      </button>
      <button 
        className={`dashboard-tab ${activeTab === 'cronologia' ? 'active' : ''}`}
        onClick={() => setActiveTab('cronologia')}
      >
        Cronologia
      </button>
    </div>
  );
};

export default DashboardTabs;