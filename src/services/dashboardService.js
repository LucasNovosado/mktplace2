// src/services/dashboardService.js
import Parse from 'parse/dist/parse.min.js';

/**
 * Ajusta a data para o início do dia
 * @param {Date} date - Data a ser ajustada
 * @returns {Date} Data ajustada para o início do dia
 */
const adjustToStartOfDay = (date) => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

/**
 * Ajusta a data para o final do dia
 * @param {Date} date - Data a ser ajustada
 * @returns {Date} Data ajustada para o final do dia
 */
const adjustToEndOfDay = (date) => {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};

/**
 * Verifica se duas datas representam o mesmo dia, independente do horário
 * @param {Date} date1 - Primeira data
 * @param {Date} date2 - Segunda data
 * @returns {boolean} Verdadeiro se as datas representam o mesmo dia
 */
const isSameDay = (date1, date2) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

// Função para formatar data como YYYY-MM-DD
const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Função para formatar datas no padrão DD/MM/YYYY
const formatDateBR = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Função para calcular taxa de conversão
const calculateConversionRate = (leads, vendas) => {
  return leads > 0 ? parseFloat(((vendas / leads) * 100).toFixed(2)) : 0;
};

/**
 * Calcula a taxa de BATS (porcentagem de vendas BATS sobre o total de vendas)
 * @param {number} bats - Número de vendas BATS
 * @param {number} vendas - Número total de vendas
 * @returns {number} Taxa de BATS em porcentagem
 */
const calculateBatsRate = (bats, vendas) => {
  return vendas > 0 ? parseFloat(((bats / vendas) * 100).toFixed(2)) : 0;
};

// Função para arredondar para duas casas decimais
const roundToTwoDecimals = (num) => {
  return parseFloat(num.toFixed(2));
};

// Função para gerar cores para os gráficos
const getRandomColor = (seed, isChannel = false) => {
  // Cores predefinidas para canais
  const channelColors = {
    'instagram': '#E1306C',
    'facebook': '#4267B2',
    'google': '#DB4437',
    'ecommerce': '#6A0DAD',
    'e-commerce': '#6A0DAD',
    'apucarana': '#FF8C00',
    'landing pages': '#0077B5',
    'tel 0800': '#00CD66'
  };
  
  // Cores predefinidas para vendedores
  const sellerColors = [
    '#3366CC', '#DC3912', '#FF9900', '#109618', '#990099',
    '#0099C6', '#DD4477', '#66AA00', '#B82E2E', '#316395',
    '#994499', '#22AA99', '#AAAA11', '#6633CC', '#E67300',
    '#8B0707', '#329262', '#5574A6', '#3B3EAC'
  ];
  
  if (isChannel) {
    // Para canais, tenta corresponder pelo nome ou retorna uma cor padrão
    const seedStr = seed.toString().toLowerCase();
    for (const [name, color] of Object.entries(channelColors)) {
      if (seedStr.includes(name)) {
        return color;
      }
    }
    // Fallback para canal desconhecido
    return '#2196F3';
  } else {
    // Para vendedores, usa o índice baseado no seed
    const seedNum = seed.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return sellerColors[seedNum % sellerColors.length];
  }
};

/**
 * Serviço para processar e fornecer dados para o dashboard
 */
