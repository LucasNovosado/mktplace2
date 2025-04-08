import React from 'react';

const MetricCard = ({ title, value, icon, className }) => {
  return (
    <div className={`overview-card ${className || ''}`}>
      <div className="overview-card-header">
        <div className={`overview-card-icon ${className}`}>
          {icon}
        </div>
        <div>
          <h3 className="overview-card-title">{title}</h3>
        </div>
      </div>
      <p className="overview-card-value">{value}</p>
    </div>
  );
};

export default MetricCard;