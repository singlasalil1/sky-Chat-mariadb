import axios from 'axios';

const API_BASE_URL = 'http://localhost:5002/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Chat API
export const sendChatMessage = async (query, sessionId = 'default') => {
  const response = await api.post('/chat', { query, sessionId });
  return response.data;
};

// Airport APIs
export const searchAirports = async (query) => {
  const response = await api.get(`/airports/search?q=${query}`);
  return response.data;
};

export const getAirportByIATA = async (iata) => {
  const response = await api.get(`/airports/iata/${iata}`);
  return response.data;
};

export const getNearbyAirports = async (lat, lon, radius = 100) => {
  const response = await api.get(`/airports/nearby?lat=${lat}&lon=${lon}&radius=${radius}`);
  return response.data;
};

export const getHubAirports = async (minRoutes = 50) => {
  const response = await api.get(`/airports/hubs?min_routes=${minRoutes}`);
  return response.data;
};

// Airline APIs
export const searchAirlines = async (query) => {
  const response = await api.get(`/airlines/search?q=${query}`);
  return response.data;
};

export const getAirlineByIATA = async (iata) => {
  const response = await api.get(`/airlines/iata/${iata}`);
  return response.data;
};

export const getActiveAirlines = async () => {
  const response = await api.get('/airlines/active');
  return response.data;
};

// Route APIs
export const findDirectRoutes = async (from, to) => {
  const response = await api.get(`/routes/direct?from=${from}&to=${to}`);
  return response.data;
};

export const findRoutesWithStop = async (from, to) => {
  const response = await api.get(`/routes/with-stop?from=${from}&to=${to}`);
  return response.data;
};

export const getBusiestRoutes = async (limit = 10) => {
  const response = await api.get(`/routes/busiest?limit=${limit}`);
  return response.data;
};

export const getLongestRoutes = async (limit = 10) => {
  const response = await api.get(`/routes/longest?limit=${limit}`);
  return response.data;
};

export const getRoutesFromAirport = async (iata, airlineFilter = null) => {
  const url = airlineFilter
    ? `/routes/from/${iata}?airline=${airlineFilter}`
    : `/routes/from/${iata}`;
  const response = await api.get(url);
  return response.data;
};

export const getAirlinesFromAirport = async (iata) => {
  const response = await api.get(`/routes/airlines-from/${iata}`);
  return response.data;
};

export const findShortestPath = async (from, to) => {
  const response = await api.get(`/routes/shortest-path?from=${from}&to=${to}`);
  return response.data;
};

export default api;
