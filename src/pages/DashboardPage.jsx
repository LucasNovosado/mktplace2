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
          
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;