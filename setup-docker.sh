#!/bin/bash

# SkyChat Docker Setup Script
# This script checks for dependencies and sets up the entire application

set -e

echo "================================================"
echo "  SkyChat - Docker Setup Script"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | tr -d ',')
        print_success "Docker is installed (version $DOCKER_VERSION)"
        return 0
    else
        print_error "Docker is not installed"
        return 1
    fi
}

# Check if Docker Compose is installed
check_docker_compose() {
    if docker compose version &> /dev/null; then
        COMPOSE_VERSION=$(docker compose version --short)
        print_success "Docker Compose is installed (version $COMPOSE_VERSION)"
        return 0
    elif command -v docker-compose &> /dev/null; then
        COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f3 | tr -d ',')
        print_success "Docker Compose is installed (version $COMPOSE_VERSION)"
        return 0
    else
        print_error "Docker Compose is not installed"
        return 1
    fi
}

# Check if Docker daemon is running
check_docker_daemon() {
    if docker info &> /dev/null; then
        print_success "Docker daemon is running"
        return 0
    else
        print_error "Docker daemon is not running"
        return 1
    fi
}

# Check available disk space
check_disk_space() {
    AVAILABLE_SPACE=$(df -h . | awk 'NR==2 {print $4}' | sed 's/G//')
    if (( $(echo "$AVAILABLE_SPACE > 10" | bc -l) )); then
        print_success "Sufficient disk space available (${AVAILABLE_SPACE}GB)"
        return 0
    else
        print_warning "Low disk space (${AVAILABLE_SPACE}GB). Recommended: 10GB+"
        return 1
    fi
}

# Install Docker (macOS)
install_docker_macos() {
    print_info "Installing Docker Desktop for macOS..."
    if command -v brew &> /dev/null; then
        brew install --cask docker
        print_success "Docker Desktop installed. Please open Docker Desktop and start the daemon."
        print_warning "After Docker Desktop starts, run this script again."
        exit 0
    else
        print_error "Homebrew is not installed. Please install Docker Desktop manually from:"
        print_info "https://www.docker.com/products/docker-desktop"
        exit 1
    fi
}

# Install Docker (Linux)
install_docker_linux() {
    print_info "Installing Docker for Linux..."

    # Detect Linux distribution
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
    fi

    case $OS in
        ubuntu|debian)
            sudo apt-get update
            sudo apt-get install -y \
                ca-certificates \
                curl \
                gnupg \
                lsb-release

            sudo mkdir -p /etc/apt/keyrings
            curl -fsSL https://download.docker.com/linux/$OS/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

            echo \
              "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$OS \
              $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

            sudo apt-get update
            sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

            sudo systemctl start docker
            sudo systemctl enable docker

            print_success "Docker installed successfully"
            ;;
        fedora|centos|rhel)
            sudo dnf -y install dnf-plugins-core
            sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
            sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

            sudo systemctl start docker
            sudo systemctl enable docker

            print_success "Docker installed successfully"
            ;;
        *)
            print_error "Unsupported Linux distribution: $OS"
            print_info "Please install Docker manually from: https://docs.docker.com/engine/install/"
            exit 1
            ;;
    esac

    # Add current user to docker group
    sudo usermod -aG docker $USER
    print_warning "Please log out and log back in for group changes to take effect, then run this script again."
    exit 0
}

# Main setup function
main() {
    echo "Step 1: Checking system dependencies..."
    echo ""

    # Detect OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS_TYPE="macOS"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS_TYPE="Linux"
    else
        print_error "Unsupported operating system: $OSTYPE"
        exit 1
    fi

    print_info "Detected OS: $OS_TYPE"
    echo ""

    # Check Docker
    if ! check_docker; then
        print_warning "Docker needs to be installed"
        read -p "Would you like to install Docker automatically? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if [[ "$OS_TYPE" == "macOS" ]]; then
                install_docker_macos
            else
                install_docker_linux
            fi
        else
            print_error "Docker is required. Please install it manually and run this script again."
            exit 1
        fi
    fi

    # Check Docker Compose
    if ! check_docker_compose; then
        print_error "Docker Compose is required but not found"
        print_info "Please install Docker Compose and try again"
        exit 1
    fi

    # Check Docker daemon
    if ! check_docker_daemon; then
        print_error "Please start Docker and run this script again"
        exit 1
    fi

    # Check disk space
    check_disk_space

    echo ""
    echo "================================================"
    echo "  All prerequisites met!"
    echo "================================================"
    echo ""

    # Check if .env file exists
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from .env.example..."
        if [ -f .env.example ]; then
            cp .env.example .env
            print_success ".env file created"
        else
            print_error ".env.example not found. Please create .env manually."
            exit 1
        fi
    fi

    echo ""
    print_info "Starting SkyChat setup..."
    echo ""

    # Stop any existing containers
    print_info "Stopping any existing containers..."
    docker compose down 2>/dev/null || true

    echo ""
    print_info "Building Docker images..."
    docker compose build

    echo ""
    print_info "Starting services..."
    print_warning "This will take several minutes on first run:"
    echo "  - MariaDB initialization (~30 seconds)"
    echo "  - Ollama model download (~1-2 minutes for 1.3GB)"
    echo "  - RAG knowledge base generation (~2-3 minutes)"
    echo ""

    # Start services
    docker compose up -d mariadb ollama

    echo ""
    print_info "Waiting for MariaDB to be ready..."
    until docker compose exec -T mariadb healthcheck.sh --connect --innodb_initialized 2>/dev/null; do
        printf "."
        sleep 2
    done
    echo ""
    print_success "MariaDB is ready"

    echo ""
    print_info "Starting Ollama model download..."
    docker compose up ollama-setup

    echo ""
    print_info "Starting backend and frontend..."
    docker compose up -d backend frontend

    echo ""
    print_info "Setting up RAG knowledge base..."
    print_warning "This will take 2-3 minutes..."
    docker compose up rag-setup

    echo ""
    echo "================================================"
    echo "  🎉 Setup Complete!"
    echo "================================================"
    echo ""
    print_success "SkyChat is now running!"
    echo ""
    echo "Access the application:"
    echo "  - Frontend:  ${BLUE}http://localhost:3000${NC}"
    echo "  - Backend:   ${BLUE}http://localhost:5002${NC}"
    echo "  - Health:    ${BLUE}http://localhost:5002/health${NC}"
    echo ""
    echo "Useful commands:"
    echo "  - View logs:        docker compose logs -f"
    echo "  - Stop services:    docker compose down"
    echo "  - Restart services: docker compose restart"
    echo "  - View status:      docker compose ps"
    echo ""
    print_info "The application is ready to use!"
    echo ""
}

# Run main function
main
