// src/components/import/LeadsImportCard.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import excelService from '../../services/excelService';

const LeadsImportCard = ({ 
  onProcessedData, 
  referenceDate, 
  processedData, 
  loading, 
  error,
  success,
  onClearProcessedData,
  onSaveToBackend,
  allDataReady
}) => {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    if (error) onProcessedData(null); // Clear any previous error
  };

  const processFile = async () => {
    if (!file) {
      onProcessedData(null, 'Por favor, selecione um arquivo para importar os leads.');
      return;
    }

    try {
      // Ler e processar a planilha
      const data = await excelService.readExcelFile(file);
      
      if (!data || data.length === 0) {
        throw new Error('Arquivo vazio ou inválido.');
      }
      
      // Verificar colunas necessárias
      const requiredColumns = ['Atendente', 'Nome', 'Tags'];
      const fileColumns = Object.keys(data[0]);
      
      const missingColumns = requiredColumns.filter(col => !fileColumns.includes(col));
      if (missingColumns.length > 0) {
        throw new Error(`Colunas obrigatórias não encontradas: ${missingColumns.join(', ')}`);
      }
      
      // Processar dados conforme requisitos
      const processedData = excelService.processAttendanceData(data);
      onProcessedData(processedData);
      
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      onProcessedData(null, error.message || 'Erro ao processar o arquivo.');
    }
  };

  // Formatar data para exibição amigável
  const formatDate = (date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="import-card">
      <h2>Importar Planilha de Atendimentos (Leads)</h2>
      <p>
        Selecione uma planilha Excel (.xlsx) com as colunas "Atendente", "Nome" e "Tags" para importar os dados de atendimentos.
      </p>
      
      <div className="form-controls">
        <div className="upload-section">
          <input
            type="file"
            id="fileInput"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="file-input"
          />
          <label htmlFor="fileInput" className="file-label">
            {file ? file.name : 'Escolher arquivo...'}
          </label>
          
          <button 
            className="process-button" 
            onClick={processFile}
            disabled={!file || loading}
          >
            {loading ? 'Processando...' : 'Processar Arquivo'}
          </button>
        </div>
      </div>
      
      {processedData && processedData.length > 0 && (
        <div className="results-section">
          <h3>Resultados Processados - Leads</h3>
          <p className="date-info">
            <strong>Data de Referência:</strong> {formatDate(referenceDate)}
          </p>
          
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Atendente</th>
                  <th>E-commerce</th>
                  <th>Facebook</th>
                  <th>Google</th>
                  <th>Landing Pages</th>
                  <th>Sites</th>
                  <th>Instagram</th>
                </tr>
              </thead>
              <tbody>
                {processedData.map((item, index) => (
                  <tr key={index}>
                    <td>{item.attendant}</td>
                    <td>{item.channels.ecommerce}</td>
                    <td>{item.channels.facebook}</td>
                    <td>{item.channels.google}</td>
                    <td>{item.channels.landingpages}</td>
                    <td>{item.channels.sites}</td>
                    <td>{item.channels.instagram || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="action-buttons">
            <button
              className="cancel-button"
              onClick={onClearProcessedData}
            >
              Cancelar
            </button>
            
            {allDataReady && (
              <button
                className="save-button"
                onClick={onSaveToBackend}
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Salvar no Sistema'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

LeadsImportCard.propTypes = {
  onProcessedData: PropTypes.func.isRequired,
  referenceDate: PropTypes.instanceOf(Date).isRequired,
  processedData: PropTypes.array,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string,
  success: PropTypes.string,
  onClearProcessedData: PropTypes.func.isRequired,
  onSaveToBackend: PropTypes.func.isRequired,
  allDataReady: PropTypes.bool.isRequired
};

export default LeadsImportCard;