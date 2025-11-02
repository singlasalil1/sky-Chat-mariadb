# SkyChat - MariaDB Hackathon Project

A Python Flask application using MariaDB and the OpenFlights dataset to provide intelligent flight route queries through a conversational chat interface powered by local AI.

## ⚡ Quick Start (One Command Setup!)

Perfect for setting up on a new laptop! Just need Docker installed.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- 4GB+ free disk space
- 8GB+ RAM recommended

### Setup in 3 Steps

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd sky-Chat-mariadb

# 2. Start everything with ONE command
docker-compose up -d

# 3. Wait 2-3 minutes for initial setup, then access:
# Frontend: http://localhost:3000
# Backend API: http://localhost:5002/api
```

That's it! 🎉

### What Happens During First Setup?

The setup process automatically:
1. ✅ Starts MariaDB database (10-15 seconds)
2. ✅ Downloads Ollama LLM model (~1GB, 60-90 seconds)
3. ✅ Creates database schema (5 seconds)
4. ✅ Imports 70,000+ flight routes from OpenFlights (30-45 seconds)
5. ✅ Builds RAG knowledge base for intelligent chat (60 seconds)
6. ✅ Starts backend and frontend services

**First-time setup**: ~3-4 minutes
**Subsequent startups**: ~15-20 seconds

### Checking Setup Progress

```bash
# View all container logs
docker-compose logs -f

# Check specific service
docker-compose logs -f backend

# Verify all services are running
docker-compose ps
```

All services should show "healthy" or "completed successfully" status.

---

## Features

### Core Functionality
- **Flight Route Search**: Find direct and connecting flights between airports
- **Airport Intelligence**: Search airports by name, city, country, or IATA code
- **Airline Information**: Browse airlines and their route coverage
- **Analytics**: View busiest routes, longest flights, and hub airports
- **Chat Interface**: Natural language query processing with local AI

### Technical Stack
- **Backend**: Python 3.11, Flask
- **Database**: MariaDB 11.2
- **AI/LLM**: Ollama (local, no API keys needed!)
- **Embeddings**: Sentence Transformers (local)
- **Data Source**: OpenFlights dataset
- **Frontend**: React 18 + Vite
- **Deployment**: Docker & Docker Compose

## Project Structure

```
sky-Chat-mariadb/
├── app.py                      # Main Flask application
├── config.py                   # Configuration management
├── requirements.txt            # Python dependencies
├── Dockerfile.backend          # Backend Docker image
├── docker-compose.yml          # Multi-container orchestration
├── .env                        # Environment variables (auto-created)
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
├── frontend/
│   ├── src/                    # React source code
│   ├── Dockerfile              # Frontend Docker image
│   └── package.json            # Frontend dependencies
└── data/                       # OpenFlights data (auto-downloaded)
```

## 🐳 Docker Architecture

The application uses 8 Docker services:

| Service | Purpose | Status |
|---------|---------|--------|
| **mariadb** | Database (port 3307) | Always running |
| **ollama** | Local LLM server | Always running |
| **ollama-setup** | Downloads AI model (1x) | Runs once, then exits |
| **db-setup** | Creates database schema (1x) | Runs once, then exits |
| **data-import** | Imports OpenFlights data (1x) | Runs once, then exits |
| **rag-setup** | Builds knowledge base (1x) | Runs once, then exits |
| **backend** | Flask API (port 5002) | Always running |
| **frontend** | React UI (port 3000) | Always running |

## 🛠️ Management Commands

### Starting and Stopping

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove all data (complete reset)
docker-compose down -v

# Restart a specific service
docker-compose restart backend

# Rebuild after code changes
docker-compose up -d --build
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mariadb

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Database Access

```bash
# Connect to MariaDB shell
docker exec -it skychat-mariadb mariadb -u skychat_user -ptest skychat

# Run SQL queries
docker exec -it skychat-mariadb mariadb -u skychat_user -ptest skychat -e "SELECT COUNT(*) FROM airports;"

# Backup database
docker exec skychat-mariadb mariadb-dump -u skychat_user -ptest skychat > backup.sql

# Restore database
docker exec -i skychat-mariadb mariadb -u skychat_user -ptest skychat < backup.sql
```

### Debugging

```bash
# Check service health
docker-compose ps

# Access backend shell
docker exec -it skychat-backend /bin/bash

# Access frontend shell
docker exec -it skychat-frontend /bin/sh

# View resource usage
docker stats

# Re-run setup scripts manually
docker-compose run --rm db-setup
docker-compose run --rm data-import
docker-compose run --rm rag-setup
```

## 💻 Local Development (Without Docker)

If you prefer to run without Docker:

1. **Install system dependencies**:
   ```bash
   # macOS
   brew install mariadb

   # Ubuntu/Debian
   sudo apt-get install mariadb-server libmariadb-dev
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Setup MariaDB**:
   ```bash
   # Start MariaDB
   brew services start mariadb  # macOS
   sudo systemctl start mariadb  # Linux

   # Create database and user
   sudo mariadb -u root
   CREATE DATABASE skychat;
   CREATE USER 'skychat_user'@'localhost' IDENTIFIED BY 'test';
   GRANT ALL PRIVILEGES ON skychat.* TO 'skychat_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

4. **Setup database and import data**:
   ```bash
   python src/database/setup.py
   python src/database/import_data.py
   ```

5. **Install and setup Ollama** (for AI features):
   ```bash
   # Install from https://ollama.ai
   ollama pull llama3.2:1b
   ollama serve  # Run in separate terminal
   ```

6. **Run the backend**:
   ```bash
   python app.py
   ```

7. **Run the frontend** (in separate terminal):
   ```bash
   cd frontend
   npm install
   npm run dev
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

## 🔧 Troubleshooting

### Common Issues

**Port already in use**
```bash
# Check what's using the port
lsof -i :3000  # Frontend
lsof -i :5002  # Backend
lsof -i :3307  # MariaDB

# Change ports in docker-compose.yml if needed
# Example: "8080:80" instead of "3000:80"
```

**Services not starting**
```bash
# Check logs for errors
docker-compose logs backend
docker-compose logs mariadb

# Rebuild containers
docker-compose down
docker-compose up -d --build
```

**Database connection errors**
```bash
# Ensure MariaDB is healthy
docker-compose ps mariadb

# Wait for health check to pass
docker-compose logs mariadb | grep -i "ready"

# Restart database setup
docker-compose run --rm db-setup
```

**Out of memory errors**
```bash
# Increase Docker memory allocation in Docker Desktop settings
# Recommended: 4GB minimum, 8GB ideal

# Or reduce Ollama model size in docker-compose.yml
# Change llama3.2:1b to a smaller model like llama3.2:0.5b
```

**RAG/AI not working**
```bash
# Check Ollama is running
docker-compose logs ollama

# Verify model downloaded
docker exec skychat-ollama ollama list

# Re-run RAG setup
docker-compose run --rm rag-setup
```

**Frontend shows "Cannot connect to backend"**
```bash
# Check backend is running
curl http://localhost:5002/health

# Check CORS settings in app.py
# Ensure frontend can reach backend network
```

### Clean Slate Reset

If things get messy, start fresh:

```bash
# Stop and remove everything
docker-compose down -v

# Remove Docker images (optional)
docker-compose down --rmi all

# Start fresh
docker-compose up -d
```

## 🧪 Development

### Adding New Features
1. Create service methods in `src/services/`
2. Add API endpoints in `app.py`
3. Update chat processing in `chat_service.py`
4. Rebuild: `docker-compose up -d --build backend`

### Testing Queries
```bash
# Test direct API
curl "http://localhost:5002/api/airports/search?q=JFK"

# Test chat interface
curl -X POST http://localhost:5002/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "Find flights from JFK to LAX"}'

# Test with jq for pretty output
curl "http://localhost:5002/api/airports/search?q=JFK" | jq
```

### Hot Reload Development

For backend development with hot reload:

```bash
# Modify docker-compose.yml backend service to mount code
# Add under volumes:
#   - ./app.py:/app/app.py
#   - ./src:/app/src

# Enable Flask debug mode
# Set FLASK_ENV=development in docker-compose.yml

# Restart backend
docker-compose restart backend
```

For frontend development:

```bash
# Run frontend locally (faster than Docker for dev)
cd frontend
npm run dev
# Access at http://localhost:5173 with hot reload
```

## ⚙️ Configuration

### Environment Variables

The `.env` file is automatically created with sensible defaults. You can customize:

```bash
# Database Configuration
DB_HOST=localhost          # Use 'mariadb' in Docker
DB_PORT=3306              # Internal port (3307 external)
DB_USER=skychat_user
DB_PASSWORD=test          # Change in production!
DB_NAME=skychat

# Server Configuration
PORT=5002
FLASK_ENV=development     # Set to 'production' for deployment

# RAG/AI Configuration
RAG_ENABLED=true          # Enable AI chat features
RAG_DEFAULT_MODE=hybrid   # Options: hybrid, vector, keyword
EMBEDDING_PROVIDER=sentence-transformers  # Local embeddings
LLM_PROVIDER=ollama       # Local LLM
LLM_MODEL=llama3.2:1b     # Model name
OLLAMA_BASE_URL=http://ollama:11434  # Ollama service URL

# Advanced RAG Settings
RAG_TOP_K=5               # Number of results to retrieve
RAG_MIN_SIMILARITY=0.3    # Minimum similarity threshold
RAG_TEMPERATURE=0.7       # LLM creativity (0.0-1.0)
```

### Using Different LLM Models

Want a different model? Edit `docker-compose.yml`:

```yaml
# In ollama-setup service, change the model:
command:
  - |
    ollama pull llama3.2:3b  # Larger model (better quality, slower)
    # or
    ollama pull llama3.2:0.5b  # Smaller model (faster, less memory)

# Update backend and rag-setup services:
environment:
  - LLM_MODEL=llama3.2:3b  # Match the model name
```

Available models: [Ollama Library](https://ollama.ai/library)

### Production Deployment

For production use:

1. **Change passwords** in `.env` or `docker-compose.yml`
2. **Use external volumes** for data persistence
3. **Add HTTPS** via reverse proxy (nginx, Traefik, Caddy)
4. **Enable monitoring** (Prometheus, Grafana)
5. **Set resource limits** in docker-compose.yml:

```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2G
```

## 📊 Data Source

OpenFlights dataset includes:
- **7,000+ airports** worldwide with coordinates
- **5,000+ airlines** (active and inactive)
- **67,000+ routes** connecting global destinations

Data is automatically downloaded during first setup.

Source: [OpenFlights.org](https://openflights.org/)

## 🚀 Performance Tips

- **First query slower**: LLM initialization takes ~5 seconds
- **Subsequent queries**: 1-2 seconds response time
- **Database queries**: <100ms (indexed lookups)
- **Caching**: Embedding cache reduces repeated query time

## 📝 License

MIT License - Built for MariaDB Hackathon

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test with Docker: `docker-compose up -d --build`
5. Commit changes (`git commit -m 'Add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 👥 Contributors

Built with ❤️ for the MariaDB Hackathon

---

## 📚 Additional Resources

- [MariaDB Documentation](https://mariadb.com/kb/en/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Ollama Documentation](https://github.com/ollama/ollama)
- [React Documentation](https://react.dev/)

---

**Questions or Issues?** Open an issue on GitHub or check the troubleshooting section above.
