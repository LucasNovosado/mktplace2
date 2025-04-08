import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartContainer from '../common/ChartContainer';
import DataTable from '../common/DataTable';

const ChannelsTab = ({ dashboardData }) => {
  return (
    <div className="tab-content">
      {/* Gráfico de barras - Desempenho por canal */}
      <ChartContainer title="Desempenho por Canal">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={dashboardData.channelChartData}
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
      
      {/* Tabela de canais */}
      <DataTable 
        title="Detalhes por Canal"
        columns={['Canal', 'Leads', 'Vendas', 'BATS', 'Taxa de Conversão']}
        data={dashboardData.channelData.map(channel => ({
          name: channel.name,
          leads: channel.leads,
          vendas: channel.vendas,
          bats: channel.bats,
          taxaConversao: `${channel.taxaConversao.toFixed(2)}%`
        }))}
      />
    </div>
  );
};

export default ChannelsTab;