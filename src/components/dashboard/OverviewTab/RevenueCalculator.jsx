// src/components/dashboard/OverviewTab/RevenueCalculator.jsx
import React, { useState, useEffect } from 'react';
import financesService from '../../../services/financesService';
import './RevenueCalculator.css'; // Adicione esta linha

// Valor padrão do ticket médio
const DEFAULT_TICKET_MEDIO = 237;

const RevenueCalculator = ({ vendas, bats }) => {
  // Estado para armazenar o valor atual do ticket médio
  const [ticketMedio, setTicketMedio] = useState(DEFAULT_TICKET_MEDIO);
  // Estado para armazenar o valor temporário durante a edição
  const [tempTicket, setTempTicket] = useState(DEFAULT_TICKET_MEDIO);
  // Estado para controlar se está em modo de edição
  const [isEditing, setIsEditing] = useState(false);
  // Estado para controlar o carregamento
  const [loading, setLoading] = useState(true);
  // Estado para controlar se o valor está borrado
  const [isBlurred, setIsBlurred] = useState(false);

  // Buscar o valor do ticket médio do Parse quando o componente montar
  useEffect(() => {
    const fetchTicketMedio = async () => {
      try {
        setLoading(true);
        const valor = await financesService.getTicketMedio();
        setTicketMedio(valor);
        setTempTicket(valor);
      } catch (error) {
        console.error("Erro ao buscar ticket médio:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTicketMedio();
    
    // Verificar se o usuário prefere borrar valores (localStorage)
    const savedBlurState = localStorage.getItem('revenue-blur-state');
    if (savedBlurState) {
      setIsBlurred(savedBlurState === 'true');
    }
  }, []);

  // Atualizar o tempTicket quando ticketMedio mudar
  useEffect(() => {
    setTempTicket(ticketMedio);
  }, [ticketMedio]);

  // Cálculo do faturamento
  const faturamentoTotal = vendas * ticketMedio;
  
  // Formatar valores como moeda brasileira
  const formatCurrency = (value) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL'
    });
  };

  // Iniciar edição do ticket médio
  const handleEdit = () => {
    setIsEditing(true);
  };

  // Salvar novo valor do ticket médio
  const handleSave = async () => {
    // Garantir que o valor é um número válido
    const validValue = parseFloat(tempTicket) || DEFAULT_TICKET_MEDIO;
    setTicketMedio(validValue);
    setIsEditing(false);
    
    // Salvar no Parse
    try {
      await financesService.updateTicketMedio(validValue);
    } catch (error) {
      console.error("Erro ao salvar ticket médio:", error);
      // Se houver erro, tentar novamente mais tarde ou avisar o usuário
    }
  };

  // Cancelar edição e restaurar valor anterior
  const handleCancel = () => {
    setTempTicket(ticketMedio);
    setIsEditing(false);
  };

  // Manipular alterações no input
  const handleChange = (e) => {
    setTempTicket(e.target.value);
  };

  // Manipular tecla Enter no input
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // Alternar entre mostrar e ocultar o valor
  const toggleBlur = () => {
    const newState = !isBlurred;
    setIsBlurred(newState);
    // Salvar preferência no localStorage
    localStorage.setItem('revenue-blur-state', newState.toString());
  };

  // Exibir indicador de carregamento se estiver buscando dados
  if (loading) {
    return (
      <div className="simple-revenue-calculator loading">
        <span>Carregando dados de faturamento...</span>
      </div>
    );
  }

  return (
    <div className="simple-revenue-calculator">
      <div className="revenue-header">
        <div className="revenue-title">
          <span>Faturamento Estimado:</span>
          <span className={`revenue-value ${isBlurred ? 'blurred' : ''}`}>
            {formatCurrency(faturamentoTotal)}
          </span>
          <button 
            className="visibility-toggle" 
            onClick={toggleBlur} 
            title={isBlurred ? "Mostrar valor" : "Ocultar valor"}
          >
            {isBlurred ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            )}
          </button>
        </div>
        
        <div className="ticket-editor">
          {isEditing ? (
            <div className="ticket-input-group">
              <input
                type="number"
                className="ticket-input"
                value={tempTicket}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                autoFocus
                min="1"
                step="1"
              />
              <button 
                className="ticket-button save" 
                onClick={handleSave}
                title="Salvar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </button>
              <button 
                className="ticket-button cancel" 
                onClick={handleCancel}
                title="Cancelar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          ) : (
            <div className="ticket-display">
              <span className={`ticket-label ${isBlurred ? 'blurred' : ''}`}>
                Ticket: {formatCurrency(ticketMedio)}
              </span>
              <button 
                className="ticket-button edit" 
                onClick={handleEdit}
                title="Editar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RevenueCalculator;