import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartContainer from '../common/ChartContainer';
import DataTable from '../common/DataTable';

const TimelineTab = ({ displayTimelineData }) => {
  return (
    <div className="tab-content">
      {/* Gráfico de linha - Evolução diária */}
      <ChartContainer title="Evolução Diária">
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
            <Line 
              type="monotone" 
              dataKey="taxa" 
              name="Taxa de Conversão (%)" 
              stroke="#9C27B0" 
              strokeWidth={2}
              yAxisId="right"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
      
      {/* Tabela cronológica */}
      <DataTable 
        title="Dados Diários"
        columns={['Data', 'Leads', 'Vendas', 'BATS', 'Taxa de Conversão']}
        data={displayTimelineData.map(day => ({
          dateFormatted: day.dateFormatted,
          leads: day.leads,
          vendas: day.vendas,
          bats: day.bats,
          taxa: `${day.taxa.toFixed(2)}%`
        }))}
      />
    </div>
  );
};

export default TimelineTab;