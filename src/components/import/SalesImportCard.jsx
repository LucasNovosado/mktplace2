// src/components/import/SalesImportCard.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import excelService from '../../services/excelService';

const SalesImportCard = ({
  referenceDate,
  processedData,
  loading,
  onProcess,
  onSaveToBackend,
  allDataReady,
  setAllDataReady,
  sellers,
  channels
}) => {
  const [salesFile, setSalesFile] = useState(null);
  const [error, setError] = useState('');
  const [salesPreview, setSalesPreview] = useState(null);
  const [processingStatus, setProcessingStatus] = useState({
    processed: false,
    totalVendas: 0,
    totalBats: 0,
    salesBySeller: {}
  });

  // Efeito para verificar se os dados estão prontos para salvar
  useEffect(() => {
    if (processedData && processedData.length > 0 && processingStatus.processed) {
      setAllDataReady(true);
    } else {
      setAllDataReady(false);
    }
  }, [processedData, processingStatus.processed, setAllDataReady]);

  const handleSalesFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Verificar se é um arquivo Excel
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel.sheet.macroEnabled.12'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setError('Por favor, selecione um arquivo Excel válido (.xls or .xlsx).');
      return;
    }
    
    setSalesFile(file);
    setError('');
    setProcessingStatus({
      processed: false,
      totalVendas: 0,
      totalBats: 0,
      salesBySeller: {}
    });
  };

  const processSalesFile = async () => {
    if (!salesFile) {
      setError('Por favor, selecione uma planilha de vendas.');
      return;
    }

    if (!processedData || processedData.length === 0) {
      setError('Por favor, processe os dados de leads primeiro.');
      return;
    }

    setError('');
    
    try {
      // Usar o serviço para processar o arquivo Excel
      const { salesData, salesBySellerAndChannel } = await excelService.convertSalesExcelToParse(
        salesFile,
        referenceDate, // Usar a data de referência compartilhada
        sellers,
        channels
      );
      
      if (salesData.length === 0) {
        throw new Error(`Nenhuma venda encontrada para a data ${formatDisplayDate(referenceDate)}.`);
      }
      
      // Calcular totais para exibição
      let totalVendas = 0;
      let totalBats = 0;
      
      Object.values(salesBySellerAndChannel).forEach(sellerData => {
        Object.values(sellerData.channels).forEach(channelData => {
          totalVendas += channelData.sales;
          totalBats += channelData.bats;
        });
      });
      
      // Atualizar a visualização
      setSalesPreview(salesBySellerAndChannel);
      
      // Atualizar o status do processamento
      setProcessingStatus({
        processed: true,
        totalVendas,
        totalBats,
        salesBySeller: salesBySellerAndChannel
      });
      
      // Chamar o callback passando os dados processados
      onProcess(salesData);
      
    } catch (error) {
      console.error('Erro ao processar arquivo de vendas:', error);
      setError(error.message || 'Erro ao processar o arquivo de vendas.');
    }
  };

  // Formatar data para exibição
  const formatDisplayDate = (date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="import-card sales-import-card">
      <h2>Importar Planilha de Vendas</h2>
      <p>
        Selecione uma planilha Excel com as vendas. Cada aba deve representar um vendedor,
        e cada linha representa uma venda. As vendas serão registradas na data de referência: <strong>{formatDisplayDate(referenceDate)}</strong>.
      </p>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="upload-section">
        <input
          type="file"
          id="salesFileInput"
          accept=".xlsx, .xls"
          onChange={handleSalesFileChange}
          className="file-input"
          disabled={loading}
        />
        <label htmlFor="salesFileInput" className="file-label">
          {salesFile ? salesFile.name : 'Escolher planilha de vendas...'}
        </label>
        
        <button 
          className="process-button" 
          onClick={processSalesFile}
          disabled={!salesFile || loading || !processedData || processedData.length === 0}
        >
          {loading ? 'Processando...' : 'Processar Vendas'}
        </button>
      </div>
      
      {salesPreview && processingStatus.processed && (
        <div className="results-section">
          <h3>Resultados Processados - Vendas</h3>
          <p className="date-info">
            <strong>Data de Referência:</strong> {formatDisplayDate(referenceDate)}
          </p>
          
          <div className="sales-summary">
            <p><strong>Total de Vendas:</strong> {processingStatus.totalVendas}</p>
            <p><strong>Total de Vendas BATS:</strong> {processingStatus.totalBats}</p>
          </div>
          
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vendedor</th>
                  <th>Canal</th>
                  <th>Vendas</th>
                  <th>BATS</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(processingStatus.salesBySeller).map(([sellerId, sellerData]) => (
                  Object.entries(sellerData.channels).map(([channelId, channelData], index) => (
                    <tr key={`${sellerId}-${channelId}`}>
                      {index === 0 ? (
                        <td rowSpan={Object.keys(sellerData.channels).length}>
                          {sellerData.sellerName}
                        </td>
                      ) : null}
                      <td>{channelData.channelName}</td>
                      <td>{channelData.sales}</td>
                      <td>{channelData.bats}</td>
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          </div>
          
          {allDataReady && (
            <div className="sales-actions">
              <button
                className="save-button"
                onClick={onSaveToBackend}
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Salvar no Sistema'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

SalesImportCard.propTypes = {
  referenceDate: PropTypes.instanceOf(Date).isRequired,
  processedData: PropTypes.array,
  loading: PropTypes.bool.isRequired,
  onProcess: PropTypes.func.isRequired,
  onSaveToBackend: PropTypes.func.isRequired,
  allDataReady: PropTypes.bool.isRequired,
  setAllDataReady: PropTypes.func.isRequired,
  sellers: PropTypes.array.isRequired,
  channels: PropTypes.array.isRequired
};

export default SalesImportCard;