import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import OverviewCards from './OverviewCards';
import ChartContainer from '../common/ChartContainer';
import DataTable from '../common/DataTable';
import BusinessDayAverageCard from '../common/BusinessDayAverageCard';
import '../common/BusinessDayAverageCard.css';

const OverviewTab = ({ filteredData, displayTimelineData, dashboardData }) => {
  return (
    <div className="tab-content">
      {/* Cards de visão geral */}
      <OverviewCards totals={filteredData.totals} />
      
      {/* Média por dia útil */}
      <BusinessDayAverageCard 
        data={filteredData.totals}
        startDate={dashboardData.period.start}
        endDate={dashboardData.period.end}
        title="Média por Dia Útil (Visão Geral)"
      />
      
      {/* Gráfico de vendas por período */}
      <ChartContainer title="Vendas e Leads por Período">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={displayTimelineData}
            margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="dateFormatted" 
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="leads" 
              name="Leads" 
              stroke="#1976D2" 
              strokeWidth={2}
              activeDot={{ r: 8 }}
            />
            <Line 
              type="monotone" 
              dataKey="vendas" 
              name="Vendas" 
              stroke="#2E7D32" 
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="bats" 
              name="BATS" 
              stroke="#ED6C02" 
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
      
      {/* Tabela de resumo */}
      <DataTable 
        title="Resumo por Vendedor"
        columns={['Vendedor', 'Leads', 'Vendas', 'BATS', 'Taxa de Conversão']}
        data={dashboardData.sellerData.map(seller => ({
          name: seller.name,
          leads: seller.leads,
          vendas: seller.vendas,
          bats: seller.bats,
          taxaConversao: `${seller.taxaConversao.toFixed(2)}%`
        }))}
      />
    </div>
  );
};

export default OverviewTab;