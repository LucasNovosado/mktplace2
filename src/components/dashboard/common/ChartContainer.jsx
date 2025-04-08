import React from 'react';

const ChartContainer = ({ title, children }) => {
  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3 className="chart-title">{title}</h3>
      </div>
      {children}
    </div>
  );
};

export default ChartContainer;