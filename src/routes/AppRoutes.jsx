import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import ImportacaoPage from '../pages/ImportacaoPage';
import EditReleasePage from '../pages/EditReleasePage';
import authService from '../services/authService';

const ProtectedRoute = ({ children }) => {
  try {
    const isAuthenticated = !!authService.getCurrentUser();
    
    if (!isAuthenticated) {
      return <Navigate to="/" replace />;
    }
    
    return children;
  } catch (error) {
    console.error("Erro ao verificar autenticação:", error);
    return <Navigate to="/" replace />;
  }
};

const PublicRoute = ({ children }) => {
  try {
    const isAuthenticated = !!authService.getCurrentUser();
    
    if (isAuthenticated) {
      return <Navigate to="/dashboard" replace />;
    }
    
    return children;
  } catch (error) {
    console.error("Erro ao verificar autenticação:", error);
    return children;
  }
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } 
      />
      
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/importacao"
        element={
          <ProtectedRoute>
            <ImportacaoPage />
          </ProtectedRoute>
        }  
      />
      
      <Route 
        path="/releases/:id"
        element={
          <ProtectedRoute>
            <EditReleasePage />
          </ProtectedRoute>
        }  
      />
      
      <Route 
        path="/releases/new"
        element={
          <ProtectedRoute>
            <EditReleasePage />
          </ProtectedRoute>
        }  
      />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;