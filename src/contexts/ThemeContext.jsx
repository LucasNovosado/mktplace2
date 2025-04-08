// src/contexts/ThemeContext.jsx
import React, { createContext, useState, useEffect, useMemo } from 'react';

export const ThemeContext = createContext({
  theme: 'dark', 
  toggleTheme: () => {}
});

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Primeiro, tenta obter o tema salvo no localStorage
    const savedTheme = localStorage.getItem('app-theme');
    
    // Se não tiver tema salvo, usar o tema escuro como padrão
    if (!savedTheme) {
      return 'dark';
    }
    
    return savedTheme;
  });

  useEffect(() => {
    // Garantir que o atributo é aplicado ao elemento HTML raiz
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  // Função para alternar o tema
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // Memoiza o valor do contexto para performance
  const contextValue = useMemo(() => ({
    theme,
    toggleTheme
  }), [theme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};