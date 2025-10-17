import React from 'react';
import '../styles/AirportCard.css';

const AirportCard = ({ airport }) => {
  return (
    <div className="airport-card">
      <div className="airport-header">
        <h3 className="airport-name">{airport.name}</h3>
        {airport.iata && <span className="airport-code">{airport.iata}</span>}
      </div>
      <div className="airport-details">
        <p className="airport-location">
          {airport.city}, {airport.country}
        </p>
        {airport.route_count && (
          <p className="airport-routes">{airport.route_count} routes</p>
        )}
        {airport.distance && (
          <p className="airport-distance">{Math.round(airport.distance)} km away</p>
        )}
      </div>
    </div>
  );
};

export default AirportCard;
