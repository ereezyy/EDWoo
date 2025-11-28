#!/bin/bash
# Docker Deployment Quickstart Script for TTS-LLM-TTS
# This script helps you quickly deploy the TTS-LLM-TTS system using Docker Compose

echo "========================================"
echo "TTS-LLM-TTS Docker Deployment"
echo "========================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed or not in PATH"
    echo "Please install Docker from https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "ERROR: docker-compose is not installed or not in PATH"
    exit 1
fi

echo "Docker and docker-compose found!"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo ".env file not found. Creating from .env.example..."
    cp .env.example .env
    echo ""
    echo "IMPORTANT: Please edit the .env file with your API keys before continuing!"
    echo "Opening .env file..."
    ${EDITOR:-nano} .env
    echo ""
    read -p "Have you updated your API keys in .env file? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

echo ""
echo "Starting Docker Compose build and deployment..."
echo "This may take several minutes on first run..."
echo ""

docker-compose up --build -d

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "Deployment successful!"
    echo "========================================"
    echo ""
    echo "Services are starting up. This may take a few minutes."
    echo ""
    echo "Access points:"
    echo "  - Web UI: http://localhost:8080"
    echo "  - Orchestrator API: http://localhost:5000"
    echo "  - STT Service: http://localhost:5001"
    echo "  - LLM Service: http://localhost:5002"
    echo "  - TTS Service: http://localhost:5003"
    echo "  - Memory Service: http://localhost:5004"
    echo ""
    echo "To view logs: docker-compose logs -f"
    echo "To stop services: docker-compose down"
    echo ""
    echo "Opening Web UI in default browser..."
    sleep 3

    # Try to open browser based on OS
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:8080
    elif command -v open &> /dev/null; then
        open http://localhost:8080
    else
        echo "Please open http://localhost:8080 in your browser"
    fi
else
    echo ""
    echo "ERROR: Deployment failed!"
    echo "Check the logs with: docker-compose logs"
    exit 1
fi
