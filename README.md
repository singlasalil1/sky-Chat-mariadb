# SkyChat - MariaDB Hackathon Project

A Python Flask application using MariaDB and the OpenFlights dataset to provide intelligent flight route queries through a conversational chat interface.

## Features

### Core Functionality
- **Flight Route Search**: Find direct and connecting flights between airports
- **Airport Intelligence**: Search airports by name, city, country, or IATA code
- **Airline Information**: Browse airlines and their route coverage
- **Analytics**: View busiest routes, longest flights, and hub airports
- **Chat Interface**: Natural language query processing

### Technical Stack
- **Backend**: Python 3.11, Flask
- **Database**: MariaDB
- **Data Source**: OpenFlights dataset
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Deployment**: Docker & Docker Compose

## Project Structure

```
sky-Chat-mariadb/
├── app.py                      # Main Flask application
├── config.py                   # Configuration management
├── requirements.txt            # Python dependencies
├── Dockerfile                  # Docker image definition
├── docker-compose.yml          # Multi-container orchestration
├── .env.example                # Environment variables template
├── src/
│   ├── database/
│   │   ├── connection.py       # Database connection pool
│   │   ├── setup.py            # Database schema setup
│   │   ├── import_data.py      # OpenFlights data importer
│   │   └── schema/
│   │       └── 01_create_tables.sql  # Database schema
│   └── services/
│       ├── airport_service.py   # Airport queries
│       ├── airline_service.py   # Airline queries
│       ├── route_service.py     # Route finding algorithms
│       └── chat_service.py      # Natural language processing
├── public/
│   └── index.html              # Frontend chat interface
└── data/                       # OpenFlights data files (auto-downloaded)
```

## Quick Start

### Option 1: Using Docker (Recommended)

1. **Clone and setup**:
   ```bash
   cp .env.example .env
   # Edit .env if needed
   ```

2. **Start services**:
   ```bash
   docker-compose up -d
   ```

3. **Setup database and import data**:
   ```bash
   docker exec -it skychat-app python src/database/setup.py
   docker exec -it skychat-app python src/database/import_data.py
   ```

4. **Access the application**:
   - Frontend: http://localhost:5000
   - API: http://localhost:5000/api

### Option 2: Local Development

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Setup MariaDB**:
   - Install MariaDB locally
   - Create database: `CREATE DATABASE skychat;`
   - Update `.env` with your credentials

3. **Setup database and import data**:
   ```bash
   python src/database/setup.py
   python src/database/import_data.py
   ```

4. **Run the application**:
   ```bash
   python app.py
   ```

## API Endpoints

### Chat
- `POST /api/chat` - Process natural language queries

### Airports
- `GET /api/airports/search?q=<query>` - Search airports
- `GET /api/airports/<id>` - Get airport by ID
- `GET /api/airports/iata/<code>` - Get airport by IATA code
- `GET /api/airports/nearby?lat=<lat>&lon=<lon>&radius=<km>` - Find nearby airports
- `GET /api/airports/hubs` - Get major hub airports

### Airlines
- `GET /api/airlines/search?q=<query>` - Search airlines
- `GET /api/airlines/<id>` - Get airline by ID
- `GET /api/airlines/iata/<code>` - Get airline by IATA code
- `GET /api/airlines/country/<country>` - Get airlines by country
- `GET /api/airlines/<id>/stats` - Get airline statistics

### Routes
- `GET /api/routes/direct?from=<iata>&to=<iata>` - Find direct routes
- `GET /api/routes/with-stop?from=<iata>&to=<iata>` - Find routes with one connection
- `GET /api/routes/busiest?limit=<n>` - Get busiest routes
- `GET /api/routes/longest?limit=<n>` - Get longest routes
- `GET /api/routes/airline/<iata>` - Get routes by airline
- `GET /api/routes/from/<iata>` - Get all routes from airport

## Example Queries

Try these in the chat interface:
- "Find flights from JFK to LAX"
- "Search airport London"
- "Show busiest routes"
- "Airline Emirates"
- "Routes from SFO"
- "Show longest flights"

## Database Schema

### Tables
- **airports**: Airport information (name, location, codes)
- **airlines**: Airline details (name, country, status)
- **routes**: Flight routes (source, destination, airline)
- **user_queries**: Chat history and analytics

### Indexes
Optimized indexes for:
- IATA/ICAO code lookups
- Geographic searches
- Route queries
- Airline filtering

## Development

### Adding New Features
1. Create service methods in `src/services/`
2. Add API endpoints in `app.py`
3. Update chat processing in `chat_service.py`

### Testing Queries
```bash
# Test direct API
curl "http://localhost:5000/api/airports/search?q=JFK"

# Test chat interface
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "Find flights from JFK to LAX"}'
```

## Data Source

OpenFlights dataset includes:
- 7,000+ airports worldwide
- 5,000+ airlines
- 67,000+ routes

Data is automatically downloaded during import.

## License

MIT License - Built for MariaDB Hackathon

## Contributors

Add your team members here!
