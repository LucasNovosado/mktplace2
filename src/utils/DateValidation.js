// src/utils/DateValidation.js

/**
 * Utilitários para manipulação e validação de datas
 */

/**
 * Cria uma data segura com horário 12:00 para evitar problemas de fuso horário
 * @param {number} year - Ano 
 * @param {number} month - Mês (1-12)
 * @param {number} day - Dia
 * @returns {Date} Data normalizada
 */
export const createSafeDate = (year, month, day) => {
    // Mês em JS é baseado em zero (0-11)
    return new Date(year, month - 1, day, 12, 0, 0);
  };
  
  /**
   * Normaliza uma data existente para meio-dia para evitar problemas de fuso horário
   * @param {Date} date - Data original
   * @returns {Date} Data normalizada
   */
  export const normalizeDateToNoon = (date) => {
    if (!date) return new Date();
    return createSafeDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
  };
  
  /**
   * Formata uma data para exibição no formato DD/MM/YYYY
   * @param {Date} date - Data a ser formatada
   * @returns {string} Data formatada
   */
  export const formatDateDDMMYYYY = (date) => {
    if (!date) return '';
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  };
  
  /**
   * Converte uma string de data no formato YYYY-MM-DD para um objeto Date
   * @param {string} dateStr - String de data no formato YYYY-MM-DD
   * @returns {Date} Objeto Date normalizado
   */
  export const parseDateYYYYMMDD = (dateStr) => {
    if (!dateStr) return new Date();
    
    const [year, month, day] = dateStr.split('-').map(num => parseInt(num, 10));
    return createSafeDate(year, month, day);
  };
  
  /**
   * Formata uma data para string no formato YYYY-MM-DD para uso em inputs HTML
   * @param {Date} date - Data a ser formatada
   * @returns {string} String formatada YYYY-MM-DD
   */
  export const formatDateYYYYMMDD = (date) => {
    if (!date) return '';
    
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };