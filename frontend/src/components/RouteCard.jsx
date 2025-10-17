import React from 'react';
import '../styles/RouteCard.css';

const RouteCard = ({ route }) => {
  return (
    <div className="route-card">
      <div className="route-header">
        <div className="route-airports">
          <span className="airport-code">{route.source_iata || route.source_airport}</span>
          <span className="route-arrow">→</span>
          <span className="airport-code">{route.dest_iata || route.dest_airport}</span>
        </div>
        {route.airline_count && (
          <span className="airline-count">{route.airline_count} airlines</span>
        )}
      </div>
      <div className="route-details">
        {route.source_city && route.dest_city && (
          <p className="route-cities">
            {route.source_city} → {route.dest_city}
          </p>
        )}
        {route.airline_name && (
          <p className="airline-name">{route.airline_name}</p>
        )}
        {route.distance_km && (
          <p className="distance">{Math.round(route.distance_km)} km</p>
        )}
      </div>
    </div>
  );
};

export default RouteCard;
