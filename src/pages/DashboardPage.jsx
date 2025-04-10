// src/pages/DashboardPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import StyledCard from '../components/StyledCard';
import ImportIcon from '../components/ImportIcon';
import SalesDashboard from '../components/dashboard/SalesDashboard';
import './DashboardPage.css';

const DashboardPage = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se o usuário está logado usando authService
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      // Se não estiver logado, redireciona para o login
      navigate('/');
      return;
    }
    
    setUser(currentUser);
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (!user) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <button className="logout-button" onClick={handleLogout}>
          Sair
        </button>
      </header>
      
      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>Bem-vindo, {user.get('username')}!</h2>
          <p>Você está logado com sucesso no sistema.</p>
        </div>
        
        {/* Dashboard de Vendas */}
        <SalesDashboard />
        
        <div className="dashboard-cards">
          {/* Card para Importação de Atendimentos */}
          <StyledCard
            title="Importação de Atendimentos"
            description="Importe dados de atendimentos da sua planilha para registrar leads e vendas por vendedor e canal."
            buttonText="Acessar Importação"
            to="/importacao"
            bgColor="rgba(74, 144, 226, 0.2)"
          >
            <div className="card-info">
              <span className="info-item">
                <ImportIcon width={16} height={16} />
                Importação via Excel/CSV
              </span>
            </div>
          </StyledCard>
          {/* Card para Edição de Lançamentos */}
          <StyledCard
            title="Gerenciar Lançamentos"
            description="Adicione, edite ou remova lançamentos de leads, vendas e BATS manualmente no sistema."
            buttonText="Editar Lançamentos"
            to="/releases/new"
            bgColor="rgba(255, 215, 0, 0.2)"
          >
            <div className="card-info">
              <span className="info-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edição manual de dados
              </span>
            </div>
          </StyledCard>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;