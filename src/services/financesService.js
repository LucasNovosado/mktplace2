// src/services/financesService.js
import Parse from 'parse/dist/parse.min.js';

/**
 * Serviço para gerenciar operações relacionadas às finanças
 */
const financesService = {
  /**
   * Obtém o valor do ticket médio da classe Finances
   * @returns {Promise<number>} O valor do ticket médio
   */
  getTicketMedio: async () => {
    try {
      const Finances = Parse.Object.extend("Finances");
      const query = new Parse.Query(Finances);
      // Ordenar por data de criação descendente para pegar o registro mais recente
      query.descending("createdAt");
      query.limit(1);
      
      const result = await query.first();
      
      if (result) {
        const ticketMedio = result.get("ticketMedio");
        return ticketMedio ? Number(ticketMedio) : 237; // Valor padrão se não existir
      } else {
        console.warn("Nenhum registro encontrado na classe Finances");
        return 237; // Valor padrão
      }
    } catch (error) {
      console.error("Erro ao buscar ticket médio:", error);
      return 237; // Valor padrão em caso de erro
    }
  },

  /**
   * Atualiza o valor do ticket médio na classe Finances
   * @param {number} valor - O novo valor do ticket médio
   * @returns {Promise<boolean>} Retorna true se a atualização for bem-sucedida
   */
  updateTicketMedio: async (valor) => {
    try {
      const Finances = Parse.Object.extend("Finances");
      const query = new Parse.Query(Finances);
      // Ordenar por data de criação descendente para pegar o registro mais recente
      query.descending("createdAt");
      query.limit(1);
      
      let financeObj = await query.first();
      
      if (financeObj) {
        // Atualizar registro existente
        financeObj.set("ticketMedio", Number(valor));
        await financeObj.save();
        console.log("Ticket médio atualizado com sucesso para", valor);
        return true;
      } else {
        // Criar novo registro se não existir
        const newFinance = new Finances();
        newFinance.set("ticketMedio", Number(valor));
        await newFinance.save();
        console.log("Novo registro de Finances criado com ticket médio", valor);
        return true;
      }
    } catch (error) {
      console.error("Erro ao atualizar ticket médio:", error);
      return false;
    }
  }
};

export default financesService;