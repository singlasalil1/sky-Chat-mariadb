#!/bin/bash

# SkyChat Database Setup Script
# This script automates MariaDB setup for the SkyChat project

set -e  # Exit on error

echo "🚀 SkyChat MariaDB Setup Script"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if MariaDB is installed
if ! command -v mariadb &> /dev/null; then
    echo -e "${YELLOW}MariaDB not found. Installing via Homebrew...${NC}"
    brew install mariadb
    brew services start mariadb
    echo -e "${GREEN}✅ MariaDB installed and started${NC}"
else
    echo -e "${GREEN}✅ MariaDB already installed${NC}"
fi

# Check if MariaDB service is running
if ! brew services list | grep mariadb | grep started &> /dev/null; then
    echo -e "${YELLOW}Starting MariaDB service...${NC}"
    brew services start mariadb
    sleep 3
    echo -e "${GREEN}✅ MariaDB service started${NC}"
fi

echo ""
echo "📊 Setting up database..."
echo ""

# Prompt for database password
read -sp "Enter a password for the skychat_user: " DB_PASSWORD
echo ""

# Create database and user
echo "Creating database and user..."
sudo mariadb -u root <<EOF
-- Create database
CREATE DATABASE IF NOT EXISTS skychat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER IF NOT EXISTS 'skychat_user'@'localhost' IDENTIFIED BY '$DB_PASSWORD';

-- Grant privileges
GRANT ALL PRIVILEGES ON skychat.* TO 'skychat_user'@'localhost';
FLUSH PRIVILEGES;

-- Use database
USE skychat;

-- Create airports table
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
    tz_database VARCHAR(255),
    type VARCHAR(50),
    source VARCHAR(50),
    INDEX idx_iata (iata),
    INDEX idx_country (country),
    INDEX idx_city (city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create airlines table
CREATE TABLE IF NOT EXISTS airlines (
    airline_id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    alias VARCHAR(255),
    iata VARCHAR(2),
    icao VARCHAR(3),
    callsign VARCHAR(255),
    country VARCHAR(255),
    active CHAR(1),
    INDEX idx_iata (iata),
    INDEX idx_country (country),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create routes table
CREATE TABLE IF NOT EXISTS routes (
    route_id INT AUTO_INCREMENT PRIMARY KEY,
    airline_code VARCHAR(3),
    airline_id INT,
    source_airport VARCHAR(4),
    source_airport_id INT,
    dest_airport VARCHAR(4),
    dest_airport_id INT,
    codeshare VARCHAR(1),
    stops INT,
    equipment VARCHAR(255),
    INDEX idx_source (source_airport_id),
    INDEX idx_dest (dest_airport_id),
    INDEX idx_airline (airline_id),
    INDEX idx_route (source_airport_id, dest_airport_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SELECT 'Database and tables created successfully!' as status;
EOF

echo -e "${GREEN}✅ Database and tables created${NC}"
echo ""

# Create .env file
echo "Creating .env file..."
cat > .env <<EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=skychat_user
DB_PASSWORD=$DB_PASSWORD
DB_NAME=skychat

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=$(openssl rand -hex 32)

# API Configuration
API_PORT=5000
EOF

echo -e "${GREEN}✅ .env file created${NC}"
echo ""

# Install Python dependencies
echo "Installing Python dependencies..."
pip3 install -q mariadb flask flask-cors python-dotenv
echo -e "${GREEN}✅ Python dependencies installed${NC}"
echo ""

echo "================================"
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Import data: python src/database/import_data.py"
echo "2. Start backend: python app.py"
echo "3. Start frontend: cd frontend && npm run dev"
echo ""
echo "Database credentials saved to .env file"
echo "================================"
