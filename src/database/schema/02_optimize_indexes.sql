-- Optimization indexes for shortest path queries
-- These indexes dramatically improve graph traversal performance

-- Composite index for route traversal (source -> dest lookup)
-- This is critical for the recursive CTE performance
CREATE INDEX IF NOT EXISTS idx_route_traversal ON routes(source_airport_id, dest_airport_id, airline_id);

-- Covering index for reverse route lookup
CREATE INDEX IF NOT EXISTS idx_route_reverse ON routes(dest_airport_id, source_airport_id);

-- Index for airport spatial queries (used in distance calculations)
CREATE INDEX IF NOT EXISTS idx_airport_coords ON airports(latitude, longitude);

-- Composite index for airport lookups with IATA
CREATE INDEX IF NOT EXISTS idx_airport_iata_id ON airports(iata, airport_id);
