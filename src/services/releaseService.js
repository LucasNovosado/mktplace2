// src/services/releaseService.js
import Parse from 'parse/dist/parse.min.js';

/**
 * Serviço para gerenciar operações relacionadas à classe Releases no Parse
 */
const releaseService = {
  /**
   * Obtém todos os Releases cadastrados
   * @returns {Promise<Array>} Promise resolvida com array de Releases
   */
  getAllReleases: async () => {
    try {
      const Release = Parse.Object.extend("Releases");
      const query = new Parse.Query(Release);
      
      // Incluir objetos relacionados (ponteiros)
      query.include("sellerId");
      query.include("channelId");
      
      // Ordenar por data de lançamento (decrescente)
      query.descending("dateRelease");
      
      const results = await query.find();
      return results;
    } catch (error) {
      console.error("Erro ao buscar releases:", error);
      throw error;
    }
  },

  /**
   * Obtém Releases de um período específico
   * @param {Date} startDate - Data inicial
   * @param {Date} endDate - Data final
   * @returns {Promise<Array>} Promise resolvida com array de Releases
   */
  getReleasesByDateRange: async (startDate, endDate) => {
    try {
      const Release = Parse.Object.extend("Releases");
      const query = new Parse.Query(Release);
      
      // Filtrar por período
      query.greaterThanOrEqualTo("dateRelease", startDate);
      query.lessThanOrEqualTo("dateRelease", endDate);
      
      // Incluir objetos relacionados
      query.include("sellerId");
      query.include("channelId");
      
      // Ordenar por data
      query.descending("dateRelease");
      
      const results = await query.find();
      return results;
    } catch (error) {
      console.error("Erro ao buscar releases por período:", error);
      throw error;
    }
  },

  /**
   * Verifica se existem releases para um vendedor, canal e data específicos
   * @param {Object} sellerId - Objeto Seller do Parse
   * @param {Object} channelId - Objeto Channel do Parse
   * @param {Date} date - Data de referência
   * @returns {Promise<Array>} Promise resolvida com releases encontrados
   */
  findExistingReleases: async (sellerId, channelId, date) => {
    try {
      const Release = Parse.Object.extend("Releases");
      const query = new Parse.Query(Release);
      
      // Filtrar por vendedor e canal
      query.equalTo("sellerId", sellerId);
      query.equalTo("channelId", channelId);
      
      // Filtrar pela data (considerando o dia inteiro)
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      query.greaterThanOrEqualTo("dateRelease", startDate);
      query.lessThanOrEqualTo("dateRelease", endDate);
      
      const results = await query.find();
      return results;
    } catch (error) {
      console.error("Erro ao buscar releases existentes:", error);
      throw error;
    }
  },

  /**
   * Cria um novo Release
   * @param {Object} releaseData - Dados do Release a ser criado
   * @returns {Promise<Parse.Object>} Promise resolvida com o objeto criado
   */
  createRelease: async (releaseData) => {
    try {
      const Release = Parse.Object.extend("Releases");
      const release = new Release();
      
      // Configurar campos básicos
      if (releaseData.dateRelease) release.set("dateRelease", releaseData.dateRelease);
      if (releaseData.leads !== undefined) release.set("leads", releaseData.leads);
      if (releaseData.vendas !== undefined) release.set("vendas", releaseData.vendas);
      if (releaseData.bats !== undefined) release.set("bats", releaseData.bats);
      
      // Configurar ponteiros para outros objetos
      if (releaseData.sellerId) release.set("sellerId", releaseData.sellerId);
      if (releaseData.channelId) release.set("channelId", releaseData.channelId);
      
      // Salvar o objeto
      const result = await release.save();
      return result;
    } catch (error) {
      console.error("Erro ao criar release:", error);
      throw error;
    }
  },

  /**
   * Cria múltiplos Releases de uma vez ou atualiza existentes
   * @param {Array} releasesArray - Array com dados de múltiplos Releases
   * @returns {Promise<Array>} Promise resolvida com array de objetos criados/atualizados
   */
  createBulkReleases: async (releasesArray) => {
    try {
      // Arrays para armazenar objetos a serem criados ou atualizados
      const objectsToCreate = [];
      const objectsToUpdate = [];
      
      // Para cada item no array de dados de releases
      for (const releaseData of releasesArray) {
        // Buscar se já existe um release para este vendedor, canal e data
        const existingReleases = await releaseService.findExistingReleases(
          releaseData.sellerId,
          releaseData.channelId,
          releaseData.dateRelease
        );
        
        if (existingReleases && existingReleases.length > 0) {
          // Se existir, atualizar
          const existingRelease = existingReleases[0];
          
          // Manter os valores existentes se não forem especificados
          const leads = releaseData.leads !== undefined ? releaseData.leads : existingRelease.get("leads") || 0;
          const vendas = releaseData.vendas !== undefined ? releaseData.vendas : existingRelease.get("vendas") || 0;
          const bats = releaseData.bats !== undefined ? releaseData.bats : existingRelease.get("bats") || 0;
          
          // Atualizar valores
          existingRelease.set("leads", leads);
          existingRelease.set("vendas", vendas);
          existingRelease.set("bats", bats);
          
          objectsToUpdate.push(existingRelease);
        } else {
          // Se não existir, criar novo
          const Release = Parse.Object.extend("Releases");
          const release = new Release();
          
          // Definir valores padrão para campos não especificados
          const leads = releaseData.leads !== undefined ? releaseData.leads : 0;
          const vendas = releaseData.vendas !== undefined ? releaseData.vendas : 0;
          const bats = releaseData.bats !== undefined ? releaseData.bats : 0;
          
          // Configurar campos
          release.set("dateRelease", releaseData.dateRelease);
          release.set("leads", leads);
          release.set("vendas", vendas);
          release.set("bats", bats);
          release.set("sellerId", releaseData.sellerId);
          release.set("channelId", releaseData.channelId);
          
          objectsToCreate.push(release);
        }
      }
      
      // Executar operações em lote
      const results = [];
      
      if (objectsToUpdate.length > 0) {
        const updatedObjects = await Parse.Object.saveAll(objectsToUpdate);
        results.push(...updatedObjects);
      }
      
      if (objectsToCreate.length > 0) {
        const createdObjects = await Parse.Object.saveAll(objectsToCreate);
        results.push(...createdObjects);
      }
      
      console.log(`Releases criados: ${objectsToCreate.length}, atualizados: ${objectsToUpdate.length}`);
      return results;
    } catch (error) {
      console.error("Erro ao criar/atualizar múltiplos releases:", error);
      throw error;
    }
  },

  /**
   * Obtém todos os canais (Channels) disponíveis
   * @returns {Promise<Array>} Promise resolvida com array de Channels
   */
  getAllChannels: async () => {
    try {
      const Channel = Parse.Object.extend("Channels");
      const query = new Parse.Query(Channel);
      
      // Ordenar por nome
      query.ascending("name");
      
      const results = await query.find();
      return results;
    } catch (error) {
      console.error("Erro ao buscar canais:", error);
      throw error;
    }
  },

  /**
   * Obtém todos os vendedores (Sellers) disponíveis
   * @returns {Promise<Array>} Promise resolvida com array de Sellers
   */
  getAllSellers: async () => {
    try {
      const Seller = Parse.Object.extend("Sellers");
      const query = new Parse.Query(Seller);
      
      // Ordenar por nome do vendedor
      query.ascending("seller");
      
      // Filtrar apenas vendedores ativos
      query.equalTo("isActive", true);
      
      const results = await query.find();
      return results;
    } catch (error) {
      console.error("Erro ao buscar vendedores:", error);
      throw error;
    }
  }
};

export default releaseService;