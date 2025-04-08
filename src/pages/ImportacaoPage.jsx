// src/pages/ImportacaoPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Parse from 'parse/dist/parse.min.js';
import './ImportacaoPage.css';
import releaseService from '../services/releaseService';
import excelService from '../services/excelService';
import salesService from '../services/salesService';
import { 
  createSafeDate, 
  normalizeDateToNoon, 
  formatDateDDMMYYYY 
} from '../utils/DateValidation';

// Importando o componente de data de referência
import DateReferenceSelector from '../components/import/DateReferenceSelector';
import LeadsImportCard from '../components/import/LeadsImportCard';
import SalesImportCard from '../components/import/SalesImportCard';

const ImportacaoPage = () => {
  const navigate = useNavigate();
  const [processedData, setProcessedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sellers, setSellers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [activeSellers, setActiveSellers] = useState([]);
  const [allDataReady, setAllDataReady] = useState(false);
  const [salesData, setSalesData] = useState([]);
  
  // Inicializar a data de referência com meio-dia para evitar problemas de fuso horário
  const today = new Date();
  const [referenceDate, setReferenceDate] = useState(
    createSafeDate(today.getFullYear(), today.getMonth() + 1, today.getDate())
  );

  useEffect(() => {
    // Verificar se o usuário está logado
    const currentUser = Parse.User.current();
    if (!currentUser) {
      navigate('/');
      return;
    }

    // Carregar sellers, channels e vendedoras do Back4app
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Carregar sellers e channels
        const [sellerResults, channelResults] = await Promise.all([
          releaseService.getAllSellers(),
          releaseService.getAllChannels()
        ]);
        
        setSellers(sellerResults);
        setChannels(channelResults);
        
        // Carregar vendedores ativos separadamente para melhor controle de erros
        try {
          const activeSellerResults = await salesService.getActiveSellers();
          setActiveSellers(activeSellerResults);
          console.log("Vendedores ativos carregados:", activeSellerResults.length);
        } catch (error) {
          console.error("Erro ao carregar vendedores ativos:", error);
          // Em caso de erro, usamos todos os vendedores como fallback
          setActiveSellers(sellerResults);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        setError("Erro ao carregar dados. Tente novamente.");
        setLoading(false);
      }
    };
    
    loadData();
  }, [navigate]);

  const handleDateChange = (newDate) => {
    // Garantir que a nova data tenha o horário como meio-dia
    const safeDate = normalizeDateToNoon(newDate);
    setReferenceDate(safeDate);
    
    // Limpar os dados processados quando a data muda
    if (processedData || salesData.length > 0) {
      if (window.confirm("Alterar a data irá limpar os dados já processados. Deseja continuar?")) {
        setProcessedData(null);
        setSalesData([]);
        setAllDataReady(false);
        setError('');
        setSuccess('');
      }
    }
  };

  const handleProcessedData = (data, errorMessage = '') => {
    setLoading(false);
    setProcessedData(data);
    setError(errorMessage);
    setSuccess('');
    
    // Limpar dados de vendas quando novos leads são processados
    if (data) {
      setSalesData([]);
      setAllDataReady(false);
    }
  };

  const handleClearProcessedData = () => {
    setProcessedData(null);
    setSalesData([]);
    setError('');
    setSuccess('');
    setAllDataReady(false);

    // Limpar o input de arquivo
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';
    
    const salesFileInput = document.getElementById('salesFileInput');
    if (salesFileInput) salesFileInput.value = '';
  };

  const handleProcessSalesData = (data) => {
    console.log("Dados de vendas processados:", data);
    setSalesData(data);
    setError('');
    setSuccess('Dados de vendas processados com sucesso!');
  };

  const saveToBackend = async () => {
    if (!processedData || processedData.length === 0) {
      setError('Não há dados processados para salvar.');
      return;
    }
    
    // Verificar se todas as vendedoras têm dados de vendas
    if (!allDataReady) {
      setError('Por favor, processe os dados de vendas antes de salvar.');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // 1. Preparar dados de leads para o Parse
      const releasesData = excelService.prepareDataForParse(
        processedData,
        sellers,
        channels,
        referenceDate
      );
      
      if (releasesData.length === 0) {
        throw new Error('Não foi possível encontrar correspondência entre atendentes e canais no sistema.');
      }
      
      // 2. Mesclar dados de leads com dados de vendas
      const mergedData = mergeLeadsAndSalesData(releasesData, salesData);
      
      // 3. Salvar os dados mesclados no Back4app
      await releaseService.createBulkReleases(mergedData);
      
      setSuccess(`Dados importados com sucesso! ${mergedData.length} registros foram criados/atualizados.`);
      
      // Limpar todos os dados após salvar
      handleClearProcessedData();
      
      // Reset do status de prontidão
      setAllDataReady(false);
      
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      setError(error.message || 'Erro ao salvar os dados no servidor.');
    } finally {
      setLoading(false);
    }
  };

  // Função para mesclar dados de leads e vendas
  const mergeLeadsAndSalesData = (leadsData, salesData) => {
    // Criar uma cópia dos dados de leads para não modificar o original
    const result = [...leadsData];
    
    // Criar um mapa para localizar rapidamente os registros por vendedor e canal
    const dataMap = {};
    
    result.forEach(record => {
      const sellerId = record.sellerId.id;
      const channelId = record.channelId.id;
      const key = `${sellerId}-${channelId}`;
      
      dataMap[key] = record;
    });
    
    // Integrar os dados de vendas
    salesData.forEach(salesRecord => {
      const sellerId = salesRecord.sellerId.id;
      const channelId = salesRecord.channelId.id;
      const key = `${sellerId}-${channelId}`;
      
      if (dataMap[key]) {
        // Se já existe um registro para este vendedor e canal, atualizar os dados de vendas
        dataMap[key].vendas = salesRecord.vendas;
        dataMap[key].bats = salesRecord.bats;
      } else {
        // Se não existe, criar um novo registro com leads = 0
        const newRecord = {
          sellerId: salesRecord.sellerId,
          channelId: salesRecord.channelId,
          dateRelease: referenceDate,
          leads: 0,
          vendas: salesRecord.vendas,
          bats: salesRecord.bats
        };
        
        result.push(newRecord);
        dataMap[key] = newRecord;
      }
    });
    
    return result;
  };

  const handleVoltar = () => {
    navigate('/dashboard');
  };

  return (
    <div className="importacao-container">
      <header className="importacao-header">
        <h1>Importação de Dados</h1>
        <button className="back-button" onClick={handleVoltar}>
          Voltar ao Dashboard
        </button>
      </header>

      <div className="importacao-content">
        {/* Componente de seleção de data de referência centralizado */}
        <DateReferenceSelector 
          date={referenceDate} 
          onChange={handleDateChange} 
          disabled={loading || processedData !== null || salesData.length > 0}
        />
        
        {/* Componente de importação de Leads */}
        <LeadsImportCard
          onProcessedData={handleProcessedData}
          referenceDate={referenceDate}
          processedData={processedData}
          loading={loading}
          error={error}
          success={success}
          onClearProcessedData={handleClearProcessedData}
          onSaveToBackend={saveToBackend}
          allDataReady={allDataReady}
        />
        
        {/* Componente de importação de Vendas */}
        <SalesImportCard
          referenceDate={referenceDate}
          activeSellers={activeSellers}
          processedData={processedData}
          loading={loading}
          onProcess={handleProcessSalesData}
          onSaveToBackend={saveToBackend}
          allDataReady={allDataReady}
          setAllDataReady={setAllDataReady}
          sellers={sellers}
          channels={channels}
        />
      </div>
    </div>
  );
};

export default ImportacaoPage;