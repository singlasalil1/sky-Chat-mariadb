import React, { useEffect, useMemo, useState } from 'react';
import {
  getHubAirports,
  getRoutesFromAirport,
  getAirlinesFromAirport,
  searchAirports,
  findDirectRoutes,
  findRoutesWithStop
} from '../services/api';
import TopDestinationsMap from './TopDestinationsMap';
import '../styles/NetworkViewer.css';

const formatNumber = (value) => (value ? value.toLocaleString() : '0');
const formatDistance = (value) => (value ? `${Math.round(value).toLocaleString()} km` : '—');
const formatMs = (value) => (value !== undefined && value !== null ? `${value} ms` : '—');
const initialRouteSearchState = {
  loading: false,
  error: '',
  direct: [],
  connections: []
};

const NetworkViewer = () => {
  const [hubs, setHubs] = useState([]);
  const [loadingHubs, setLoadingHubs] = useState(true);
  const [hubError, setHubError] = useState('');
  const [selectedAirport, setSelectedAirport] = useState(null);

  const [networkLoading, setNetworkLoading] = useState(false);
  const [networkError, setNetworkError] = useState('');
  const [routes, setRoutes] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [airportStats, setAirportStats] = useState(null);
  const [topDestinations, setTopDestinations] = useState([]);
  const [queryInsights, setQueryInsights] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);

  const [routeSearch, setRouteSearch] = useState({ from: '', to: '' });
  const [routeSearchState, setRouteSearchState] = useState(initialRouteSearchState);
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);

  const airportCode = selectedAirport?.iata || selectedAirport?.icao || '—';
  const airportName = selectedAirport?.name || 'Airport overview';
  const airportLocation = selectedAirport
    ? [selectedAirport.city, selectedAirport.country].filter(Boolean).join(', ') || 'Location unavailable'
    : '';

  const resolveAirportCode = (route, prefix) => {
    const candidates = [
      route?.[`${prefix}_iata`],
      route?.[`${prefix}_icao`],
      route?.[`${prefix}_code`],
      route?.[`${prefix}_airport`],
      route?.[prefix]
    ];
    return candidates.find((value) => value) || '—';
  };

  useEffect(() => {
    const loadHubs = async () => {
      setLoadingHubs(true);
      setHubError('');
      try {
        const data = await getHubAirports(40);
        setHubs(data);
        if (data.length > 0) {
          handleSelectAirport(data[0]);
        }
      } catch (error) {
        console.error('Error loading hubs:', error);
        setHubError('Unable to load hub airports.');
      } finally {
        setLoadingHubs(false);
      }
    };

    loadHubs();
  }, []);

  const computeTopDestinations = (routeData) => {
    const destinationMap = new Map();

    routeData.forEach((route) => {
      const code =
        route.dest_iata ||
        route.dest_icao ||
        route.dest_code ||
        route.dest_airport ||
        route.dest;

      if (!code) {
        return;
      }

      if (!destinationMap.has(code)) {
        destinationMap.set(code, {
          code,
          name: route.dest_name || code,
          city: route.dest_city || '',
          country: route.dest_country || '',
          airlines: new Set(),
          routeCount: 0,
          distances: [],
          latitude: route.dest_latitude,
          longitude: route.dest_longitude
        });
      }

      const entry = destinationMap.get(code);
      entry.routeCount += 1;
      if (route.airline_iata) {
        entry.airlines.add(route.airline_iata);
      }
      if (route.distance_km) {
        entry.distances.push(route.distance_km);
      }
      if (!entry.latitude && route.dest_latitude) {
        entry.latitude = route.dest_latitude;
      }
      if (!entry.longitude && route.dest_longitude) {
        entry.longitude = route.dest_longitude;
      }
    });

    const destinations = Array.from(destinationMap.values()).map((entry) => ({
      code: entry.code,
      name: entry.name,
      city: entry.city,
      country: entry.country,
      airlineCount: entry.airlines.size,
      routeCount: entry.routeCount,
      avgDistance:
        entry.distances.length > 0
          ? entry.distances.reduce((sum, value) => sum + value, 0) / entry.distances.length
          : null,
      latitude: entry.latitude,
      longitude: entry.longitude
    }));

    destinations.sort((a, b) => {
      if (b.airlineCount !== a.airlineCount) return b.airlineCount - a.airlineCount;
      if (b.routeCount !== a.routeCount) return b.routeCount - a.routeCount;
      return (b.avgDistance || 0) - (a.avgDistance || 0);
    });

    return destinations.slice(0, 8);
  };

  const computeStats = (routeData, airlineData) => {
    if (!routeData || routeData.length === 0) {
      return {
        totalRoutes: 0,
        destinations: 0,
        countries: 0,
        airlines: 0,
        avgDistance: 0,
        longestRoute: null
      };
    }

    const destinationCodes = new Set();
    const destinationCountries = new Set();
    const airlineCodes = new Set();
    let totalDistance = 0;
    let countedRoutes = 0;
    let longestRoute = null;

    routeData.forEach((route) => {
      if (route.dest_iata) destinationCodes.add(route.dest_iata);
      if (route.dest_country) destinationCountries.add(route.dest_country);
      if (route.airline_iata) airlineCodes.add(route.airline_iata);

      if (route.distance_km) {
        totalDistance += route.distance_km;
        countedRoutes += 1;

        if (!longestRoute || route.distance_km > longestRoute.distance) {
          const destinationCode =
            route.dest_iata ||
            route.dest_icao ||
            route.dest_code ||
            route.dest_airport ||
            route.dest;
          longestRoute = {
            distance: route.distance_km,
            dest_iata: destinationCode,
            dest_name: route.dest_name || destinationCode,
            airline: route.airline_name || route.airline_iata || '—'
          };
        }
      }
    });

    const avgDistance = countedRoutes > 0 ? totalDistance / countedRoutes : 0;

    return {
      totalRoutes: routeData.length,
      destinations: destinationCodes.size,
      countries: destinationCountries.size,
      airlines: airlineCodes.size || (airlineData ? airlineData.length : 0),
      avgDistance,
      longestRoute
    };
  };

  const loadAirportNetwork = async (airport) => {
    if (!airport) return;

    setNetworkLoading(true);
    setNetworkError('');

    try {
      const [routesResponse, airlinesResponse] = await Promise.all([
        getRoutesFromAirport(airport.iata),
        getAirlinesFromAirport(airport.iata)
      ]);

      const routeData = routesResponse.routes || routesResponse;
      const airlineData = airlinesResponse.airlines || airlinesResponse;

      setRoutes(routeData);
      setAirlines(airlineData);
      setTopDestinations(computeTopDestinations(routeData));
      setAirportStats(computeStats(routeData, airlineData));

      const insights = [];
      if (routesResponse.query_info) {
        insights.push({
          operation: 'Outbound routes',
          ...routesResponse.query_info
        });
      }
      if (airlinesResponse.query_info) {
        insights.push({
          operation: 'Airline coverage',
          ...airlinesResponse.query_info
        });
      }
      setQueryInsights(insights);
    } catch (error) {
      console.error('Error loading airport network:', error);
      setNetworkError('Unable to load network data for this airport.');
      setRoutes([]);
      setAirlines([]);
      setTopDestinations([]);
      setAirportStats(null);
      setQueryInsights([]);
    } finally {
      setNetworkLoading(false);
    }
  };

  const handleSelectAirport = (airport) => {
    if (!airport) return;
    setSelectedAirport(airport);
    setSearchTerm(airport.iata || airport.name || '');
    setShowSearchSuggestions(false);
    loadAirportNetwork(airport);
  };

  const handleSearchChange = async (value) => {
    setSearchTerm(value.toUpperCase());
    if (value.trim().length < 2) {
      setSearchSuggestions([]);
      setShowSearchSuggestions(false);
      return;
    }

    try {
      const results = await searchAirports(value.trim());
      setSearchSuggestions(results.slice(0, 7));
      setShowSearchSuggestions(true);
    } catch (error) {
      console.error('Error searching airports:', error);
      setSearchSuggestions([]);
      setShowSearchSuggestions(false);
    }
  };

  const handleRouteFinderInputChange = async (field, value) => {
    const normalized = value.toUpperCase();
    setRouteSearch((prev) => ({ ...prev, [field]: normalized }));

    if (normalized.trim().length < 2) {
      if (field === 'from') {
        setFromSuggestions([]);
        setShowFromSuggestions(false);
      } else {
        setToSuggestions([]);
        setShowToSuggestions(false);
      }
      return;
    }

    try {
      const results = await searchAirports(normalized.trim());
      if (field === 'from') {
        setFromSuggestions(results.slice(0, 6));
        setShowFromSuggestions(true);
      } else {
        setToSuggestions(results.slice(0, 6));
        setShowToSuggestions(true);
      }
    } catch (error) {
      console.error('Error searching airports for route finder:', error);
    }
  };

  const handleRouteSuggestionSelect = (field, airport) => {
    if (field === 'from') {
      setRouteSearch((prev) => ({ ...prev, from: airport.iata || airport.icao || '' }));
      setShowFromSuggestions(false);
    } else {
      setRouteSearch((prev) => ({ ...prev, to: airport.iata || airport.icao || '' }));
      setShowToSuggestions(false);
    }
  };

  const handleSearchSuggestionSelect = (airport) => {
    handleSelectAirport(airport);
  };

  const handleRouteFinderSubmit = async (event) => {
    event.preventDefault();

    if (!routeSearch.from || !routeSearch.to) {
      setRouteSearchState((prev) => ({
        ...prev,
        error: 'Enter both origin and destination airport codes.'
      }));
      return;
    }

    if (routeSearch.from === routeSearch.to) {
      setRouteSearchState((prev) => ({
        ...prev,
        error: 'Origin and destination must be different.'
      }));
      return;
    }

    setRouteSearchState({ ...initialRouteSearchState, loading: true });

    try {
      const [direct, connections] = await Promise.all([
        findDirectRoutes(routeSearch.from, routeSearch.to),
        findRoutesWithStop(routeSearch.from, routeSearch.to)
      ]);

      setRouteSearchState({
        loading: false,
        error: '',
        direct,
        connections
      });
    } catch (error) {
      console.error('Error finding routes:', error);
      setRouteSearchState({
        ...initialRouteSearchState,
        error: 'Unable to find routes. Please verify the airport codes.'
      });
    }
  };

  const topAirlines = useMemo(() => {
    if (!airlines || airlines.length === 0) return [];
    return airlines.slice(0, 8);
  }, [airlines]);

  const renderRouteFinderResults = () => {
    if (routeSearchState.loading) {
      return <div className="route-results-loading">Searching routes...</div>;
    }

    if (routeSearchState.error) {
      return <div className="route-results-error">{routeSearchState.error}</div>;
    }

    if (
      (!routeSearchState.direct || routeSearchState.direct.length === 0) &&
      (!routeSearchState.connections || routeSearchState.connections.length === 0)
    ) {
      return (
        <div className="route-results-empty">
          <span role="img" aria-label="routes">🛰️</span>
          <p>No saved searches yet. Try looking up a pair of airports.</p>
        </div>
      );
    }

    return (
      <div className="route-results-grid">
        <div className="route-results-column">
          <h4>Direct flights</h4>
          {routeSearchState.direct.length === 0 ? (
            <p className="muted">No direct flights found.</p>
          ) : (
            <ul>
              {routeSearchState.direct.slice(0, 6).map((route, index) => (
                <li key={`${route.airline_iata || 'airline'}-${route.flight_number || index}-${resolveAirportCode(route, 'dest')}`}>
                  <div className="route-row">
                    <span className="route-airline">{route.airline_name || route.airline_iata || 'Unknown airline'}</span>
                    <span className="route-path">{resolveAirportCode(route, 'source')} → {resolveAirportCode(route, 'dest')}</span>
                  </div>
                  {route.equipment && (
                    <div className="route-meta">Equipment: {route.equipment}</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="route-results-column">
          <h4>1-stop options</h4>
          {routeSearchState.connections.length === 0 ? (
            <p className="muted">No one-stop connections found.</p>
          ) : (
            <ul>
              {routeSearchState.connections.slice(0, 8).map((route, index) => (
                <li key={`${resolveAirportCode(route, 'source')}-${resolveAirportCode(route, 'connection')}-${resolveAirportCode(route, 'dest')}-${index}`}>
                  <div className="route-row">
                    <span className="route-path">
                      {resolveAirportCode(route, 'source')} → {resolveAirportCode(route, 'connection')} → {resolveAirportCode(route, 'dest')}
                    </span>
                  </div>
                  <div className="route-meta">
                    {route.first_airline} → {route.second_airline}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  };

  if (loadingHubs && !selectedAirport) {
    return (
      <div className="network-viewer">
        <div className="network-loading">
          <div className="spinner">⟳</div>
          <p>Loading network explorer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="network-viewer">
      <aside className="network-sidebar">
        <div className="sidebar-intro">
          <h2>Network Explorer</h2>
          <p>Pick a hub airport or search for any IATA code to inspect its reach.</p>
        </div>

        <div className="sidebar-search">
          <label htmlFor="network-airport-search">Search airport</label>
          <input
            id="network-airport-search"
            type="text"
            value={searchTerm}
            placeholder="Try JFK, LHR, SIN..."
            onFocus={() => {
              if (searchSuggestions.length > 0) setShowSearchSuggestions(true);
            }}
            onChange={(event) => handleSearchChange(event.target.value)}
            onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 150)}
          />
          {showSearchSuggestions && searchSuggestions.length > 0 && (
            <ul className="suggestions">
              {searchSuggestions.map((airport) => (
                <li
                  key={`${airport.airport_id || airport.iata}`}
                  onMouseDown={() => handleSearchSuggestionSelect(airport)}
                >
                  <span className="suggestion-code">{airport.iata || airport.icao || '—'}</span>
                  <span className="suggestion-name">{airport.name}</span>
                  <span className="suggestion-meta">{airport.city}, {airport.country}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="sidebar-section">
          <h3>Top hub airports</h3>
          {hubError && <div className="sidebar-error">{hubError}</div>}
          <div className="hub-list">
            {hubs.map((hub) => (
              <button
                key={hub.iata || hub.icao || hub.airport_id}
                className={`hub-item ${airportCode === (hub.iata || hub.icao) ? 'active' : ''}`}
                onClick={() => handleSelectAirport(hub)}
              >
                <span className="hub-code">{hub.iata || hub.icao || '—'}</span>
                <span className="hub-details">
                  <strong>{hub.name || 'Airport'}</strong>
                  <small>{[hub.city, hub.country].filter(Boolean).join(', ') || 'Location unavailable'}</small>
                  <span className="hub-metric">{formatNumber(hub.route_count || hub.routes)} routes</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <main className="network-content">
        {selectedAirport ? (
          <>
            <section className="airport-overview">
              <div className="airport-header">
                <div>
                  <div className="airport-code">{airportCode}</div>
                  <h1>{airportName}</h1>
                  <p>{airportLocation}</p>
                </div>
                <div className="airport-stats-grid">
                  <div className="stat-card">
                    <span className="stat-value">{formatNumber(airportStats?.destinations)}</span>
                    <span className="stat-label">Destinations</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value">{formatNumber(airportStats?.airlines)}</span>
                    <span className="stat-label">Airlines</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value">{formatNumber(airportStats?.countries)}</span>
                    <span className="stat-label">Countries</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value">{formatDistance(airportStats?.avgDistance)}</span>
                    <span className="stat-label">Avg route length</span>
                  </div>
                </div>
              </div>
              {airportStats?.longestRoute && (
                <div className="airport-highlight">
                  Longest route: {airportCode} → {airportStats.longestRoute.dest_iata} · {formatDistance(airportStats.longestRoute.distance)} with {airportStats.longestRoute.airline}
                </div>
              )}
            </section>

            {networkLoading ? (
              <div className="network-panel loading">
                <div className="spinner">⟳</div>
                <p>Loading network data...</p>
              </div>
            ) : networkError ? (
              <div className="network-panel error">{networkError}</div>
            ) : (
              <>
                <section className="network-panels">
                  <div className="network-panel top-destinations-panel">
                    <header>
                      <h3>Top connected destinations</h3>
                      <span className="panel-meta">Visualize reach and depth by airline coverage</span>
                    </header>
                    {topDestinations.length === 0 ? (
                      <p className="muted">No outbound routes found for this airport.</p>
                    ) : (
                      <div className="top-destinations-content">
                        <TopDestinationsMap origin={selectedAirport} destinations={topDestinations} />
                        <ul className="destination-list">
                          {topDestinations.map((dest) => (
                            <li key={dest.code}>
                              <div className="destination-primary">
                                <span className="destination-code">{dest.code}</span>
                                <div>
                                  <strong>{dest.name}</strong>
                                  <small>{dest.city}{dest.country ? `, ${dest.country}` : ''}</small>
                                </div>
                              </div>
                              <div className="destination-meta">
                                <span>{dest.airlineCount} airlines</span>
                                <span>•</span>
                                <span>{dest.routeCount} routes</span>
                                <span>•</span>
                                <span>{formatDistance(dest.avgDistance)}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </section>

                <section className="network-panel airline-coverage-panel">
                  <header>
                    <h3>Airline coverage</h3>
                    <span className="panel-meta">Top operators ranked by route count</span>
                  </header>
                  {topAirlines.length === 0 ? (
                    <p className="muted">No airlines found for this airport.</p>
                  ) : (
                    <ul className="airline-list">
                      {topAirlines.map((airline) => (
                        <li key={airline.airline_id || airline.airline_iata}>
                          <div className="airline-header">
                            <span className="airline-code">{airline.airline_iata || airline.airline_icao || '—'}</span>
                            <div>
                              <strong>{airline.airline_name}</strong>
                              <small>{airline.airline_country || 'Unknown country'}</small>
                            </div>
                          </div>
                          <div className="airline-meta">
                            <span>{formatNumber(airline.route_count)} routes</span>
                            <span>•</span>
                            <span>{formatNumber(airline.countries_served)} countries</span>
                            <span>•</span>
                            <span>{airline.active === 'Y' ? 'Active' : 'Inactive'}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {/* <section className="network-panel route-finder">
                  <header>
                    <h3>Find a connection</h3>
                    <span className="panel-meta">Check direct and one-stop options between any two airports</span>
                  </header>

                  <form className="route-form" onSubmit={handleRouteFinderSubmit}>
                    <div className="route-input-group">
                      <label htmlFor="route-from">Origin</label>
                      <input
                        id="route-from"
                        type="text"
                        value={routeSearch.from}
                        placeholder="IATA"
                        onFocus={() => {
                          if (fromSuggestions.length > 0) setShowFromSuggestions(true);
                        }}
                        onChange={(event) => handleRouteFinderInputChange('from', event.target.value)}
                        onBlur={() => setTimeout(() => setShowFromSuggestions(false), 150)}
                      />
                      {showFromSuggestions && fromSuggestions.length > 0 && (
                        <ul className="suggestions">
                          {fromSuggestions.map((airport) => (
                            <li
                              key={`from-${airport.airport_id || airport.iata}`}
                              onMouseDown={() => handleRouteSuggestionSelect('from', airport)}
                            >
                              <span className="suggestion-code">{airport.iata || airport.icao || '—'}</span>
                              <span className="suggestion-name">{airport.name}</span>
                              <span className="suggestion-meta">{airport.city}, {airport.country}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="route-input-group">
                      <label htmlFor="route-to">Destination</label>
                      <input
                        id="route-to"
                        type="text"
                        value={routeSearch.to}
                        placeholder="IATA"
                        onFocus={() => {
                          if (toSuggestions.length > 0) setShowToSuggestions(true);
                        }}
                        onChange={(event) => handleRouteFinderInputChange('to', event.target.value)}
                        onBlur={() => setTimeout(() => setShowToSuggestions(false), 150)}
                      />
                      {showToSuggestions && toSuggestions.length > 0 && (
                        <ul className="suggestions">
                          {toSuggestions.map((airport) => (
                            <li
                              key={`to-${airport.airport_id || airport.iata}`}
                              onMouseDown={() => handleRouteSuggestionSelect('to', airport)}
                            >
                              <span className="suggestion-code">{airport.iata || airport.icao || '—'}</span>
                              <span className="suggestion-name">{airport.name}</span>
                              <span className="suggestion-meta">{airport.city}, {airport.country}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <button type="submit" className="route-submit">
                      Search routes
                    </button>
                  </form>

                  {renderRouteFinderResults()}
                </section> */}

                {queryInsights.length > 0 && (
                  <section className="network-panel insights">
                    <header>
                      <h3>MariaDB insights</h3>
                      <span className="panel-meta">Live metrics for the last queries powering this view</span>
                    </header>
                    <div className="insight-grid">
                      {queryInsights.map((insight, index) => (
                        <div key={`${insight.operation}-${index}`} className="insight-card">
                          <span className="insight-title">{insight.operation}</span>
                          <div className="insight-metrics">
                            <span>{formatNumber(insight.row_count)} rows</span>
                            <span>•</span>
                            <span>{formatMs(insight.execution_time_ms)}</span>
                          </div>
                          <span className="insight-subtitle">{insight.query_type}</span>
                          {insight.mariadb_features && insight.mariadb_features.length > 0 && (
                            <div className="insight-features">
                              {insight.mariadb_features.slice(0, 3).map((feature) => (
                                <span key={feature}>{feature}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </>
        ) : (
          <div className="network-empty">
            <span role="img" aria-label="airport">🛩️</span>
            <p>Select an airport to explore its network.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default NetworkViewer;
