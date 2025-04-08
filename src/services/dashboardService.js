// src/services/dashboardService.js
import Parse from 'parse/dist/parse.min.js';

/**
 * Ajusta a data para o início do dia no fuso horário local
 * @param {Date} date - Data a ser ajustada
 * @returns {Date} Data ajustada para o início do dia
 */
const adjustToLocalStartOfDay = (date) => {
  // Criar uma nova data para evitar modificar o objeto original
  const localDate = new Date(date);
  
  // Definir horário para 00:00:00 no fuso horário UTC
  localDate.setUTCHours(0, 0, 0, 0) ;
  
  return localDate;
};

const adjustToLocalEndOfDay = (date) => {
  // Criar uma nova data para evitar modificar o objeto original
  const localDate = new Date(date);
  
  // Definir horário para 23:59:59.999 no fuso horário UTC
  localDate.setUTCHours(23, 59, 59, 999);
  
  return localDate;
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
      // Log para depuração
      console.log('Dashboard service recebeu datas:', 
        startDate.toLocaleString(), 'até', endDate.toLocaleString());
      
      // Usar as datas diretamente sem ajustes adicionais
      const Release = Parse.Object.extend("Releases");
      const query = new Parse.Query(Release);
      
      query.greaterThanOrEqualTo("dateRelease", startDate);
      query.lessThanOrEqualTo("dateRelease", endDate);
      query.include("sellerId");
      query.include("channelId");
      query.limit(1000); // Ajustar conforme necessário
      
      const releases = await query.find();
      console.log('Releases encontrados:', releases.length);
      
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
            taxaConversao: 0
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
        
        Object.values(seller.channels).forEach(channel => {
          channel.taxaConversao = calculateConversionRate(channel.leads, channel.vendas);
        });
      });
      
      Object.values(channelData).forEach(channel => {
        channel.taxaConversao = calculateConversionRate(channel.leads, channel.vendas);
      });
      
      // Calcular taxa de conversão geral
      const taxaConversaoGeral = calculateConversionRate(totalLeads, totalVendas);
      
      // Preparar dados para gráficos
      const sellerChartData = Object.values(sellerData).map(seller => ({
        name: seller.name,
        leads: seller.leads,
        vendas: seller.vendas,
        bats: seller.bats,
        taxa: roundToTwoDecimals(seller.taxaConversao),
        color: seller.color
      }));
      
      const channelChartData = Object.values(channelData).map(channel => ({
        name: channel.name,
        leads: channel.leads,
        vendas: channel.vendas,
        bats: channel.bats,
        taxa: roundToTwoDecimals(channel.taxaConversao),
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
          taxaConversao: roundToTwoDecimals(taxaConversaoGeral)
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
      // Log para depuração
      console.log('getDailyData recebeu datas:', 
        startDate.toLocaleString(), 'até', endDate.toLocaleString());
      
      // Usar as datas diretamente sem ajustes adicionais
      const Release = Parse.Object.extend("Releases");
      const query = new Parse.Query(Release);
      
      query.greaterThanOrEqualTo("dateRelease", startDate);
      query.lessThanOrEqualTo("dateRelease", endDate);
      query.include("sellerId");
      query.include("channelId");
      query.limit(1000); // Ajustar conforme necessário
      
      const releases = await query.find();
      console.log('Releases diários encontrados:', releases.length);
      
      // Mapa para armazenar dados diários - usamos a data no formato DD/MM/YYYY como chave
      const dailyDataMap = {};
      
      // Gerar datas para todos os dias do período
      // Importante: subtrair 1 dia para compensar o ajuste feito na data final
      const startDay = new Date(startDate);
      const endDay = new Date(endDate);
      endDay.setDate(endDay.getDate() - 1); // Compensar a adição feita no SalesDashboard
      
      const currentDate = new Date(startDay);
      while (currentDate <= endDay) {
        const dateKey = formatDateKey(currentDate);
        dailyDataMap[dateKey] = {
          date: new Date(currentDate),
          leads: 0,
          vendas: 0,
          bats: 0,
          sellers: {}
        };
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Processar os releases por dia
      releases.forEach(release => {
        const releaseDate = release.get("dateRelease");
        const seller = release.get("sellerId");
        
        if (!releaseDate || !seller) return;
        
        // Ajustar a data para o fuso horário local e usar sempre a data local
        const localReleaseDate = new Date(releaseDate);
        const dateKey = formatDateKey(localReleaseDate);
        
        const sellerId = seller.id;
        const sellerName = seller.get("seller");
        
        // Valores do release
        const leads = release.get("leads") || 0;
        const vendas = release.get("vendas") || 0;
        const bats = release.get("bats") || 0;
        
        // Se a data não está no mapa, pode ser por problemas de timezone
        if (!dailyDataMap[dateKey]) {
          console.log('Data não encontrada no mapa:', dateKey, 'para data:', releaseDate.toLocaleString());
          dailyDataMap[dateKey] = {
            date: new Date(localReleaseDate),
            leads: 0,
            vendas: 0,
            bats: 0,
            sellers: {}
          };
        }
        
        // Atualizar totais diários
        dailyDataMap[dateKey].leads += leads;
        dailyDataMap[dateKey].vendas += vendas;
        dailyDataMap[dateKey].bats += bats;
        
        // Inicializar ou atualizar dados do vendedor para este dia
        if (!dailyDataMap[dateKey].sellers[sellerId]) {
          dailyDataMap[dateKey].sellers[sellerId] = {
            id: sellerId,
            name: sellerName,
            leads: 0,
            vendas: 0,
            bats: 0
          };
        }
        
        // Atualizar dados do vendedor para este dia
        dailyDataMap[dateKey].sellers[sellerId].leads += leads;
        dailyDataMap[dateKey].sellers[sellerId].vendas += vendas;
        dailyDataMap[dateKey].sellers[sellerId].bats += bats;
      });
      
      // Converter o mapa em array ordenado por data
      const dailyData = Object.values(dailyDataMap).sort((a, b) => a.date - b.date);
      
      // Formatar o array para o formato esperado pelos gráficos
      const chartData = dailyData.map(day => ({
        date: formatDateKey(day.date),
        dateFormatted: formatDateBR(day.date),
        leads: day.leads,
        vendas: day.vendas,
        bats: day.bats,
        taxa: calculateConversionRate(day.leads, day.vendas),
        sellers: Object.values(day.sellers)
      }));
      
      return chartData;
      
    } catch (error) {
      console.error("Erro ao buscar dados diários:", error);
      throw error;
    }
  }
};

// Função para formatar data como YYYY-MM-DD no fuso horário local
const formatDateKey = (date) => {
  const localDate = new Date(date);
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Função utilitária para formatar datas no padrão DD/MM/YYYY
const formatDateBR = (date) => {
  const d = new Date(date);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
};

// Função para calcular taxa de conversão de forma centralizada
const calculateConversionRate = (leads, vendas) => {
  return leads > 0 ? parseFloat(((vendas / leads) * 100).toFixed(2)) : 0;
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
  
  // Cores predefinidas para vendedores (mais neutras/profissionais)
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

export default dashboardService;