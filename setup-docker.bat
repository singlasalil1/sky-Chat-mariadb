@echo off
REM SkyChat Docker Setup Script for Windows

echo ================================================
echo   SkyChat - Docker Setup Script (Windows)
echo ================================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed!
    echo.
    echo Please install Docker Desktop from:
    echo https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)

echo [OK] Docker is installed

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running!
    echo.
    echo Please start Docker Desktop and run this script again.
    echo.
    pause
    exit /b 1
)

echo [OK] Docker is running

REM Check if .env file exists
if not exist .env (
    echo [WARNING] .env file not found
    if exist .env.example (
        echo [INFO] Creating .env from .env.example...
        copy .env.example .env >nul
        echo [OK] .env file created
    ) else (
        echo [ERROR] .env.example not found!
        pause
        exit /b 1
    )
)

echo.
echo ================================================
echo   Starting SkyChat Setup
echo ================================================
echo.

REM Stop any existing containers
echo [INFO] Stopping any existing containers...
docker compose down 2>nul

REM Build images
echo.
echo [INFO] Building Docker images...
docker compose build

REM Start services
echo.
echo [INFO] Starting services...
echo [WARNING] First run will take several minutes:
echo   - MariaDB initialization (~30 seconds)
echo   - Ollama model download (~1-2 minutes)
echo   - RAG knowledge base generation (~2-3 minutes)
echo.

docker compose up -d mariadb ollama

REM Wait for MariaDB
echo [INFO] Waiting for MariaDB to be ready...
:wait_mariadb
timeout /t 5 /nobreak >nul
docker compose exec -T mariadb healthcheck.sh --connect --innodb_initialized 2>nul
if errorlevel 1 goto wait_mariadb

echo [OK] MariaDB is ready

REM Download Ollama model
echo.
echo [INFO] Downloading Ollama model...
docker compose up ollama-setup

REM Start backend and frontend
echo.
echo [INFO] Starting backend and frontend...
docker compose up -d backend frontend

REM Setup RAG
echo.
echo [INFO] Setting up RAG knowledge base...
echo [WARNING] This will take 2-3 minutes...
docker compose up rag-setup

echo.
echo ================================================
echo   Setup Complete!
echo ================================================
echo.
echo [OK] SkyChat is now running!
echo.
echo Access the application:
echo   - Frontend:  http://localhost:3000
echo   - Backend:   http://localhost:5002
echo   - Health:    http://localhost:5002/health
echo.
echo Useful commands:
echo   - View logs:        docker compose logs -f
echo   - Stop services:    docker compose down
echo   - Restart services: docker compose restart
echo.
pause