const dashboardService = {
  /**
   * Busca dados agrupados de Releases por período, vendedor e canal
   * @param {Date} startDate - Data inicial 
   * @param {Date} endDate - Data final
   * @returns {Promise<Object>} Dados processados para o dashboard
   */
  getDashboardData: async (startDate, endDate) => {
    try {
      // Ajustar as datas para incluir o dia todo
      const start = adjustToStartOfDay(startDate);
      const end = adjustToEndOfDay(endDate);
      
      console.log(`Buscando dados agregados no período: ${start.toLocaleDateString()} a ${end.toLocaleDateString()}`);
      
      // Buscar releases no período
      const Release = Parse.Object.extend("Releases");
      const query = new Parse.Query(Release);
      
      query.greaterThanOrEqualTo("dateRelease", start);
      query.lessThanOrEqualTo("dateRelease", end);
      query.include("sellerId");
      query.include("channelId");
      query.limit(10000); // Aumentado para 10000
      
      const releases = await query.find();
      console.log(`Encontrados ${releases.length} releases.`);
      
      // Agrupar dados por vendedor
      const sellerData = {};
      const channelData = {};
      let totalLeads = 0;
      let totalVendas = 0;
      let totalBats = 0;
      
      // Processar os releases
      releases.forEach(release => {
        const seller = release.get("sellerId");
        const channel = release.get("channelId");
        
        if (!seller || !channel) return;
        
        const sellerId = seller.id;
        const channelId = channel.id;
        const sellerName = seller.get("seller");
        const channelName = channel.get("name");
        
        // Valores do release
        const leads = release.get("leads") || 0;
        const vendas = release.get("vendas") || 0;
        const bats = release.get("bats") || 0;
        
        // Inicializar ou atualizar dados do vendedor
        if (!sellerData[sellerId]) {
          sellerData[sellerId] = {
            id: sellerId,
            name: sellerName,
            leads: 0,
            vendas: 0,
            bats: 0,
            taxaConversao: 0,
            taxaBats: 0,
            channels: {},
            color: getRandomColor(sellerId) // Cor para gráficos
          };
        }
        
        // Atualizar totais do vendedor
        sellerData[sellerId].leads += leads;
        sellerData[sellerId].vendas += vendas;
        sellerData[sellerId].bats += bats;
        
        // Inicializar ou atualizar dados do canal para este vendedor
        if (!sellerData[sellerId].channels[channelId]) {
          sellerData[sellerId].channels[channelId] = {
            id: channelId,
            name: channelName,
            leads: 0,
            vendas: 0,
            bats: 0,
            taxaConversao: 0,
            taxaBats: 0
          };
        }
        
        // Atualizar dados do canal para este vendedor
        sellerData[sellerId].channels[channelId].leads += leads;
        sellerData[sellerId].channels[channelId].vendas += vendas;
        sellerData[sellerId].channels[channelId].bats += bats;
        
        // Inicializar ou atualizar dados do canal global
        if (!channelData[channelId]) {
          channelData[channelId] = {
            id: channelId,
            name: channelName,
            leads: 0,
            vendas: 0,
            bats: 0,
            taxaConversao: 0,
            taxaBats: 0,
            color: getRandomColor(channelId, true) // Cor para gráficos
          };
        }
        
        // Atualizar totais do canal
        channelData[channelId].leads += leads;
        channelData[channelId].vendas += vendas;
        channelData[channelId].bats += bats;
        
        // Atualizar totais gerais
        totalLeads += leads;
        totalVendas += vendas;
        totalBats += bats;
      });
      
      // Calcular taxas de conversão
      Object.values(sellerData).forEach(seller => {
        seller.taxaConversao = calculateConversionRate(seller.leads, seller.vendas);
        seller.taxaBats = calculateBatsRate(seller.bats, seller.vendas);
        
        Object.values(seller.channels).forEach(channel => {
          channel.taxaConversao = calculateConversionRate(channel.leads, channel.vendas);
          channel.taxaBats = calculateBatsRate(channel.bats, channel.vendas);
        });
      });
      
      Object.values(channelData).forEach(channel => {
        channel.taxaConversao = calculateConversionRate(channel.leads, channel.vendas);
        channel.taxaBats = calculateBatsRate(channel.bats, channel.vendas);
      });
      
      // Calcular taxa de conversão geral
      const taxaConversaoGeral = calculateConversionRate(totalLeads, totalVendas);
      const taxaBatsGeral = calculateBatsRate(totalBats, totalVendas);
      
      // Preparar dados para gráficos
      const sellerChartData = Object.values(sellerData).map(seller => ({
        name: seller.name,
        leads: seller.leads,
        vendas: seller.vendas,
        bats: seller.bats,
        taxa: roundToTwoDecimals(seller.taxaConversao),
        taxaBats: roundToTwoDecimals(seller.taxaBats),
        color: seller.color
      }));
      
      const channelChartData = Object.values(channelData).map(channel => ({
        name: channel.name,
        leads: channel.leads,
        vendas: channel.vendas,
        bats: channel.bats,
        taxa: roundToTwoDecimals(channel.taxaConversao),
        taxaBats: roundToTwoDecimals(channel.taxaBats),
        color: channel.color
      }));
      
      return {
        sellerData: Object.values(sellerData),
        channelData: Object.values(channelData),
        sellerChartData,
        channelChartData,
        totals: {
          leads: totalLeads,
          vendas: totalVendas,
          bats: totalBats,
          taxaConversao: roundToTwoDecimals(taxaConversaoGeral),
          taxaBats: roundToTwoDecimals(taxaBatsGeral)
        },
        period: {
          start: startDate,
          end: endDate
        }
      };
      
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard:", error);
      throw error;
    }
  },
  
  /**
   * Busca dados de Releases por dia para um período específico
   * @param {Date} startDate - Data inicial
   * @param {Date} endDate - Data final
   * @returns {Promise<Array>} Dados diários para gráficos de timeline
   */
  getDailyData: async (startDate, endDate) => {
    try {
      // Ajustar as datas para incluir o dia todo
      const start = adjustToStartOfDay(startDate);
      const end = adjustToEndOfDay(endDate);
      
      console.log(`Buscando dados de timeline no período: ${start.toLocaleDateString()} a ${end.toLocaleDateString()}`);
      
      // Buscar releases no período
      const Release = Parse.Object.extend("Releases");
      const query = new Parse.Query(Release);
      
      query.greaterThanOrEqualTo("dateRelease", start);
      query.lessThanOrEqualTo("dateRelease", end);
      query.include("sellerId");
      query.include("channelId");
      query.limit(10000); // Aumentado para 10000
      
      const releases = await query.find();
      console.log(`Encontrados ${releases.length} releases para timeline.`);
      
      // Criar um array de datas para todos os dias do período
      const dailyData = [];
      const dailyDataMap = {};
      
      // Gerar entrada para cada dia do período (incluindo o dia final)
      const currentDate = new Date(start);
      while (currentDate <= end) {
        const formattedDate = formatDateBR(currentDate);
        const dateKey = formatDateKey(currentDate);
        
        console.log(`Gerando entrada para: ${formattedDate} (${dateKey})`);
        
        const dayEntry = {
          date: new Date(currentDate),
          dateFormatted: formattedDate,
          dateKey: dateKey,
          leads: 0,
          vendas: 0,
          bats: 0,
          sellers: {}
        };
        
        dailyData.push(dayEntry);
        dailyDataMap[dateKey] = dayEntry;
        
        // Avançar para o próximo dia
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      console.log(`Gerados ${dailyData.length} dias para o gráfico.`);
      
      // Processar os releases
      releases.forEach(release => {
        const releaseDate = release.get("dateRelease");
        const seller = release.get("sellerId");
        
        if (!releaseDate || !seller) return;
        
        // Encontrar a entrada correspondente no array de dias
        // Verificamos a data independente do horário
        const releaseDateOnly = new Date(releaseDate);
        
        // Verificar em qual dia do período este release se encaixa
        const dateKey = formatDateKey(releaseDateOnly);
        
        // Se a data não está no mapa, pode ser por problemas de fuso horário
        if (!dailyDataMap[dateKey]) {
          console.log(`Data ignorada: ${dateKey} de ${releaseDate.toISOString()}`);
          
          // Verificar manualmente cada dia do período
          for (const day of dailyData) {
            if (isSameDay(day.date, releaseDateOnly)) {
              // Encontramos o dia correto
              const dayEntry = day;
              
              const sellerId = seller.id;
              const sellerName = seller.get("seller");
              
              // Valores do release
              const leads = release.get("leads") || 0;
              const vendas = release.get("vendas") || 0;
              const bats = release.get("bats") || 0;
              
              // Atualizar totais do dia
              dayEntry.leads += leads;
              dayEntry.vendas += vendas;
              dayEntry.bats += bats;
              
              // Inicializar ou atualizar dados do vendedor para este dia
              if (!dayEntry.sellers[sellerId]) {
                dayEntry.sellers[sellerId] = {
                  id: sellerId,
                  name: sellerName,
                  leads: 0,
                  vendas: 0,
                  bats: 0
                };
              }
              
              // Atualizar dados do vendedor para este dia
              dayEntry.sellers[sellerId].leads += leads;
              dayEntry.sellers[sellerId].vendas += vendas;
              dayEntry.sellers[sellerId].bats += bats;
              
              console.log(`Release adicionado manualmente ao dia ${dayEntry.dateFormatted}`);
              break;
            }
          }
          
          return;
        }
        
        const dayEntry = dailyDataMap[dateKey];
        const sellerId = seller.id;
        const sellerName = seller.get("seller");
        
        // Valores do release
        const leads = release.get("leads") || 0;
        const vendas = release.get("vendas") || 0;
        const bats = release.get("bats") || 0;
        
        // Atualizar totais do dia
        dayEntry.leads += leads;
        dayEntry.vendas += vendas;
        dayEntry.bats += bats;
        
        // Inicializar ou atualizar dados do vendedor para este dia
        if (!dayEntry.sellers[sellerId]) {
          dayEntry.sellers[sellerId] = {
            id: sellerId,
            name: sellerName,
            leads: 0,
            vendas: 0,
            bats: 0
          };
        }
        
        // Atualizar dados do vendedor para este dia
        dayEntry.sellers[sellerId].leads += leads;
        dayEntry.sellers[sellerId].vendas += vendas;
        dayEntry.sellers[sellerId].bats += bats;
      });
      
      // Calcular a taxa de conversão para cada dia e formatar o resultado final
      const chartData = dailyData.map(day => ({
        date: day.dateKey,
        dateFormatted: day.dateFormatted,
        leads: day.leads,
        vendas: day.vendas,
        bats: day.bats,
        taxa: calculateConversionRate(day.leads, day.vendas),
        taxaBats: calculateBatsRate(day.bats, day.vendas),
        sellers: Object.values(day.sellers)
      }));
      
      console.log(`Timeline finalizada com ${chartData.length} dias.`);
      console.log(`Datas no gráfico: ${chartData.map(d => d.dateFormatted).join(', ')}`);
      
      return chartData;
      
    } catch (error) {
      console.error("Erro ao buscar dados diários:", error);
      throw error;
    }
  }
};

export default dashboardService;