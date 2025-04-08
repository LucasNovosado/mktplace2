// src/services/excelService.js
import * as XLSX from 'xlsx';

/**
 * Serviço para processamento de planilhas Excel
 */
const excelService = {
  /**
   * Lê e processa um arquivo Excel para extrair dados
   * @param {File} file - Arquivo Excel a ser processado
   * @returns {Promise<Array>} Promise resolvida com dados da planilha
   */
  readExcelFile: (file) => {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          try {
            const data = e.target.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            resolve(jsonData);
          } catch (error) {
            reject(new Error('Erro ao processar arquivo Excel: ' + error.message));
          }
        };
        
        reader.onerror = () => {
          reject(new Error('Erro ao ler o arquivo'));
        };
        
        reader.readAsBinaryString(file);
      } catch (error) {
        reject(error);
      }
    });
  },

  /**
   * Processa dados de atendimento conforme requisitos específicos
   * @param {Array} data - Dados brutos da planilha
   * @returns {Array} Dados processados com contagens por canal
   */
  processAttendanceData: (data) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('Dados inválidos ou vazios');
    }

    // Verificar colunas necessárias
    const requiredColumns = ['Atendente', 'Nome', 'Tags'];
    const firstRow = data[0];
    
    for (const column of requiredColumns) {
      if (!(column in firstRow)) {
        throw new Error(`Coluna obrigatória não encontrada: ${column}`);
      }
    }

    // 1. Remover duplicatas por nome
    const uniqueByName = excelService.removeDuplicatesByField(data, 'Nome');
    
    // 2. Tratar valores ausentes nas tags (substituir por string vazia em vez de 'facebook')
    const dataWithDefaultTags = uniqueByName.map(item => ({
      ...item,
      Tags: item.Tags || ''
    }));
    
    // 3. Separar múltiplas tags e calcular contatos por canal
    const channelMapping = {
      'ecommerce': ['ecommerce', 'e-commerce', 'ecomerce', 'loja virtual'],
      'facebook': ['facebook', 'fb', 'face'],
      'google': ['google', 'adwords', 'google ads'],
      'landingpages': ['landingpages', 'landing page', 'landing pages', 'lp'],
      'sites': ['sites', 'site', 'website', 'web'],
      'instagram': ['instagram', 'insta', 'ig'],
      'apucarana': ['apucarana'],
      'tel 0800': ['tel 0800', '0800', 'telefone']
    };
    
    const attendantsByChannel = {};
    
    dataWithDefaultTags.forEach(item => {
      const attendant = item.Atendente;
      const tagsString = String(item.Tags || ''); // Garantir que seja uma string
      const tags = tagsString.split(',').map(tag => tag.trim().toLowerCase());
      
      if (!attendantsByChannel[attendant]) {
        attendantsByChannel[attendant] = {
          ecommerce: 0,
          facebook: 0,
          google: 0,
          landingpages: 0,
          sites: 0,
          instagram: 0,
          apucarana: 0,
          'tel 0800': 0
        };
      }
      
      // Para cada tag do atendimento, verificar a qual canal pertence
      let matchFound = false;
      tags.forEach(tag => {
        for (const [channel, aliases] of Object.entries(channelMapping)) {
          if (aliases.includes(tag)) {
            attendantsByChannel[attendant][channel]++;
            matchFound = true;
            break;
          }
        }
      });
      
      // Se nenhuma tag correspondeu a um canal, não atribuir a nenhum canal específico
    });
    
    // 4. Ordenar atendentes em ordem alfabética
    const sortedAttendants = Object.keys(attendantsByChannel).sort();
    
    const result = sortedAttendants.map(attendant => ({
      attendant,
      channels: attendantsByChannel[attendant]
    }));
    
    return result;
  },
  
  /**
   * Remove itens duplicados de um array com base em um campo específico
   * @param {Array} data - Array de objetos
   * @param {string} field - Campo a ser usado para verificar duplicatas
   * @returns {Array} Array sem duplicatas
   */
  removeDuplicatesByField: (data, field) => {
    const seen = new Set();
    return data.filter(item => {
      const value = item[field];
      if (value === undefined || value === null) return true;
      
      const valueStr = String(value).toLowerCase().trim();
      if (valueStr === '' || seen.has(valueStr)) {
        return false;
      }
      seen.add(valueStr);
      return true;
    });
  },
  
  /**
   * Prepara dados para envio ao Parse/Back4app
   * @param {Array} processedData - Dados processados
   * @param {Array} sellers - Array de objetos Seller do Parse
   * @param {Array} channels - Array de objetos Channel do Parse
   * @param {Date} referenceDate - Data de referência para o Release
   * @returns {Array} Objetos prontos para serem salvos
   */
  // Trecho atualizado para a função prepareDataForParse no excelService.js

