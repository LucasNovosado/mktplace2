import React from 'react';

const DataTable = ({ title, columns, data, centered = false }) => {
  const tableClassName = centered ? "data-table centered-table" : "data-table";
  const cellClassName = centered ? "centered-cell" : "";
  
  return (
    <>
      {title && (
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
        </div>
      )}
      
      <div className="data-table-wrapper">
        <table className={tableClassName}>
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={index} className={cellClassName} style={{textAlign: 'center'}}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                {Object.values(row).map((cell, cellIndex) => (
                  <td key={cellIndex} className={cellClassName} style={{textAlign: 'center'}}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default DataTable;