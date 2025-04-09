// src/utils/BusinessDaysUtils.js

/**
 * Lista de feriados nacionais brasileiros fixos (sem considerar feriados móveis)
 * Formato: MM-DD (mês-dia)
 */
const BRAZILIAN_HOLIDAYS = [
    '01-01', // Ano Novo
    '04-21', // Tiradentes
    '05-01', // Dia do Trabalho
    '09-07', // Independência
    '10-12', // Nossa Senhora Aparecida
    '11-02', // Finados
    '11-15', // Proclamação da República
    '12-25', // Natal
  ];
  
  /**
   * Verifica se uma data é um feriado nacional
   * @param {Date} date - Data a verificar
   * @returns {boolean} - Verdadeiro se for feriado
   */
  const isHoliday = (date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${month}-${day}`;
    
    return BRAZILIAN_HOLIDAYS.includes(dateString);
  };
  
  /**
   * Verifica se uma data é um dia útil (não é fim de semana ou feriado)
   * @param {Date} date - Data a verificar
   * @returns {boolean} - Verdadeiro se for dia útil
   */
  const isBusinessDay = (date) => {
    const dayOfWeek = date.getDay();
    
    // 0 = Domingo, 6 = Sábado
    if (dayOfWeek === 0) return false;
    
    // Verificar se é feriado
    return !isHoliday(date);
  };
  
  /**
   * Conta o número de dias úteis entre duas datas
   * @param {Date} startDate - Data inicial
   * @param {Date} endDate - Data final
   * @returns {number} - Número de dias úteis no período
   */
  const countBusinessDays = (startDate, endDate) => {
    // Normalizar as datas para meia-noite
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    
    // Garantir que a data final é posterior à inicial
    if (start > end) return 0;
    
    let count = 0;
    const currentDate = new Date(start);
    
    // Percorrer todos os dias no intervalo
    while (currentDate <= end) {
      if (isBusinessDay(currentDate)) {
        count++;
      }
      
      // Avançar para o próximo dia
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return count;
  };
  
  /**
   * Calcula a média diária de um valor considerando apenas dias úteis
   * @param {number} totalValue - Valor total acumulado
   * @param {Date} startDate - Data inicial
   * @param {Date} endDate - Data final
   * @returns {number} - Média diária considerando apenas dias úteis
   */
  const calculateBusinessDayAverage = (totalValue, startDate, endDate) => {
    const businessDays = countBusinessDays(startDate, endDate);
    
    if (businessDays === 0) return 0;
    return totalValue / businessDays;
  };
  
  export {
    isBusinessDay,
    countBusinessDays,
    calculateBusinessDayAverage
  };