prepareDataForParse: (processedData, sellers, channels, referenceDate = new Date()) => {
  if (!processedData || !sellers || !channels) {
    throw new Error('Dados inválidos para preparação');
  }
  
  // Usar a data de referência fornecida
  const dateToUse = new Date(referenceDate);
  console.log(`Preparando dados para a data de referência: ${dateToUse.toLocaleDateString()}`);
  
  const releases = [];
  
  // Mapa para busca rápida de canais pelo nome
  const channelMap = new Map();
  channels.forEach(channel => {
    const name = channel.get('name').toLowerCase();
    channelMap.set(name, channel);
    
    // Adicionar aliases comuns
    if (name === 'e-commerce') channelMap.set('ecommerce', channel);
    if (name === 'landing pages') {
      channelMap.set('landingpages', channel);
      channelMap.set('landing page', channel);
    }
    if (name === 'tel 0800') channelMap.set('0800', channel);
  });
  
  // Mapa para busca rápida de vendedores pelo nome
  const sellerMap = new Map();
  sellers.forEach(seller => {
    const sellerName = seller.get('seller');
    sellerMap.set(sellerName.toLowerCase(), seller);
    
    // Para nomes compostos, também mapear o primeiro nome
    const firstName = sellerName.split(' ')[0];
    if (firstName) sellerMap.set(firstName.toLowerCase(), seller);
  });
  
  // Para debug - mostrar os nomes disponíveis
  console.log("Canais disponíveis:", [...channelMap.keys()]);
  console.log("Vendedores disponíveis:", [...sellerMap.keys()]);
  
  // Para cada atendente e seus canais
  processedData.forEach(item => {
    const attendantName = item.attendant;
    const channels = item.channels;
    
    // Tentar encontrar o seller correspondente (primeiro pelo nome completo, depois pelo primeiro nome)
    let sellerObject = sellerMap.get(attendantName.toLowerCase());
    
    // Se não encontrar, tentar pelo primeiro nome
    if (!sellerObject) {
      const firstName = attendantName.split(' ')[0];
      sellerObject = sellerMap.get(firstName.toLowerCase());
    }
    
    if (!sellerObject) {
      console.warn(`Vendedor não encontrado: ${attendantName}`);
      return; // Pula este atendente e continua
    }
    
    // Para cada canal com contagens
    Object.entries(channels).forEach(([channelName, count]) => {
      if (count > 0) {
        // Encontrar o canal correspondente
        const channelObject = channelMap.get(channelName.toLowerCase());
        
        if (!channelObject) {
          console.warn(`Canal não encontrado: ${channelName}`);
          return; // Pula este canal e continua
        }
        
        // Criar dados para um novo release
        releases.push({
          dateRelease: dateToUse,
          leads: count,
          vendas: 0, // Vendas serão atualizadas posteriormente
          bats: 0,   // BATS serão atualizados posteriormente
          sellerId: sellerObject,
          channelId: channelObject
        });
      }
    });
  });
  
  console.log(`${releases.length} registros de leads preparados para a data ${dateToUse.toLocaleDateString()}`);
  return releases;
},

  /**
   * Lê e processa uma planilha de vendas multi-abas
   * @param {File} file - Arquivo Excel com múltiplas abas
   * @returns {Promise<Object>} - Dados processados por aba/vendedor
   */
  readSalesExcelFile: (file) => {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          try {
            const data = e.target.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            
            // Processar cada aba
            const processedData = {};
            
            workbook.SheetNames.forEach(sheetName => {
              const worksheet = workbook.Sheets[sheetName];
              const jsonData = XLSX.utils.sheet_to_json(worksheet);
              
              // Nome da aba = nome do vendedor
              processedData[sheetName] = jsonData;
            });
            
            resolve(processedData);
          } catch (error) {
            reject(new Error('Erro ao processar arquivo Excel de vendas: ' + error.message));
          }
        };
        
        reader.onerror = () => {
          reject(new Error('Erro ao ler o arquivo de vendas'));
        };
        
        reader.readAsBinaryString(file);
      } catch (error) {
        reject(error);
      }
    });
  },

  /**
   * Processa dados de uma planilha de vendas, mapeando vendas por vendedor e canal
   * @param {Object} rawData - Dados brutos da planilha com múltiplas abas
   * @param {Date} referenceDate - Data de referência para filtrar vendas
   * @param {Array} sellers - Array de objetos Seller do Parse
   * @param {Array} channels - Array de objetos Channel do Parse
   * @returns {Object} - Vendas processadas por vendedor e canal
   */
