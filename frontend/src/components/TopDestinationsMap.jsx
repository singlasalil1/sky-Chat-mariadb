import React, { useMemo } from 'react';
import { ComposableMap, Geographies, Geography, Marker, Line } from 'react-simple-maps';

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const toNumber = (value) => {
  const parsed = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(parsed) ? parsed : null;
};

const TopDestinationsMap = ({ origin, destinations }) => {
  const originPoint = useMemo(() => {
    if (!origin) return null;
    const lat = toNumber(origin.latitude);
    const lon = toNumber(origin.longitude);
    if (lat === null || lon === null) return null;
    return { lat, lon, code: origin.iata || origin.icao || '—' };
  }, [origin]);

  const points = useMemo(() => {
    if (!destinations || destinations.length === 0) return [];
    return destinations
      .map((dest) => ({
        ...dest,
        lat: toNumber(dest.latitude),
        lon: toNumber(dest.longitude)
      }))
      .filter((dest) => dest.lat !== null && dest.lon !== null);
  }, [destinations]);

  if (!originPoint || points.length === 0) {
    return (
      <div className="top-destinations-map empty">
        <p>Map will appear when coordinates are available for this airport.</p>
      </div>
    );
  }

  return (
    <div className="top-destinations-map">
      <ComposableMap projectionConfig={{ scale: 150 }} style={{ width: '100%', height: '100%' }}>
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography key={geo.rsmKey} geography={geo} fill="#e2e8f0" stroke="#cbd5f5" strokeWidth={0.5} />
            ))
          }
        </Geographies>
        {points.map((dest, index) => (
          <Line
            key={`line-${dest.code}-${index}`}
            from={[originPoint.lon, originPoint.lat]}
            to={[dest.lon, dest.lat]}
            stroke="#2563eb"
            strokeWidth={1.1}
            strokeLinecap="round"
            strokeOpacity={0.4 + Math.min(dest.airlineCount || 0, 5) * 0.1}
          />
        ))}
        <Marker coordinates={[originPoint.lon, originPoint.lat]}>
          <circle r={4} fill="#1d4ed8" stroke="#ffffff" strokeWidth={1.2} />
          <text textAnchor="middle" y={-10} className="map-label">
            {originPoint.code}
          </text>
        </Marker>
        {points.map((dest, index) => (
          <Marker key={`marker-${dest.code}-${index}`} coordinates={[dest.lon, dest.lat]}>
            <circle r={3.2} fill="#38bdf8" stroke="#ffffff" strokeWidth={1} />
            <text textAnchor="middle" y={-8} className="map-label">
              {dest.code}
            </text>
          </Marker>
        ))}
      </ComposableMap>
    </div>
  );
};

export default TopDestinationsMap;
