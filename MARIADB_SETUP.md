# MariaDB Setup Guide for SkyChat Adventures

## Prerequisites
- macOS (you're on Darwin)
- Homebrew installed
- Python 3.11+

## Step 1: Install MariaDB

```bash
# Install MariaDB via Homebrew
brew install mariadb

# Start MariaDB service
brew services start mariadb

# Secure your installation (set root password)
sudo mariadb-secure-installation
```

During `mariadb-secure-installation`:
- Set root password: Choose a strong password
- Remove anonymous users: Y
- Disallow root login remotely: Y
- Remove test database: Y
- Reload privilege tables: Y

## Step 2: Connect to MariaDB

```bash
# Connect as root
sudo mariadb -u root -p
# Enter the password you set above
```

## Step 3: Create Database and User

```sql
-- Create database
CREATE DATABASE skychat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER 'skychat_user'@'localhost' IDENTIFIED BY 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON skychat.* TO 'skychat_user'@'localhost';
FLUSH PRIVILEGES;

-- Verify
SHOW DATABASES;
USE skychat;
```

## Step 4: Create Tables

```sql
-- Create airports table
CREATE TABLE airports (
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
    tz_timezone VARCHAR(255),
    type VARCHAR(50),
    source VARCHAR(50),
    INDEX idx_iata (iata),
    INDEX idx_country (country),
    INDEX idx_city (city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create airlines table
CREATE TABLE airlines (
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
CREATE TABLE routes (
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
    INDEX idx_route (source_airport_id, dest_airport_id),
    FOREIGN KEY (source_airport_id) REFERENCES airports(airport_id) ON DELETE CASCADE,
    FOREIGN KEY (dest_airport_id) REFERENCES airports(airport_id) ON DELETE CASCADE,
    FOREIGN KEY (airline_id) REFERENCES airlines(airline_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## Step 5: Load Data

Use the Python import script:

```bash
cd /Users/salilsingla/Desktop/personal/sky-Chat-mariadb
python src/database/import_data.py
```

## Step 6: Update .env File

Create `.env` file in project root:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=skychat_user
DB_PASSWORD=your_secure_password
DB_NAME=skychat

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your-secret-key-here

# API Configuration
API_PORT=5000
```

## Step 7: Install Python Dependencies

```bash
# Install MariaDB Python connector
pip install mariadb

# Install all requirements
pip install -r requirements.txt
```

## Step 8: Verify Installation

```sql
-- Check data counts
USE skychat;
SELECT COUNT(*) as airport_count FROM airports;
SELECT COUNT(*) as airline_count FROM airlines;
SELECT COUNT(*) as route_count FROM routes;

-- Test a query
SELECT
    a1.name as source,
    a2.name as dest,
    al.name as airline
FROM routes r
JOIN airports a1 ON r.source_airport_id = a1.airport_id
JOIN airports a2 ON r.dest_airport_id = a2.airport_id
LEFT JOIN airlines al ON r.airline_id = al.airline_id
LIMIT 5;
```

## Expected Results
- Airports: ~7,698
- Airlines: ~6,162
- Routes: ~67,663

## Troubleshooting

### Can't connect to MariaDB
```bash
# Check if service is running
brew services list

# Restart service
brew services restart mariadb
```

### Permission denied
```bash
# Check user privileges
sudo mariadb -u root -p
SHOW GRANTS FOR 'skychat_user'@'localhost';
```

### Import errors
- Check file paths in import script
- Ensure .dat files are in `/data` directory
- Verify database connection in .env

## Next Steps
After setup is complete:
1. Run the import script
2. Test the Flask backend: `python app.py`
3. Verify API endpoints work
4. Start implementing Vector Search features

## MariaDB Vector Search (Future Enhancement)
For Phase 2, we'll add:
```sql
-- Vector embeddings table
CREATE TABLE airport_embeddings (
    airport_id INT PRIMARY KEY,
    embedding VECTOR(384),
    FOREIGN KEY (airport_id) REFERENCES airports(airport_id)
) ENGINE=InnoDB;
```

This will enable semantic search capabilities!
