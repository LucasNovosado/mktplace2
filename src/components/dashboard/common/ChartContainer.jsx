import React from 'react';

const ChartContainer = ({ title, children, centered = false }) => {
  const containerClassName = centered ? "chart-container centered-container" : "chart-container";
  const headerClassName = centered ? "chart-header centered-header" : "chart-header";
  
  return (
    <div className={containerClassName}>
      <div className={headerClassName}>
        <h3 className="chart-title">{title}</h3>
      </div>
      {children}
    </div>
  );
};

export default ChartContainer;