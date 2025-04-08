import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartContainer from '../common/ChartContainer';
import DataTable from '../common/DataTable';

const SellersTab = ({ dashboardData }) => {
  return (
    <div className="tab-content">
      {/* Gráfico de barras - Vendas por vendedor */}
      <ChartContainer title="Desempenho por Vendedor">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={dashboardData.sellerChartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="leads" name="Leads" fill="#1976D2" />
            <Bar dataKey="vendas" name="Vendas" fill="#2E7D32" />
            <Bar dataKey="bats" name="BATS" fill="#ED6C02" />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
      
      {/* Tabela detalhada de vendedores */}
      <DataTable 
        title="Detalhes por Vendedor"
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

export default SellersTab;