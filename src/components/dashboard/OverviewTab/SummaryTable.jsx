import React from 'react';

const SummaryTable = ({ data }) => {
  return (
    <div className="data-table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>Vendedor</th>
            <th>Leads</th>
            <th>Vendas</th>
            <th>BATS</th>
            <th>Taxa de Conversão</th>
          </tr>
        </thead>
        <tbody>
          {data.map((seller, index) => (
            <tr key={index}>
              <td>{seller.name}</td>
              <td>{seller.leads}</td>
              <td>{seller.vendas}</td>
              <td>{seller.bats}</td>
              <td>{seller.taxaConversao.toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SummaryTable;