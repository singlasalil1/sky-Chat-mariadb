import React, { useState, useEffect } from 'react';
import RouteCard from '../components/RouteCard';
import AirportCard from '../components/AirportCard';
import { getBusiestRoutes, getLongestRoutes, getHubAirports } from '../services/api';
import '../styles/Analytics.css';

const Analytics = () => {
  const [busiestRoutes, setBusiestRoutes] = useState([]);
  const [longestFlights, setLongestFlights] = useState([]);
  const [hubAirports, setHubAirports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [busiest, longest, hubs] = await Promise.all([
        getBusiestRoutes(10),
        getLongestRoutes(10),
        getHubAirports(50)
      ]);

      setBusiestRoutes(busiest);
      setLongestFlights(longest);
      setHubAirports(hubs);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="loading-spinner">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="analytics-container">
        <h1 className="page-title">Flight Analytics Dashboard</h1>

        <div className="analytics-grid">
          <div className="analytics-card">
            <div className="card-header">
              <h2>🔥 Busiest Routes</h2>
              <p>Routes with the most airlines</p>
            </div>
            <div className="card-content">
              {busiestRoutes.slice(0, 5).map((route, index) => (
                <RouteCard key={index} route={route} />
              ))}
            </div>
          </div>

          <div className="analytics-card">
            <div className="card-header">
              <h2>🌍 Longest Flights</h2>
              <p>Routes by distance</p>
            </div>
            <div className="card-content">
              {longestFlights.slice(0, 5).map((route, index) => (
                <RouteCard key={index} route={route} />
              ))}
            </div>
          </div>

          <div className="analytics-card full-width">
            <div className="card-header">
              <h2>🏢 Major Hub Airports</h2>
              <p>Airports with most connections</p>
            </div>
            <div className="card-content">
              <div className="hubs-grid">
                {hubAirports.slice(0, 6).map((airport, index) => (
                  <AirportCard key={index} airport={airport} />
                ))}
              </div>
            </div>
          </div>

          <div className="analytics-card">
            <div className="card-header">
              <h2>📊 Quick Stats</h2>
              <p>Database statistics</p>
            </div>
            <div className="card-content">
              <div className="stats-list">
                <div className="stat-item">
                  <span className="stat-label">Total Airports</span>
                  <span className="stat-value">7,000+</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Airlines</span>
                  <span className="stat-value">5,000+</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Routes</span>
                  <span className="stat-value">67,000+</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Hub Airports</span>
                  <span className="stat-value">{hubAirports.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
