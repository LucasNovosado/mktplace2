import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartContainer from '../common/ChartContainer';
import DataTable from '../common/DataTable';
import '../common/DataTable.css';
import '../common/ChartContainer.css';

const ChannelsTab = ({ dashboardData }) => {
  // Calcular dias úteis entre as datas (excluindo domingos)
  const calcularDiasUteis = (dataInicio, dataFim) => {
    let diasUteis = 0;
    let dataAtual = new Date(dataInicio);
    
    while (dataAtual <= dataFim) {
      // 0 = Domingo, 1-6 = Segunda a Sábado
      if (dataAtual.getDay() !== 0) {
        diasUteis++;
      }
      
      // Avançar para o próximo dia
      dataAtual.setDate(dataAtual.getDate() + 1);
    }
    
    return diasUteis > 0 ? diasUteis : 1; // Garantir que não dividimos por zero
  };

  // Calcular dias úteis no período selecionado
  const diasUteis = calcularDiasUteis(dashboardData.period.start, dashboardData.period.end);

  // Ordenar canais por vendas e adicionar ranking
  const rankedChannelData = [...dashboardData.channelData]
    .sort((a, b) => b.vendas - a.vendas)
    .map((channel, index) => {
      // Calcular média de vendas por dia útil
      const mediaVendas = channel.vendas / diasUteis;
      
      return {
        rank: index + 1,
        name: channel.name,
        vendas: channel.vendas,
        leads: channel.leads,
        bats: channel.bats,
        taxaConversao: `${Math.floor(channel.taxaConversao)}%`, // Remover casas decimais
        mediaVendas: `${mediaVendas.toFixed(1)} | ${diasUteis}` // Formato: "Média | Dias"
      };
    });

  return (
    <div className="tab-content">
      {/* Gráfico de barras - Desempenho por canal */}
      <ChartContainer title="Desempenho por Canal" centered={true}>
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
            <Bar dataKey="vendas" name="Vendas" fill="#2E7D32" />
            <Bar dataKey="leads" name="Leads" fill="#1976D2" />
            <Bar dataKey="bats" name="BATS" fill="#ED6C02" />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
      
      {/* Tabela de canais */}
      <DataTable 
        title="Detalhes por Canal (Ranking por Vendas)"
        columns={['Posição', 'Canal', 'Vendas', 'Leads', 'BATS', 'Taxa de Conversão', 'Média | Dias']}
        data={rankedChannelData}
        centered={true}
      />
    </div>
  );
};

export default ChannelsTab;