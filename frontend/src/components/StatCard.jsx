import React from 'react';
import '../styles/StatCard.css';

const StatCard = ({ number, label, icon }) => {
  return (
    <div className="stat-card">
      {icon && <div className="stat-icon">{icon}</div>}
      <div className="stat-number">{number}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
};

export default StatCard;
