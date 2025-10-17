import React, { useState } from 'react';
import SearchTabs from '../components/SearchTabs';
import RouteCard from '../components/RouteCard';
import AirportCard from '../components/AirportCard';
import { findDirectRoutes, findRoutesWithStop, searchAirports, searchAirlines } from '../services/api';
import '../styles/Search.css';

const Search = () => {
  const [activeTab, setActiveTab] = useState('routes');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  // Route search state
  const [fromAirport, setFromAirport] = useState('');
  const [toAirport, setToAirport] = useState('');

  // Airport/Airline search state
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { id: 'routes', label: 'Routes' },
    { id: 'airports', label: 'Airports' },
    { id: 'airlines', label: 'Airlines' }
  ];

  const handleRouteSearch = async (withStop = false) => {
    if (!fromAirport || !toAirport) {
      alert('Please enter both airports');
      return;
    }

    setLoading(true);
    try {
      const data = withStop
        ? await findRoutesWithStop(fromAirport.toUpperCase(), toAirport.toUpperCase())
        : await findDirectRoutes(fromAirport.toUpperCase(), toAirport.toUpperCase());
      setResults(data);
    } catch (error) {
      alert('Error searching routes');
    } finally {
      setLoading(false);
    }
  };

  const handleAirportSearch = async () => {
    if (!searchQuery) return;

    setLoading(true);
    try {
      const data = await searchAirports(searchQuery);
      setResults(data);
    } catch (error) {
      alert('Error searching airports');
    } finally {
      setLoading(false);
    }
  };

  const handleAirlineSearch = async () => {
    if (!searchQuery) return;

    setLoading(true);
    try {
      const data = await searchAirlines(searchQuery);
      setResults(data);
    } catch (error) {
      alert('Error searching airlines');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-page">
      <div className="search-container">
        <h1 className="page-title">Search Flights & Airports</h1>

        <SearchTabs activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />

        {activeTab === 'routes' && (
          <div className="tab-content">
            <div className="search-card">
              <h2>Find Flight Routes</h2>
              <div className="search-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>From Airport (IATA)</label>
                    <input
                      type="text"
                      value={fromAirport}
                      onChange={(e) => setFromAirport(e.target.value)}
                      placeholder="e.g., JFK"
                      maxLength="3"
                    />
                  </div>
                  <div className="form-group">
                    <label>To Airport (IATA)</label>
                    <input
                      type="text"
                      value={toAirport}
                      onChange={(e) => setToAirport(e.target.value)}
                      placeholder="e.g., LAX"
                      maxLength="3"
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => handleRouteSearch(false)}
                    disabled={loading}
                  >
                    {loading ? 'Searching...' : 'Search Routes'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleRouteSearch(true)}
                    disabled={loading}
                  >
                    Include 1 Stop
                  </button>
                </div>
              </div>
            </div>
            <div className="results-container">
              {results.length > 0 ? (
                results.map((route, index) => <RouteCard key={index} route={route} />)
              ) : (
                <p className="no-results">No routes found. Try searching for different airports.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'airports' && (
          <div className="tab-content">
            <div className="search-card">
              <h2>Search Airports</h2>
              <div className="search-form">
                <div className="form-group">
                  <label>Search by name, city, or IATA code</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g., London, JFK, Heathrow"
                  />
                </div>
                <div className="form-actions">
                  <button
                    className="btn btn-primary"
                    onClick={handleAirportSearch}
                    disabled={loading}
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>
            </div>
            <div className="results-container">
              {results.length > 0 ? (
                results.map((airport, index) => <AirportCard key={index} airport={airport} />)
              ) : (
                <p className="no-results">No airports found. Try a different search term.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'airlines' && (
          <div className="tab-content">
            <div className="search-card">
              <h2>Search Airlines</h2>
              <div className="search-form">
                <div className="form-group">
                  <label>Search by name, country, or IATA code</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g., Emirates, United, BA"
                  />
                </div>
                <div className="form-actions">
                  <button
                    className="btn btn-primary"
                    onClick={handleAirlineSearch}
                    disabled={loading}
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>
            </div>
            <div className="results-container">
              {results.length > 0 ? (
                <div className="airlines-grid">
                  {results.map((airline, index) => (
                    <div key={index} className="airline-card">
                      <h3>{airline.name}</h3>
                      <p>{airline.iata && `IATA: ${airline.iata}`}</p>
                      <p>{airline.country}</p>
                      <span className={`status ${airline.active === 'Y' ? 'active' : 'inactive'}`}>
                        {airline.active === 'Y' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-results">No airlines found. Try a different search term.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
