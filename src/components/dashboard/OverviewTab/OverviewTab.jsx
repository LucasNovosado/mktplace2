import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import OverviewCards from './OverviewCards';
import ChartContainer from '../common/ChartContainer';
import DataTable from '../common/DataTable';
import BusinessDayAverageCard from '../common/BusinessDayAverageCard';
import '../common/BusinessDayAverageCard.css';
import RevenueCalculator from './RevenueCalculator';
import financesService from '../../../services/financesService'; // Você precisará criar este serviço

const OverviewTab = ({ filteredData, displayTimelineData, dashboardData }) => {
  // Estado para o ticket médio
  const [ticketMedio, setTicketMedio] = useState(237);

  // Buscar o ticket médio quando o componente montar
  useEffect(() => {
    const fetchTicketMedio = async () => {
      try {
        const valor = await financesService.getTicketMedio();
        setTicketMedio(valor);
      } catch (error) {
        console.error("Erro ao buscar ticket médio:", error);
      }
    };

    fetchTicketMedio();
  }, []);

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

  // Classificar vendedores por volume de vendas e adicionar rank
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
      {/* Cards de visão geral */}
      <OverviewCards totals={filteredData.totals} />
      
      {/* Média por dia útil */}
      <BusinessDayAverageCard 
        data={filteredData.totals}
        startDate={dashboardData.period.start}
        endDate={dashboardData.period.end}
        title="Média por Dia Útil (Visão Geral)"
        centered={true}
      />

      {/* Calculadora de Faturamento */}
      <RevenueCalculator 
  vendas={filteredData.totals.vendas}
  bats={filteredData.totals.bats}
/>
      
      {/* Gráfico de vendas por período */}
      <ChartContainer title="Vendas e Leads por Período" centered={true}>
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
              dataKey="vendas" 
              name="Vendas" 
              stroke="#2E7D32" 
              strokeWidth={2}
              activeDot={{ r: 8 }}
            />
            <Line 
              type="monotone" 
              dataKey="leads" 
              name="Leads" 
              stroke="#1976D2" 
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
      
      {/* Tabela de resumo com ranking */}
      <DataTable 
        title="Resumo por Vendedor (Ranking por Vendas)"
        columns={['Posição', 'Vendedor', 'Vendas', 'Leads', 'BATS', 'Taxa de Conversão', 'Média | Dias']}
        data={rankedSellerData}
        centered={true}
      />
    </div>
  );
};

export default OverviewTab;