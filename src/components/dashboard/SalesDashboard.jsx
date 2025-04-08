// src/components/dashboard/SalesDashboard.jsx
import React, { useState, useEffect } from 'react';
import dashboardService from '../../services/dashboardService';
import DashboardHeader from './DashboardHeader';
import DashboardTabs from './DashboardTabs';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import NoDataState from './NoDataState';
import OverviewTab from './OverviewTab/OverviewTab';
import SellersTab from './SellersTab/SellersTab';
import ChannelsTab from './ChannelsTab/ChannelsTab';
import TimelineTab from './TimelineTab/TimelineTab';
import './SalesDashboard.css';

const SalesDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [timelineData, setTimelineData] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedSeller, setSelectedSeller] = useState('all');
  
  // Estado para os filtros de data
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    // Primeiro dia do mês atual
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      startDate: firstDay,
      endDate: today
    };
  });
  
  // Carregar dados ao montar o componente ou quando os filtros mudam
  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);
  
  // Função para garantir que as datas estejam no formato correto
  const normalizeDate = (date) => {
    // Se já for um objeto Date, retorna uma cópia
    if (date instanceof Date) {
      return new Date(date);
    }
    // Se for uma string, converte para Date
    return new Date(date);
  };
  
  // Função para carregar dados com base nos filtros
  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Criar cópias e normalizar as datas
      const startDate = normalizeDate(dateRange.startDate);
      const endDate = normalizeDate(dateRange.endDate);
      
      console.log('Carregando dashboard com período:', 
        startDate.toLocaleDateString(), 'até', endDate.toLocaleDateString());
      
      // Buscar dados do dashboard
      const data = await dashboardService.getDashboardData(startDate, endDate);
      setDashboardData(data);
      
      // Buscar dados de timeline
      const timeline = await dashboardService.getDailyData(startDate, endDate);
      setTimelineData(timeline);
      
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      setError('Ocorreu um erro ao carregar os dados. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Manipuladores para filtros
  const handleStartDateChange = (e) => {
    const inputDate = e.target.value; // Formato YYYY-MM-DD
    
    // Converter para Date seguindo o padrão da timezone local
    // Importante: adicionar T00:00:00 para garantir que a data é interpretada no fuso horário local
    const newStartDate = new Date(`${inputDate}T00:00:00`);
    
    console.log(`Nova data inicial selecionada: ${inputDate} -> ${newStartDate.toLocaleDateString()}`);
    
    setDateRange(prev => ({
      ...prev,
      startDate: newStartDate
    }));
  };
  
  const handleEndDateChange = (e) => {
    const inputDate = e.target.value; // Formato YYYY-MM-DD
    
    // Converter para Date seguindo o padrão da timezone local
    // Adicionamos T23:59:59 para garantir que o dia completo seja considerado
    const newEndDate = new Date(`${inputDate}T23:59:59`);
    
    console.log(`Nova data final selecionada: ${inputDate} -> ${newEndDate.toLocaleDateString()}`);
    
    setDateRange(prev => ({
      ...prev,
      endDate: newEndDate
    }));
  };
  
  const handleSellerChange = (e) => {
    setSelectedSeller(e.target.value);
  };
  
  // Função para filtrar dados com base no vendedor selecionado
  const getFilteredData = () => {
    if (!dashboardData) return null;
    
    if (selectedSeller === 'all') {
      return dashboardData;
    }
    
    // Filtrar dados por vendedor selecionado
    const filteredSellerData = dashboardData.sellerData.filter(
      seller => seller.id === selectedSeller
    );
    
    // Totais específicos para o vendedor selecionado
    const sellerTotals = filteredSellerData.length > 0 ? {
      leads: filteredSellerData[0].leads,
      vendas: filteredSellerData[0].vendas,
      bats: filteredSellerData[0].bats,
      taxaConversao: filteredSellerData[0].taxaConversao
    } : {
      leads: 0,
      vendas: 0,
      bats: 0,
      taxaConversao: 0
    };
    
    // Filtrar timeline para o vendedor selecionado
    const filteredTimelineData = timelineData.map(day => {
      const sellerData = day.sellers.find(s => s.id === selectedSeller);
      return {
        ...day,
        leads: sellerData ? sellerData.leads : 0,
        vendas: sellerData ? sellerData.vendas : 0,
        bats: sellerData ? sellerData.bats : 0,
        taxa: sellerData && sellerData.leads > 0 
          ? parseFloat(((sellerData.vendas / sellerData.leads) * 100).toFixed(2)) 
          : 0
      };
    });
    
    return {
      ...dashboardData,
      totals: sellerTotals,
      filteredTimelineData
    };
  };
  
  // Dados filtrados
  const filteredData = getFilteredData();
  
  // Dados de timeline a serem usados (filtrados ou não)
  const displayTimelineData = selectedSeller !== 'all' && filteredData?.filteredTimelineData 
    ? filteredData.filteredTimelineData 
    : timelineData;
  
  // Formatação de datas para inputs
  const formatDateForInput = (date) => {
    if (!date) return '';
    
    const normalizedDate = normalizeDate(date);
    const year = normalizedDate.getFullYear();
    const month = String(normalizedDate.getMonth() + 1).padStart(2, '0');
    const day = String(normalizedDate.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };
  
  // Renderização condicional: Loading
  if (loading) {
    return <LoadingState />;
  }
  
  // Renderização condicional: Erro
  if (error) {
    return <ErrorState error={error} onRetry={loadDashboardData} />;
  }
  
  // Renderização condicional: Sem dados
  if (!dashboardData || !filteredData) {
    return (
      <NoDataState 
        dateRange={dateRange}
        handleStartDateChange={handleStartDateChange}
        handleEndDateChange={handleEndDateChange}
        formatDateForInput={formatDateForInput}
      />
    );
  }

  return (
    <div className="sales-dashboard">
      <DashboardHeader 
        dateRange={dateRange}
        handleStartDateChange={handleStartDateChange}
        handleEndDateChange={handleEndDateChange}
        selectedSeller={selectedSeller}
        handleSellerChange={handleSellerChange}
        dashboardData={dashboardData}
        formatDateForInput={formatDateForInput}
      />
      
      <DashboardTabs 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      
      {activeTab === 'overview' && (
        <OverviewTab 
          filteredData={filteredData}
          displayTimelineData={displayTimelineData}
          dashboardData={dashboardData}
        />
      )}
      
      {activeTab === 'vendedores' && (
        <SellersTab 
          dashboardData={dashboardData}
        />
      )}
      
      {activeTab === 'canais' && (
        <ChannelsTab 
          dashboardData={dashboardData}
        />
      )}
      
      {activeTab === 'cronologia' && (
        <TimelineTab 
          displayTimelineData={displayTimelineData}
        />
      )}
    </div>
  );
};

export default SalesDashboard;