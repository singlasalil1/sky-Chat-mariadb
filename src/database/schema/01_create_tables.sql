-- SkyChat Database Schema for OpenFlights Dataset

-- Airports Table
CREATE TABLE IF NOT EXISTS airports (
    airport_id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(255),
    country VARCHAR(255),
    iata VARCHAR(3),
    icao VARCHAR(4),
    latitude DECIMAL(10, 6),
    longitude DECIMAL(10, 6),
    altitude INT,
    timezone_offset DECIMAL(4, 2),
    dst CHAR(1),
    tz_database VARCHAR(50),
    type VARCHAR(50),
    source VARCHAR(50),
    INDEX idx_iata (iata),
    INDEX idx_icao (icao),
    INDEX idx_country (country),
    INDEX idx_city (city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Airlines Table
CREATE TABLE IF NOT EXISTS airlines (
    airline_id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    alias VARCHAR(255),
    iata VARCHAR(2),
    icao VARCHAR(3),
    callsign VARCHAR(255),
    country VARCHAR(255),
    active CHAR(1) DEFAULT 'Y',
    INDEX idx_iata (iata),
    INDEX idx_icao (icao),
    INDEX idx_country (country),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Routes Table
CREATE TABLE IF NOT EXISTS routes (
    route_id INT AUTO_INCREMENT PRIMARY KEY,
    airline_code VARCHAR(3),
    airline_id INT,
    source_airport VARCHAR(4),
    source_airport_id INT,
    dest_airport VARCHAR(4),
    dest_airport_id INT,
    codeshare CHAR(1),
    stops INT DEFAULT 0,
    equipment VARCHAR(255),
    INDEX idx_source (source_airport_id),
    INDEX idx_dest (dest_airport_id),
    INDEX idx_airline (airline_id),
    INDEX idx_route (source_airport_id, dest_airport_id),
    FOREIGN KEY (source_airport_id) REFERENCES airports(airport_id) ON DELETE CASCADE,
    FOREIGN KEY (dest_airport_id) REFERENCES airports(airport_id) ON DELETE CASCADE,
    FOREIGN KEY (airline_id) REFERENCES airlines(airline_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User Queries Table (for chat history and analytics)
CREATE TABLE IF NOT EXISTS user_queries (
    query_id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255),
    query_text TEXT NOT NULL,
    query_type VARCHAR(50),
    response_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session (session_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
