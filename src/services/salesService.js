// src/services/salesService.js
import Parse from 'parse/dist/parse.min.js';

/**
 * Serviço para gerenciar operações relacionadas a vendas
 */
const salesService = {
  /**
   * Obtém todas as vendedoras ativas
   * @returns {Promise<Array>} Promise resolvida com array de vendedoras ativas
   */
  getActiveSellers: async () => {
    try {
      const Seller = Parse.Object.extend("Sellers");
      const query = new Parse.Query(Seller);
      
      // Filtrar apenas vendedores ativos
      query.equalTo("isActive", true);
      
      // Removido o filtro de gênero, pois pode não existir esse campo na classe Sellers
      // ou pode estar usando outro nome de campo ou valor
      
      // Ordenar por nome
      query.ascending("seller");
      
      const results = await query.find();
      console.log("Vendedores ativos encontrados:", results.length);
      return results;
    } catch (error) {
      console.error("Erro ao buscar vendedoras ativas:", error);
      throw error;
    }
  },

  /**
   * Processa a imagem de vendas e extrai os dados
   * @param {File} imageFile - Arquivo de imagem com dados de vendas
   * @param {Object} seller - Objeto do vendedor
   * @param {Date} dateRelease - Data de referência para as vendas
   * @returns {Promise<Object>} Dados de vendas processados
   */
  processSalesImage: async (imageFile, seller, dateRelease) => {
    try {
      if (!imageFile) {
        return {
          sellerId: seller,
          dateRelease: dateRelease,
          processedSuccessfully: false,
          noSales: true, // Indica que o vendedor foi marcado como "sem vendas"
        };
      }
      
      // Analisar a imagem para obter as vendas por canal
      const analysisResults = await salesService.analyzeSalesImage(imageFile);
      
      return {
        sellerId: seller,
        dateRelease: dateRelease,
        processedSuccessfully: true,
        totalSales: analysisResults.totalSales,
        channelDistribution: analysisResults.channelDistribution,
        batsSales: analysisResults.batsSales
      };
    } catch (error) {
      console.error("Erro ao processar imagem de vendas:", error);
      throw error;
    }
  },

  /**
   * Salva os dados de vendas processados no Parse
   * @param {Array} salesData - Array com dados de vendas de múltiplas vendedoras
   * @returns {Promise<boolean>} Promise resolvida com status de sucesso
   */
  saveSalesData: async (salesData) => {
    try {
      // Verificar se temos dados válidos
      if (!salesData || salesData.length === 0) {
        throw new Error("Nenhum dado de vendas válido para salvar");
      }

      // Para cada conjunto de dados de vendas
      const updatePromises = salesData.map(async (data) => {
        // Se o vendedor foi marcado como "sem vendas", podemos pular
        if (data.noSales) {
          return { success: true, message: `Nenhuma venda para ${data.sellerId.get('seller')}` };
        }
        
        // Buscar os Releases existentes para o vendedor e data
        const Release = Parse.Object.extend("Releases");
        const query = new Parse.Query(Release);
        
        // Filtrar pelo vendedor
        query.equalTo("sellerId", data.sellerId);
        
        // Filtrar pela data (considerando um dia inteiro)
        const startDate = new Date(data.dateRelease);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(data.dateRelease);
        endDate.setHours(23, 59, 59, 999);
        
        query.greaterThanOrEqualTo("dateRelease", startDate);
        query.lessThanOrEqualTo("dateRelease", endDate);
        
        // Incluir o canal relacionado para poder identificar o tipo
        query.include("channelId");
        
        // Buscar os releases existentes
        const releases = await query.find();
        
        // Se não encontrar nenhum release para atualizar
        if (releases.length === 0) {
          console.warn(`Nenhum release encontrado para ${data.sellerId.get('seller')} na data ${startDate.toLocaleDateString()}`);
          return { success: false, message: "Nenhum release encontrado para atualizar" };
        }
        
        // Mapeamento de nomes de canal do Parse para chaves usadas na análise da imagem
        const channelMapping = {
          'E-commerce': 'ecommerce',
          'Facebook': 'facebook',
          'Google': 'google',
          'Landing Pages': 'landingpages',
          'Instagram': 'instagram',
          'Apucarana': 'apucarana'
        };
        
        // Atualizar as vendas nos releases encontrados com base no canal
        const updateOperations = [];
        let updatedReleases = 0;
        
        for (const release of releases) {
          // Obter o nome do canal do release atual
          const channelName = release.get("channelId").get("name");
          const channelKey = channelMapping[channelName] || channelName.toLowerCase();
          
          // Verificar se temos vendas para este canal específico
          if (data.channelDistribution && 
              channelKey in data.channelDistribution && 
              data.channelDistribution[channelKey] > 0) {
            
            // Atualizar o campo de vendas - atribuir todas as vendas deste canal
            const vendasValue = data.channelDistribution[channelKey];
            release.set("vendas", vendasValue);
            
            // Se temos vendas bats e este canal tem vendas, atribuir todas as bats a este canal
            // já que estamos considerando que a imagem mostra apenas um canal
            if (data.batsSales > 0 && channelKey in data.channelDistribution) {
              release.set("bats", data.batsSales);
            } else {
              release.set("bats", 0);
            }
            
            updateOperations.push(release.save());
            updatedReleases++;
          } else {
            // Não há vendas para este canal
            release.set("vendas", 0);
            release.set("bats", 0);
            updateOperations.push(release.save());
          }
        }
        
        await Promise.all(updateOperations);
        return { 
          success: updatedReleases > 0, 
          message: updatedReleases > 0 
            ? `${updatedReleases} releases atualizados para ${data.sellerId.get('seller')}` 
            : `Nenhum release atualizado para ${data.sellerId.get('seller')} - canais não correspondem`
        };
      });

      const results = await Promise.all(updatePromises);
      return results.every(result => result.success);
    } catch (error) {
      console.error("Erro ao salvar dados de vendas:", error);
      throw error;
    }
  },

  /**
   * Analisa uma imagem de vendas para extrair informações
   * Processa a imagem buscando cores na primeira coluna que representam diferentes canais
   * Conta uma linha como uma venda
   * @param {File} imageFile - Arquivo de imagem
   * @returns {Promise<Object>} Dados extraídos da imagem
   */
  analyzeSalesImage: async (imageFile) => {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          // Em uma implementação real, analisaríamos a imagem de fato
          // Verificando a cor da primeira coluna e contando linhas
          // Também verificaríamos a 5ª coluna para contar "BATS"
          
          // Mapeamento de cores para canais (conforme especificado):
          // Instagram -> Rosa
          // E-commerce -> Roxo
          // Apucarana -> Laranja
          // Landing Pages -> Azul
          // Google -> Amarelo
          // Facebook -> Branco
          
          // Para este mockup, simulamos a análise baseada no nome do arquivo
          const fileName = imageFile.name.toLowerCase();
          
          // Inicializar contadores
          let salesData = {
            totalSales: 0,
            channelDistribution: {
              instagram: 0,
              ecommerce: 0,
              apucarana: 0,
              landingpages: 0,
              google: 0,
              facebook: 0
            },
            batsSales: 0 // Contador para vendas da marca "bats"
          };
          
          // Simular diferentes resultados baseados no nome do arquivo
          if (fileName.includes('daiane')) {
            // Simular 3 linhas com a primeira coluna azul (landing pages) e 1 com BATS
            salesData.totalSales = 3;
            salesData.channelDistribution.landingpages = 3;
            salesData.batsSales = 1;
          } else if (fileName.includes('gisele')) {
            // Simular 4 linhas com a primeira coluna amarela (google) e 2 com BATS
            salesData.totalSales = 4;
            salesData.channelDistribution.google = 4;
            salesData.batsSales = 2;
          } else if (fileName.includes('isabelly')) {
            // Simular 5 linhas com a primeira coluna rosa (instagram) e 3 com BATS
            salesData.totalSales = 5;
            salesData.channelDistribution.instagram = 5;
            salesData.batsSales = 3;
          } else if (fileName.includes('maria')) {
            // Simular 2 linhas com a primeira coluna laranja (apucarana) e 1 com BATS
            salesData.totalSales = 2;
            salesData.channelDistribution.apucarana = 2;
            salesData.batsSales = 1;
          } else {
            // Valores padrão - 1 linha com a primeira coluna azul (landing pages)
            salesData.totalSales = 1;
            salesData.channelDistribution.landingpages = 1;
            salesData.batsSales = 1;
          }
          
          resolve(salesData);
        };
        
        reader.onerror = () => {
          reject(new Error('Erro ao ler o arquivo de imagem'));
        };
        
        // Ler a imagem como URL para visualização
        reader.readAsDataURL(imageFile);
      } catch (error) {
        reject(error);
      }
    });
  },
};

export default salesService;