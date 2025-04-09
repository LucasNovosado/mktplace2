import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartContainer from '../common/ChartContainer';
import DataTable from '../common/DataTable';
import '../common/DataTable.css';
import '../common/ChartContainer.css';

const SellersTab = ({ dashboardData }) => {
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

  // Ordenar vendedores por vendas e adicionar ranking
  const rankedSellerData = [...dashboardData.sellerData]
    .sort((a, b) => b.vendas - a.vendas)
    .map((seller, index) => {
      // Calcular média de vendas por dia útil
      const mediaVendas = seller.vendas / diasUteis;
      
      return {
        rank: index + 1,
        name: seller.name,
        vendas: seller.vendas,
        leads: seller.leads,
        bats: seller.bats,
        taxaConversao: `${Math.floor(seller.taxaConversao)}%`, // Remover casas decimais
        mediaVendas: `${mediaVendas.toFixed(1)} | ${diasUteis}` // Formato: "Média | Dias"
      };
    });

  return (
    <div className="tab-content">
      {/* Gráfico de barras - Vendas por vendedor */}
      <ChartContainer title="Desempenho por Vendedor" centered={true}>
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
            <Bar dataKey="vendas" name="Vendas" fill="#2E7D32" />
            <Bar dataKey="leads" name="Leads" fill="#1976D2" />
            <Bar dataKey="bats" name="BATS" fill="#ED6C02" />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
      
      {/* Tabela detalhada de vendedores */}
      <DataTable 
        title="Detalhes por Vendedor (Ranking por Vendas)"
        columns={['Posição', 'Vendedor', 'Vendas', 'Leads', 'BATS', 'Taxa de Conversão', 'Média | Dias']}
        data={rankedSellerData}
        centered={true}
      />
    </div>
  );
};

export default SellersTab;