// Trecho atualizado para a função processSalesData no excelService.js

processSalesData: (rawData, referenceDate, sellers, channels) => {
  if (!rawData || !sellers || !channels) {
    throw new Error('Dados inválidos para processamento de vendas');
  }
  
  // Formatar a data de referência para comparação no formato DD/MM/AAAA
  const refDateString = excelService.formatDateToCompare(referenceDate);
  console.log(`Processando vendas para a data de referência: ${refDateString}`);
  
  // Resultado final: vendas por vendedor e canal
  const salesBySellerAndChannel = {};
  
  // Para cada aba (vendedor) no arquivo
  Object.entries(rawData).forEach(([sheetName, salesData]) => {
    // Encontrar o vendedor correspondente ao nome da aba
    const sellerObject = excelService.findSellerByName(sheetName, sellers);
    
    if (!sellerObject) {
      console.warn(`Vendedor não encontrado para a aba: ${sheetName}`);
      return; // Pular esta aba
    }
    
    const sellerId = sellerObject.id;
    
    // Inicializar dados para este vendedor
    if (!salesBySellerAndChannel[sellerId]) {
      salesBySellerAndChannel[sellerId] = {
        sellerObject,
        sellerName: sellerObject.get('seller'),
        channels: {}
      };
    }
    
    // Filtrar vendas pela data de referência selecionada
    const filteredSales = salesData.filter(row => {
      if (!row['DATA PEDIDO'] && !row['DATA']) return false;
      
      const saleDate = row['DATA PEDIDO'] || row['DATA'];
      
      // Converter e comparar a data
      const saleDateStr = excelService.formatExcelDateToCompare(saleDate);
      
      // Debug
      if (saleDateStr === refDateString) {
        console.log(`Venda encontrada na data ${refDateString} para ${sellerObject.get('seller')}`);
      }
      
      return saleDateStr === refDateString;
    });
    
    console.log(`${filteredSales.length} vendas encontradas para ${sellerObject.get('seller')} na data ${refDateString}`);
    
    // Agrupar vendas por canal
    filteredSales.forEach(sale => {
      const channelName = sale['CANAL'];
      if (!channelName) return; // Pular se não tiver canal
      
      const channelObject = excelService.findChannelByName(channelName, channels);
      
      if (!channelObject) {
        console.warn(`Canal não encontrado: ${channelName} para vendedor ${sheetName}`);
        return; // Pular esta venda
      }
      
      const channelId = channelObject.id;
      
      // Verificar se é uma venda BATS
      const isBats = String(sale['MARCA'] || sale['MARCA BAT'] || '').toUpperCase().includes('BATS');
      
      // Inicializar ou incrementar contadores para este canal
      if (!salesBySellerAndChannel[sellerId].channels[channelId]) {
        salesBySellerAndChannel[sellerId].channels[channelId] = {
          channelObject,
          channelName: channelObject.get('name'),
          sales: 0,
          bats: 0
        };
      }
      
      // Incrementar contador de vendas
      salesBySellerAndChannel[sellerId].channels[channelId].sales++;
      
      // Incrementar contador de BATS se aplicável
      if (isBats) {
        salesBySellerAndChannel[sellerId].channels[channelId].bats++;
      }
    });
  });
  
  return salesBySellerAndChannel;
},

  /**
   * Formata uma data para comparação no formato DD/MM/AAAA
   * @param {Date} date - Data a ser formatada
   * @returns {string} - Data formatada
   */
  formatDateToCompare: (date) => {
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  },

  /**
   * Formata uma data do Excel para comparação
   * @param {string|number} excelDate - Data do Excel (string ou número)
   * @returns {string} - Data formatada para comparação
   */
  formatExcelDateToCompare: (excelDate) => {
    // Se for string no formato DD/MM/AAAA
    if (typeof excelDate === 'string' && excelDate.includes('/')) {
      const parts = excelDate.split('/');
      if (parts.length === 3) {
        // Garantir que esteja no formato correto
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
        return `${day}/${month}/${year}`;
      }
    }
    
    // Se for um número (data serial do Excel)
    if (typeof excelDate === 'number') {
      // Excel usa o sistema de data 1900 (1 = 1 de janeiro de 1900)
      const excelEpoch = new Date(1899, 11, 30);
      const millisecondsPerDay = 24 * 60 * 60 * 1000;
      const dateObj = new Date(excelEpoch.getTime() + excelDate * millisecondsPerDay);
      
      return `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
    }
    
    // Tentar converter para data
    try {
      const dateObj = new Date(excelDate);
      return `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
    } catch (e) {
      console.error('Erro ao converter data:', e);
      return '';
    }
  },

  /**
   * Encontra um vendedor pelo nome
   * @param {string} name - Nome do vendedor
   * @param {Array} sellers - Array de objetos Seller do Parse
   * @returns {Object|null} - Objeto Seller encontrado ou null
   */
  findSellerByName: (name, sellers) => {
    if (!sellers || !Array.isArray(sellers) || !name) return null;
    
    const normalizedName = name.toLowerCase().trim();
    
    // Tentar encontrar correspondência exata
    const exactMatch = sellers.find(
      seller => seller.get('seller').toLowerCase().trim() === normalizedName
    );
    
    if (exactMatch) return exactMatch;
    
    // Tentar pelo primeiro nome
    const firstNameMatch = sellers.find(seller => {
      const sellerFirstName = seller.get('seller').split(' ')[0].toLowerCase().trim();
      return sellerFirstName === normalizedName || normalizedName.startsWith(sellerFirstName);
    });
    
    if (firstNameMatch) return firstNameMatch;
    
    // Tentar correspondência parcial
    return sellers.find(seller => {
      const sellerName = seller.get('seller').toLowerCase().trim();
      return sellerName.includes(normalizedName) || normalizedName.includes(sellerName);
    });
  },

  /**
   * Encontra um canal pelo nome
   * @param {string} name - Nome do canal
   * @param {Array} channels - Array de objetos Channel do Parse
   * @returns {Object|null} - Objeto Channel encontrado ou null
   */
  findChannelByName: (name, channels) => {
    if (!channels || !Array.isArray(channels) || !name) return null;
    console.log(`Buscando canal: "${name}"`);
    console.log('Canais disponíveis:', channels.map(c => c.get('name')));
    
    const normalizedName = name.toLowerCase().trim();
    
    // Mapeamento de nomes alternativos para canais
    const channelAliases = {
      'instagram': ['instagram', 'insta'],
      'facebook': ['facebook', 'fb', 'face'],
      'google': ['google', 'google ads', 'adwords'],
      'apucarana': ['apucarana'],
      'landing pages': ['landing pages', 'landingpage', 'landingpages', 'landing page', 'lp'],
      'e-commerce': [
      'ecommerce', 
      'e-commerce', 
      'e commerce', 
      'loja virtual', 
      'Ecommerce',  // Adicionei variações com E maiúsculo
      'E-commerce', 
      'E commerce'
    ],
      'tel 0800': ['tel 0800', '0800', 'telefone']
    };
    
    // Tentar encontrar por nome exato primeiro
    const exactMatch = channels.find(
      channel => channel.get('name').toLowerCase().trim() === normalizedName
    );
    
    if (exactMatch) return exactMatch;
    
    // Tentar encontrar por aliases
    for (const [channelKey, aliases] of Object.entries(channelAliases)) {
      if (aliases.includes(normalizedName)) {
        // Procurar o canal com este nome oficial
        const channelByAlias = channels.find(
          channel => channel.get('name').toLowerCase().trim() === channelKey.toLowerCase()
        );
        if (channelByAlias) return channelByAlias;
      }
    }
    
    // Verificar se o nome do canal está contido em algum canal oficial
    return channels.find(channel => {
      const channelName = channel.get('name').toLowerCase().trim();
      return channelName.includes(normalizedName) || normalizedName.includes(channelName);
    });
  },

  /**
   * Prepara dados de vendas para envio ao Back4app
   * @param {Object} salesBySellerAndChannel - Dados de vendas processados
   * @param {Date} referenceDate - Data de referência
   * @returns {Array} - Array de objetos com dados de vendas prontos para salvar
   */
  prepareSalesDataForParse: (salesBySellerAndChannel, referenceDate) => {
    if (!salesBySellerAndChannel) {
      return [];
    }
    
    const salesData = [];
    
    // Para cada vendedor com vendas
    Object.entries(salesBySellerAndChannel).forEach(([sellerId, sellerData]) => {
      // Para cada canal com vendas deste vendedor
      Object.entries(sellerData.channels).forEach(([channelId, channelData]) => {
        // Criar um objeto de dados para o Parse
        salesData.push({
          sellerId: sellerData.sellerObject,
          channelId: channelData.channelObject,
          dateRelease: referenceDate,
          vendas: channelData.sales,
          bats: channelData.bats
        });
      });
    });
    
    return salesData;
  },
  
  /**
   * Converte a planilha de vendas para o formato esperado pelo Back4app
   * @param {File} file - Arquivo Excel de vendas
   * @param {Date} referenceDate - Data de referência
   * @param {Array} sellers - Array de objetos Seller do Parse
   * @param {Array} channels - Array de objetos Channel do Parse
   * @returns {Promise<Array>} - Promise resolvida com dados de vendas prontos para o Parse
   */
  convertSalesExcelToParse: async (file, referenceDate, sellers, channels) => {
    try {
      // Ler o arquivo Excel
      const rawData = await excelService.readSalesExcelFile(file);
      
      // Processar os dados para obter vendas por vendedor e canal
      const salesBySellerAndChannel = excelService.processSalesData(
        rawData, 
        referenceDate,
        sellers,
        channels
      );
      
      // Preparar os dados para envio ao Parse
      const salesData = excelService.prepareSalesDataForParse(
        salesBySellerAndChannel,
        referenceDate
      );
      
      return {
        salesData,
        salesBySellerAndChannel
      };
    } catch (error) {
      console.error("Erro ao converter planilha de vendas:", error);
      throw error;
    }
  }}
  export default excelService;
