import React from 'react';
import OverviewCards from './OverviewCards';
import TimelineChart from './TimelineChart';
import ChartContainer from '../common/ChartContainer';
import DataTable from '../common/DataTable';
import './TimelineChart.css';

const OverviewTab = ({ filteredData, displayTimelineData, dashboardData }) => {
  return (
    <div className="tab-content">
      {/* Cards de visão geral */}
      <OverviewCards totals={filteredData.totals} />
      
      {/* Gráfico de vendas por período - Usando o componente personalizado */}
      <ChartContainer title="Evolução de Vendas e Leads">
        <TimelineChart data={displayTimelineData} />
      </ChartContainer>
      
      {/* Tabela de resumo - com percentuais arredondados */}
      <DataTable 
        title="Resumo por Vendedor"
        columns={['Vendedor', 'Leads', 'Vendas', 'BATS', 'Taxa de Conversão', 'Taxa BATS']}
        data={dashboardData.sellerData.map(seller => ({
          name: seller.name,
          leads: seller.leads,
          vendas: seller.vendas,
          bats: seller.bats,
          taxaConversao: `${Math.round(seller.taxaConversao)}%`,
          taxaBats: `${Math.round(seller.taxaBats || (seller.vendas > 0 ? (seller.bats / seller.vendas * 100) : 0))}%`
        }))}
      />
    </div>
  );
};

export default OverviewTab;