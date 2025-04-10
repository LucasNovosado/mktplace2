// src/pages/EditReleasePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Parse from 'parse/dist/parse.min.js';
import releaseService from '../services/releaseService';
import { formatDateDDMMYYYY, normalizeDateToNoon, formatDateYYYYMMDD } from '../utils/DateValidation';
import './EditReleasePage.css';

const EditReleasePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [release, setRelease] = useState(null);
  const [formData, setFormData] = useState({
    leads: '',
    vendas: '',
    bats: '',
    date: '',
    sellerId: '',
    channelId: ''
  });
  const [sellers, setSellers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [sellerReleases, setSellerReleases] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showSummary, setShowSummary] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Buscar dados iniciais
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const currentUser = Parse.User.current();
        if (!currentUser) {
          navigate('/');
          return;
        }

        // Buscar dados do release, sellers e channels
        const [sellerResults, channelResults] = await Promise.all([
          releaseService.getAllSellers(),
          releaseService.getAllChannels()
        ]);
        setSellers(sellerResults);
        setChannels(channelResults);

        // Se temos um ID, buscamos os dados do release
        if (id && id !== 'new') {
          // Buscar dados do release específico
          const Release = Parse.Object.extend("Releases");
          const query = new Parse.Query(Release);
          query.include("sellerId");
          query.include("channelId");
          
          const releaseObj = await query.get(id);
          setRelease(releaseObj);
          
          const releaseDate = releaseObj.get('dateRelease');
          const sellerId = releaseObj.get('sellerId');
          const channelId = releaseObj.get('channelId');

          setFormData({
            leads: releaseObj.get('leads') || 0,
            vendas: releaseObj.get('vendas') || 0,
            bats: releaseObj.get('bats') || 0,
            date: releaseDate,
            sellerId: sellerId ? sellerId.id : '',
            channelId: channelId ? channelId.id : ''
          });
          
          setSelectedDate(releaseDate);
          setEditMode(true);
          
          if (sellerId) {
            // Carregar todos os lançamentos desta vendedora na mesma data
            await fetchSellerReleasesForDate(sellerId, releaseDate);
          }
        } else {
          // Caso de novo lançamento
          const today = new Date();
          today.setHours(12, 0, 0, 0); // Normalizar para meio-dia
          
          setFormData({
            leads: 0,
            vendas: 0,
            bats: 0,
            date: today,
            sellerId: '',
            channelId: ''
          });
          
          setSelectedDate(today);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setError('Erro ao carregar dados. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  // Carregar lançamentos de um vendedor em uma data específica
  const fetchSellerReleasesForDate = async (seller, date) => {
    try {
      // Ajustar datas para considerar o dia todo
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      // Buscar todos os lançamentos do vendedor na data
      const Release = Parse.Object.extend("Releases");
      const query = new Parse.Query(Release);
      query.equalTo("sellerId", seller);
      query.greaterThanOrEqualTo("dateRelease", startDate);
      query.lessThanOrEqualTo("dateRelease", endDate);
      query.include("channelId");
      
      const results = await query.find();
      setSellerReleases(results);
      setShowSummary(true);
    } catch (error) {
      console.error('Erro ao buscar lançamentos do vendedor:', error);
      setError('Erro ao buscar lançamentos do vendedor.');
    }
  };

  // Manipulador para mudanças nos campos do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Para campos numéricos, converter para número ou definir como 0 se vazio
    if (['leads', 'vendas', 'bats'].includes(name)) {
      const numValue = value === '' ? '' : parseInt(value, 10);
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Manipulador para mudança de data
  const handleDateChange = (e) => {
    const dateValue = e.target.value; // formato YYYY-MM-DD
    const dateParts = dateValue.split('-');
    const newDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 12, 0, 0);
    
    setFormData(prev => ({
      ...prev,
      date: normalizeDateToNoon(newDate)
    }));
    
    setSelectedDate(newDate);
    
    // Se já tiver vendedor selecionado, buscar lançamentos na nova data
    if (formData.sellerId) {
      const sellerObj = sellers.find(seller => seller.id === formData.sellerId);
      if (sellerObj) {
        fetchSellerReleasesForDate(sellerObj, newDate);
      }
    } else {
      // Limpar lançamentos anteriores se não tiver vendedor
      setSellerReleases([]);
      setShowSummary(false);
    }
  };
  
  // Quando o vendedor muda, buscar seus lançamentos na data selecionada
  const handleSellerChange = (e) => {
    const newSellerId = e.target.value;
    
    setFormData(prev => ({
      ...prev,
      sellerId: newSellerId
    }));
    
    if (newSellerId && selectedDate) {
      const selectedSeller = sellers.find(seller => seller.id === newSellerId);
      if (selectedSeller) {
        fetchSellerReleasesForDate(selectedSeller, selectedDate);
      }
    } else {
      setSellerReleases([]);
      setShowSummary(false);
    }
  };

  // Manipulador para salvar os dados
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      setSaving(true);
      
      // Validar campos obrigatórios
      if (!formData.sellerId || !formData.channelId || !formData.date) {
        throw new Error('Por favor, preencha todos os campos obrigatórios.');
      }
      
      // Encontrar objetos de vendedor e canal
      const sellerObj = sellers.find(seller => seller.id === formData.sellerId);
      const channelObj = channels.find(channel => channel.id === formData.channelId);
      
      if (!sellerObj || !channelObj) {
        throw new Error('Vendedor ou canal inválido.');
      }
      
      const releaseData = {
        dateRelease: formData.date,
        leads: parseInt(formData.leads || 0, 10),
        vendas: parseInt(formData.vendas || 0, 10),
        bats: parseInt(formData.bats || 0, 10),
        sellerId: sellerObj,
        channelId: channelObj
      };
      
      // Verificar se já existe um lançamento para este vendedor, canal e data
      const existingReleases = await releaseService.findExistingReleases(
        sellerObj, 
        channelObj,
        formData.date
      );
      
      let savedRelease;
      
      // Se tivermos um ID, atualizamos o release existente
      if (editMode && release) {
        // Atualizar propriedades
        release.set('leads', releaseData.leads);
        release.set('vendas', releaseData.vendas);
        release.set('bats', releaseData.bats);
        release.set('dateRelease', releaseData.dateRelease);
        release.set('sellerId', releaseData.sellerId);
        release.set('channelId', releaseData.channelId);
        
        savedRelease = await release.save();
        setSuccess('Lançamento atualizado com sucesso!');
      } else if (existingReleases && existingReleases.length > 0) {
        // Atualizar lançamento existente
        const existingRelease = existingReleases[0];
        existingRelease.set('leads', releaseData.leads);
        existingRelease.set('vendas', releaseData.vendas);
        existingRelease.set('bats', releaseData.bats);
        
        savedRelease = await existingRelease.save();
        setSuccess('Lançamento existente atualizado com sucesso!');
      } else {
        // Criar novo release
        savedRelease = await releaseService.createRelease(releaseData);
        setSuccess('Novo lançamento criado com sucesso!');
      }
      
      // Resetar campos do formulário, exceto data e vendedor
      setFormData(prev => ({
        ...prev,
        leads: 0,
        vendas: 0,
        bats: 0,
        channelId: ''
      }));
      
      // Atualizar a lista de lançamentos do vendedor
      if (sellerObj) {
        await fetchSellerReleasesForDate(sellerObj, formData.date);
      }
      
      // Resetar modo de edição
      setEditMode(false);
      setRelease(null);
      
    } catch (error) {
      console.error('Erro ao salvar lançamento:', error);
      setError(error.message || 'Erro ao salvar o lançamento. Por favor, tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // Função para formatar data para input
  const formatDateForInput = (date) => {
    if (!date) return '';
    return formatDateYYYYMMDD(date);
  };
  
  // Função para voltar à página anterior
  const handleBack = () => {
    navigate('/dashboard');
  };

  // Calcular a taxa de conversão
  const calcConversionRate = (leads, vendas) => {
    if (leads > 0) {
      return ((vendas / leads) * 100).toFixed(2);
    }
    return '0.00';
  };
  
  // Calcular totais dos lançamentos da vendedora
  const calculateSellerTotals = () => {
    if (!sellerReleases || sellerReleases.length === 0) {
      return { totalLeads: 0, totalVendas: 0, totalBats: 0, taxaConversao: '0.00' };
    }
    
    const totalLeads = sellerReleases.reduce((sum, release) => sum + (release.get('leads') || 0), 0);
    const totalVendas = sellerReleases.reduce((sum, release) => sum + (release.get('vendas') || 0), 0);
    const totalBats = sellerReleases.reduce((sum, release) => sum + (release.get('bats') || 0), 0);
    
    const taxaConversao = totalLeads > 0 ? ((totalVendas / totalLeads) * 100).toFixed(2) : '0.00';
    
    return { totalLeads, totalVendas, totalBats, taxaConversao };
  };
  
  // Cores para canais
  const getChannelColor = (channelName) => {
    const colorMap = {
      'instagram': '#E1306C',
      'facebook': '#4267B2',
      'google': '#DB4437',
      'e-commerce': '#6A0DAD',
      'ecommerce': '#6A0DAD',
      'apucarana': '#FF8C00',
      'landing pages': '#0077B5',
      'tel 0800': '#00CD66'
    };
    
    return colorMap[channelName.toLowerCase()] || '#1e88e5';
  };
  
  // Editar um lançamento existente
  const handleEditRelease = (releaseToEdit) => {
    setRelease(releaseToEdit);
    setEditMode(true);
    
    const releaseDate = releaseToEdit.get('dateRelease');
    const sellerId = releaseToEdit.get('sellerId');
    const channelId = releaseToEdit.get('channelId');
    
    setFormData({
      leads: releaseToEdit.get('leads') || 0,
      vendas: releaseToEdit.get('vendas') || 0,
      bats: releaseToEdit.get('bats') || 0,
      date: releaseDate,
      sellerId: sellerId ? sellerId.id : '',
      channelId: channelId ? channelId.id : ''
    });
    
    // Rolar para o topo da página para mostrar o formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Excluir um lançamento
  const handleDeleteRelease = async (releaseToDelete) => {
    if (!window.confirm('Tem certeza que deseja excluir este lançamento?')) {
      return;
    }
    
    try {
      setLoading(true);
      await releaseToDelete.destroy();
      
      // Atualizar a lista após excluir
      const sellerObj = sellers.find(seller => seller.id === formData.sellerId);
      if (sellerObj) {
        await fetchSellerReleasesForDate(sellerObj, formData.date);
      }
      
      setSuccess('Lançamento excluído com sucesso!');
      
      // Se estava em modo de edição para este item, resetar
      if (editMode && release && release.id === releaseToDelete.id) {
        setEditMode(false);
        setRelease(null);
        setFormData(prev => ({
          ...prev,
          leads: 0,
          vendas: 0,
          bats: 0,
          channelId: ''
        }));
      }
    } catch (error) {
      console.error('Erro ao excluir lançamento:', error);
      setError('Erro ao excluir lançamento. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-release-container">
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Carregando dados...</p>
        </div>
      </div>
    );
  }
  
  const totals = calculateSellerTotals();

  return (
    <div className="edit-release-container">
      <header className="edit-release-header">
        <h1>{editMode ? 'Editar Lançamento' : 'Novo Lançamento'}</h1>
        <button className="back-button" onClick={handleBack}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Voltar
        </button>
      </header>

      <div className="edit-release-content">
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <div className="edit-card">
          <form onSubmit={handleSubmit} className="edit-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="date">Data de Lançamento:</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formatDateForInput(formData.date)}
                  onChange={handleDateChange}
                  required
                  className="form-control"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="sellerId">Vendedor:</label>
                <select
                  id="sellerId"
                  name="sellerId"
                  value={formData.sellerId}
                  onChange={handleSellerChange}
                  required
                  className="form-control"
                >
                  <option value="">Selecione um vendedor</option>
                  {sellers.map(seller => (
                    <option key={seller.id} value={seller.id}>
                      {seller.get('seller')}
                    </option>
                  ))}
                </select>
              </div>
              
              {showSummary && (
                <div className="form-group">
                  <label htmlFor="channelId">Canal:</label>
                  <select
                    id="channelId"
                    name="channelId"
                    value={formData.channelId}
                    onChange={handleChange}
                    required
                    className="form-control"
                  >
                    <option value="">Selecione um canal</option>
                    {channels.map(channel => (
                      <option key={channel.id} value={channel.id}>
                        {channel.get('name')}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            {showSummary && (
              <div className="metrics-card">
                <div className="metrics-container">
                  <div className="metric-group">
                    <div className="metric-icon leads-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                    </div>
                    <div className="metric-details">
                      <label htmlFor="leads">Leads:</label>
                      <input
                        type="number"
                        id="leads"
                        name="leads"
                        value={formData.leads}
                        onChange={handleChange}
                        min="0"
                        className="form-control"
                      />
                    </div>
                  </div>
                  
                  <div className="metric-group">
                    <div className="metric-icon vendas-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <path d="M16 10a4 4 0 0 1-8 0"></path>
                      </svg>
                    </div>
                    <div className="metric-details">
                      <label htmlFor="vendas">Vendas:</label>
                      <input
                        type="number"
                        id="vendas"
                        name="vendas"
                        value={formData.vendas}
                        onChange={handleChange}
                        min="0"
                        className="form-control"
                      />
                    </div>
                  </div>
                  
                  <div className="metric-group">
                    <div className="metric-icon bats-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                        <line x1="7" y1="7" x2="7.01" y2="7"></line>
                      </svg>
                    </div>
                    <div className="metric-details">
                      <label htmlFor="bats">BATS:</label>
                      <input
                        type="number"
                        id="bats"
                        name="bats"
                        value={formData.bats}
                        onChange={handleChange}
                        min="0"
                        className="form-control"
                      />
                    </div>
                  </div>
                  
                  <div className="metric-group">
                    <div className="metric-icon conversion-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                        <polyline points="17 6 23 6 23 12"></polyline>
                      </svg>
                    </div>
                    <div className="metric-details">
                      <label>Taxa de Conversão:</label>
                      <div className="conversion-display">
                        {calcConversionRate(formData.leads, formData.vendas)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {showSummary && (
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => {
                    setEditMode(false);
                    setRelease(null);
                    setFormData(prev => ({
                      ...prev,
                      leads: 0,
                      vendas: 0,
                      bats: 0,
                      channelId: ''
                    }));
                  }}
                >
                  {editMode ? 'Cancelar Edição' : 'Limpar Campos'}
                </button>
                
                <button 
                  type="submit" 
                  className="save-button"
                  disabled={saving || !formData.channelId}
                >
                  {saving ? 'Salvando...' : editMode ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            )}
          </form>
        </div>
        
        {/* Seção de Resumo de Lançamentos da Vendedora */}
        {showSummary && formData.sellerId && sellerReleases.length > 0 && (
          <div className="seller-summary-card">
            <h2>
              Lançamentos de{' '}
              {sellers.find(s => s.id === formData.sellerId)?.get('seller') || 'Vendedor'}{' '}
              em {formatDateDDMMYYYY(selectedDate)}
            </h2>
            
            <div className="seller-summary-metrics">
              <div className="summary-metric total-leads">
                <div className="summary-metric-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <div className="summary-metric-content">
                  <h3>Total de Leads</h3>
                  <p>{totals.totalLeads}</p>
                </div>
              </div>
              
              <div className="summary-metric total-vendas">
                <div className="summary-metric-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                  </svg>
                </div>
                <div className="summary-metric-content">
                  <h3>Total de Vendas</h3>
                  <p>{totals.totalVendas}</p>
                </div>
              </div>
              
              <div className="summary-metric total-bats">
                <div className="summary-metric-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                    <line x1="7" y1="7" x2="7.01" y2="7"></line>
                  </svg>
                </div>
                <div className="summary-metric-content">
                  <h3>Total de BATS</h3>
                  <p>{totals.totalBats}</p>
                </div>
              </div>
              
              <div className="summary-metric total-conversion">
                <div className="summary-metric-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                    <polyline points="17 6 23 6 23 12"></polyline>
                  </svg>
                </div>
                <div className="summary-metric-content">
                  <h3>Taxa de Conversão</h3>
                  <p>{totals.taxaConversao}%</p>
                </div>
              </div>
            </div>
            
            <div className="seller-releases-table-container">
              <table className="seller-releases-table">
                <thead>
                  <tr>
                    <th>Canal</th>
                    <th>Leads</th>
                    <th>Vendas</th>
                    <th>BATS</th>
                    <th>Conversão</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {sellerReleases.map(release => {
                    const channel = release.get('channelId');
                    const channelName = channel ? channel.get('name') : 'N/A';
                    const leads = release.get('leads') || 0;
                    const vendas = release.get('vendas') || 0;
                    const bats = release.get('bats') || 0;
                    const conversion = leads > 0 ? ((vendas / leads) * 100).toFixed(2) : '0.00';
                    
                    return (
                      <tr key={release.id} className={editMode && release.id === (release?.id || '') ? 'active-row' : ''}>
                        <td>
                          <div className="channel-badge" style={{
                            backgroundColor: `${getChannelColor(channelName)}20`,
                            borderColor: getChannelColor(channelName),
                            color: getChannelColor(channelName)
                          }}>
                            {channelName}
                          </div>
                        </td>
                        <td>{leads}</td>
                        <td>{vendas}</td>
                        <td>{bats}</td>
                        <td>{conversion}%</td>
                        <td className="action-buttons">
                          <button 
                            type="button" 
                            className="edit-action" 
                            onClick={() => handleEditRelease(release)}
                            title="Editar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                          <button 
                            type="button" 
                            className="delete-action" 
                            onClick={() => handleDeleteRelease(release)}
                            title="Excluir"
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
            
            <button 
              type="button" 
              className="add-release-button"
              onClick={() => {
                // Limpar o formulário de edição para adicionar um novo lançamento
                setFormData(prev => ({
                  ...prev,
                  leads: 0,
                  vendas: 0,
                  bats: 0,
                  channelId: ''
                }));
                setRelease(null);
                setEditMode(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              Adicionar Novo Canal
            </button>
          </div>
        )}
        
        {/* Mensagem quando não há lançamentos */}
        {showSummary && formData.sellerId && sellerReleases.length === 0 && (
          <div className="seller-summary-card empty-state">
            <div className="empty-state-content">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              <h3>Sem Lançamentos</h3>
              <p>
                Não há lançamentos para {sellers.find(s => s.id === formData.sellerId)?.get('seller') || 'este vendedor'} na data {formatDateDDMMYYYY(selectedDate)}.
              </p>
              <p>
                Preencha o formulário acima para adicionar o primeiro lançamento.
              </p>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
};

export default EditReleasePage;