import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Parse from 'parse/dist/parse.min.js';
import releaseService from '../../../services/releaseService';
import './ReleasesTab.css';

const ReleasesTab = ({ dateRange }) => {
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [channels, setChannels] = useState([]);
  const navigate = useNavigate();

  // Carregar lançamentos
  useEffect(() => {
    const fetchReleases = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Ajustar datas para incluir o dia inteiro
        const startDate = new Date(dateRange.startDate);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(dateRange.endDate);
        endDate.setHours(23, 59, 59, 999);
        
        // Buscar lançamentos no período
        const results = await releaseService.getReleasesByDateRange(startDate, endDate);
        setReleases(results);
        
        // Extrair canais únicos para o filtro
        const uniqueChannels = [...new Set(results.map(release => {
          const channel = release.get('channelId');
          return channel ? channel.get('name') : null;
        }).filter(Boolean))];
        
        setChannels(uniqueChannels);
      } catch (error) {
        console.error('Erro ao carregar lançamentos:', error);
        setError('Erro ao carregar lançamentos. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReleases();
  }, [dateRange]);

  // Filtro de texto
  const handleFilterChange = (e) => {
    setFilter(e.target.value.toLowerCase());
  };
  
  // Filtro de canal
  const handleChannelChange = (e) => {
    setSelectedChannel(e.target.value);
  };
  
  // Função para navegar para a edição
  const handleEditRelease = (releaseId) => {
    navigate(`/releases/${releaseId}`);
  };
  
  // Função para criar novo lançamento
  const handleCreateRelease = () => {
    navigate('/releases/new');
  };
  
  // Função para excluir lançamento
  const handleDeleteRelease = async (releaseId) => {
    if (window.confirm('Tem certeza que deseja excluir este lançamento?')) {
      try {
        const Release = Parse.Object.extend("Releases");
        const query = new Parse.Query(Release);
        const releaseObj = await query.get(releaseId);
        
        await releaseObj.destroy();
        
        // Atualizar a lista após excluir
        setReleases(releases.filter(release => release.id !== releaseId));
      } catch (error) {
        console.error('Erro ao excluir lançamento:', error);
        alert('Erro ao excluir lançamento. Por favor, tente novamente.');
      }
    }
  };
  
  // Filtrar lançamentos
  const filteredReleases = releases.filter(release => {
    // Filtro de texto
    const sellerName = release.get('sellerId')?.get('seller')?.toLowerCase() || '';
    const channelName = release.get('channelId')?.get('name')?.toLowerCase() || '';
    const textMatch = sellerName.includes(filter) || channelName.includes(filter);
    
    // Filtro de canal
    const channelMatch = selectedChannel === 'all' || 
      (release.get('channelId') && release.get('channelId').get('name') === selectedChannel);
    
    return textMatch && channelMatch;
  });
  
  // Ordenar por data (mais recentes primeiro)
  const sortedReleases = [...filteredReleases].sort((a, b) => {
    const dateA = a.get('dateRelease');
    const dateB = b.get('dateRelease');
    return dateB - dateA;
  });
  
  // Formatação de data para exibição
  const formatDate = (date) => {
    if (!date) return '';
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  // Calcular taxa de conversão
  const calcConversionRate = (leads, vendas) => {
    if (leads > 0) {
      return ((vendas / leads) * 100).toFixed(2) + '%';
    }
    return '0.00%';
  };

  if (loading) {
    return (
      <div className="releases-loading">
        <div className="loading-spinner"></div>
        <p>Carregando lançamentos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="releases-error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Tentar novamente</button>
      </div>
    );
  }

  return (
    <div className="releases-tab">
      <div className="releases-header">
        <h3>Gerenciamento de Lançamentos</h3>
        <button className="create-button" onClick={handleCreateRelease}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Novo Lançamento
        </button>
      </div>
      
      <div className="releases-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Filtrar por vendedor ou canal..."
            value={filter}
            onChange={handleFilterChange}
            className="filter-input"
          />
        </div>
        
        <div className="filter-group">
          <select
            value={selectedChannel}
            onChange={handleChannelChange}
            className="filter-select"
          >
            <option value="all">Todos os Canais</option>
            {channels.map((channel, index) => (
              <option key={index} value={channel}>
                {channel}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {sortedReleases.length === 0 ? (
        <div className="no-releases">
          <p>Nenhum lançamento encontrado para o período selecionado.</p>
          <button className="create-button" onClick={handleCreateRelease}>
            Criar um lançamento
          </button>
        </div>
      ) : (
        <div className="releases-table-wrapper">
          <table className="releases-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Vendedor</th>
                <th>Canal</th>
                <th>Leads</th>
                <th>Vendas</th>
                <th>BATS</th>
                <th>Conversão</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {sortedReleases.map(release => {
                const seller = release.get('sellerId');
                const channel = release.get('channelId');
                const leads = release.get('leads') || 0;
                const vendas = release.get('vendas') || 0;
                const bats = release.get('bats') || 0;
                
                return (
                  <tr key={release.id}>
                    <td>{formatDate(release.get('dateRelease'))}</td>
                    <td>{seller ? seller.get('seller') : 'N/A'}</td>
                    <td>
                      <span className={`channel-badge ${channel ? channel.get('name').toLowerCase().replace(/\s+/g, '-') : ''}`}>
                        {channel ? channel.get('name') : 'N/A'}
                      </span>
                    </td>
                    <td>{leads}</td>
                    <td>{vendas}</td>
                    <td>{bats}</td>
                    <td>{calcConversionRate(leads, vendas)}</td>
                    <td className="action-cell">
                      <button 
                        className="edit-button" 
                        onClick={() => handleEditRelease(release.id)}
                        aria-label="Editar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button 
                        className="delete-button" 
                        onClick={() => handleDeleteRelease(release.id)}
                        aria-label="Excluir"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReleasesTab;