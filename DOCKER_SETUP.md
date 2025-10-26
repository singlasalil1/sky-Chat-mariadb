# SkyChat Docker Setup Guide

Complete Docker-based deployment for SkyChat with RAG capabilities. This setup runs on any laptop with minimal manual configuration.

## 🚀 Quick Start (One Command)

```bash
./setup-docker.sh
```

That's it! The script will:
- ✅ Check if Docker is installed
- ✅ Install Docker if needed (with your permission)
- ✅ Build all containers
- ✅ Download and configure Ollama LLM
- ✅ Initialize MariaDB database
- ✅ Build RAG knowledge base
- ✅ Start all services

## 📋 Prerequisites

### Minimum Requirements
- **OS**: macOS, Linux (Ubuntu, Debian, Fedora, CentOS, RHEL)
- **RAM**: 8GB minimum (16GB recommended for RAG)
- **Disk Space**: 10GB free
- **CPU**: 4 cores recommended

### Software (Auto-installed by script if needed)
- Docker 20.10+
- Docker Compose 2.0+

## 🛠️ Manual Setup (Alternative)

If you prefer manual control:

### 1. Install Docker

**macOS:**
```bash
brew install --cask docker
```

**Ubuntu/Debian:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

**Fedora/RHEL/CentOS:**
```bash
sudo dnf install docker docker-compose-plugin
sudo systemctl start docker
sudo systemctl enable docker
```

### 2. Start Services

```bash
# Build images
docker compose build

# Start core services
docker compose up -d mariadb ollama

# Wait for MariaDB (check logs)
docker compose logs -f mariadb

# Download Ollama model
docker compose up ollama-setup

# Start application
docker compose up -d backend frontend

# Initialize RAG knowledge base
docker compose up rag-setup
```

### 3. Access Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5002
- Health Check: http://localhost:5002/health

## 📦 What's Included

### Services

1. **MariaDB 11.2**
   - Pre-configured with SkyChat schema
   - Persistent volume for data
   - Port: 3307 (to avoid conflicts)

2. **Ollama (Local LLM)**
   - Llama 3.2 1B model
   - GPU support (if available)
   - Port: 11434

3. **Backend (Flask + RAG)**
   - Flask application server
   - RAG services integrated
   - Sentence Transformers embeddings
   - Port: 5002

4. **Frontend (React + Nginx)**
   - Production React build
   - Nginx reverse proxy
   - API proxy to backend
   - Port: 3000

5. **RAG Setup (One-time)**
   - Builds knowledge base from flight data
   - Generates embeddings
   - ~100 airports, 50 airlines, 200 routes

## 🔧 Configuration

### Environment Variables

Edit `.env` file before running:

```env
# Database
DB_NAME=skychat
DB_USER=skychat_user
DB_PASSWORD=skychat123

# RAG Settings
RAG_ENABLED=true
RAG_DEFAULT_MODE=hybrid
EMBEDDING_PROVIDER=sentence-transformers
LLM_PROVIDER=ollama
LLM_MODEL=llama3.2:1b

# Performance
RAG_TOP_K=5
RAG_MIN_SIMILARITY=0.3
RAG_TEMPERATURE=0.7
```

### GPU Support (Optional)

To enable GPU acceleration for Ollama:

1. Install NVIDIA Container Toolkit:
```bash
# Ubuntu/Debian
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list

sudo apt-get update && sudo apt-get install -y nvidia-container-toolkit
sudo systemctl restart docker
```

2. GPU section is already included in docker-compose.yml

If you don't have GPU, the deploy section will be ignored and Ollama runs on CPU.

## 📊 Service Management

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f ollama
```

### Check Status
```bash
docker compose ps
```

### Restart Services
```bash
# All services
docker compose restart

# Specific service
docker compose restart backend
```

### Stop Everything
```bash
docker compose down
```

### Stop and Remove Data
```bash
docker compose down -v
```

## 🐛 Troubleshooting

### Port Already in Use

If ports are in use, edit `docker-compose.yml`:

```yaml
# Change port mappings
ports:
  - "3001:80"  # Frontend (was 3000)
  - "5003:5002"  # Backend (was 5002)
  - "3308:3306"  # MariaDB (was 3307)
```

### Ollama Model Download Fails

```bash
# Download model manually
docker compose exec ollama ollama pull llama3.2:1b

# Or use a smaller model
docker compose exec ollama ollama pull llama3.2:latest
```

### RAG Setup Fails

```bash
# Run setup manually
docker compose run --rm rag-setup python3 setup_rag.py --airport-limit 50

# Check logs
docker compose logs rag-setup
```

### Backend Won't Start

```bash
# Check database connection
docker compose exec backend python3 -c "from src.database.connection import DatabaseConnection; DatabaseConnection.get_connection()"

# Check logs
docker compose logs backend
```

### Out of Memory

Reduce RAG data size in `docker-compose.yml`:

```yaml
command: >
  sh -c "
    python3 setup_rag.py --airport-limit 50 --airline-limit 20 --route-limit 100
  "
```

## 🔄 Updates & Maintenance

### Update Application Code

```bash
git pull
docker compose build
docker compose up -d
```

### Update Ollama Model

```bash
docker compose exec ollama ollama pull llama3.2:1b
docker compose restart backend
```

### Rebuild RAG Knowledge Base

```bash
docker compose up rag-setup
```

### Clean Up Old Images

```bash
docker system prune -a
```

## 📈 Performance Tuning

### Increase Ollama Memory

Edit `docker-compose.yml`:

```yaml
ollama:
  environment:
    - OLLAMA_NUM_GPU=1
    - OLLAMA_MAX_LOADED_MODELS=2
```

### Adjust RAG Parameters

Edit `.env`:

```env
RAG_TOP_K=10           # More context documents
RAG_MIN_SIMILARITY=0.2  # Lower threshold
RAG_TEMPERATURE=0.5     # More focused responses
```

## 🔒 Security Considerations

### Production Deployment

1. **Change Default Passwords**
```env
DB_PASSWORD=your-strong-password-here
```

2. **Use Environment-Specific Configs**
```bash
cp .env .env.production
# Edit .env.production with production values
docker compose --env-file .env.production up -d
```

3. **Enable HTTPS**
- Use a reverse proxy (Nginx, Traefik, Caddy)
- Obtain SSL certificates (Let's Encrypt)

4. **Restrict Ports**
- Only expose frontend port (3000)
- Keep backend, database, ollama internal

## 📝 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Docker Network                       │
│                                                           │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐            │
│  │ Frontend │   │ Backend  │   │ MariaDB  │            │
│  │  React   │◄──┤  Flask   │◄──┤  11.2    │            │
│  │  Nginx   │   │  +RAG    │   └──────────┘            │
│  └──────────┘   └──────────┘                            │
│       │              │                                    │
│       │              │         ┌──────────┐             │
│       │              └────────►│  Ollama  │             │
│       │                        │  LLM     │             │
│       │                        └──────────┘             │
│       │                                                  │
└───────┼──────────────────────────────────────────────────┘
        │
        ▼
   localhost:3000
```

## 🆘 Support

### Check Service Health

```bash
# Backend health
curl http://localhost:5002/health

# Ollama health
curl http://localhost:11434/api/tags

# RAG status
curl http://localhost:5002/api/rag/status
```

### Common Issues

1. **Services Won't Start**
   - Check Docker daemon: `docker info`
   - Check disk space: `df -h`
   - Check logs: `docker compose logs`

2. **Slow Performance**
   - Enable GPU if available
   - Reduce RAG knowledge base size
   - Increase Docker memory limits

3. **Database Errors**
   - Reset database: `docker compose down -v && docker compose up -d`
   - Check schema: `docker compose exec mariadb mariadb -u root -p skychat`

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Ollama Documentation](https://github.com/ollama/ollama)
- [MariaDB Documentation](https://mariadb.com/kb/en/documentation/)

---

**Questions?** Open an issue on GitHub or check the main README.md
