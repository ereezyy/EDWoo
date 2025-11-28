# TTS-LLM-TTS Deployment Guide

Complete guide for deploying the TTS-LLM-TTS system in production using Docker microservices architecture.

## 🚀 Quick Start

### Prerequisites

- Docker Desktop or Docker Engine (20.10+)
- Docker Compose (v2.0+)
- Minimum 8GB RAM (16GB recommended)
- NVIDIA GPU with CUDA support (optional, for GPU acceleration)
- API keys for LLM services (OpenRouter, OpenAI, Anthropic, or local model)

### One-Command Deployment

**Windows:**

```bash
docker-start.bat
```

**Linux/Mac:**

```bash
chmod +x docker-start.sh
./docker-start.sh
```

The script will:

1. Check Docker installation
2. Create `.env` file from template (if needed)
3. Build and start all 6 microservices
4. Open the Web UI in your browser

## 📋 Manual Deployment Steps

### 1. Clone Repository

```bash
git clone https://github.com/ereezyy/EDWoo.git
cd EDWoo/Desktop/TTS-LLM-TTS
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your API keys
nano .env  # or use any text editor
```

Required configuration:

- `OPENROUTER_API_KEY` - For OpenRouter LLM access
- `OPENAI_API_KEY` - For OpenAI GPT models (optional)
- `ANTHROPIC_API_KEY` - For Claude models (optional)

### 3. Build Services

```bash
docker-compose build
```

### 4. Start Services

```bash
# Start in detached mode
docker-compose up -d

# Or start with logs visible
docker-compose up
```

### 5. Access Services

Once deployed, access the following endpoints:

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| **Web UI** | 8080 | <http://localhost:8080> | Main user interface |
| **Orchestrator** | 5000 | <http://localhost:5000> | Service coordinator |
| **STT** | 5001 | <http://localhost:5001> | Speech-to-Text (Whisper) |
| **LLM** | 5002 | <http://localhost:5002> | Language Model |
| **TTS** | 5003 | <http://localhost:5003> | Text-to-Speech (Sesame CSM) |
| **Memory** | 5004 | <http://localhost:5004> | Conversation storage |

## 🔧 Service Architecture

### Microservices Overview

```
┌─────────────────────────────────────────────────────┐
│                     Web UI (8080)                    │
│                  Flask + Socket.IO                   │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│               Orchestrator (5000)                    │
│            Coordinates all services                  │
└──┬────────┬────────┬────────┬─────────────────────┘
   │        │        │        │
   ▼        ▼        ▼        ▼
┌───────┐┌───────┐┌───────┐┌────────┐
│  STT  ││  LLM  ││  TTS  ││ Memory │
│ (5001)││ (5002)││ (5003)││ (5004) │
└───────┘└───────┘└───────┘└────────┘
```

### Service Dependencies

- **STT Service**: Whisper model (auto-downloaded on first run)
- **LLM Service**: External API or local model
- **TTS Service**: Sesame CSM model (auto-downloaded, ~1GB)
- **Memory Service**: SQLite database (persisted in `./data` volume)
- **Orchestrator**: No external dependencies
- **Web UI**: Serves static HTML/CSS/JS interface

## 🐳 Docker Configuration

### GPU Support

To enable GPU acceleration for TTS and other services:

1. Ensure NVIDIA drivers are installed
2. Install NVIDIA Container Toolkit
3. Services will automatically use GPU if available

### Volume Mounts

The system uses the following persistent volumes:

```yaml
volumes:
  - ./data:/app/data          # Conversation database
  - ./logs:/app/logs          # Application logs
  - ./models:/app/models      # Downloaded AI models
  - ./ui:/app/ui              # Web UI templates/static files
```

### Environment Variables

Key environment variables in `.env`:

```bash
# LLM Configuration
LLM_PROVIDER=openrouter
LLM_MODEL=mistralai/mistral-7b-instruct
OPENROUTER_API_KEY=your_key_here

# TTS Configuration
TTS_ENGINE=sesame_csm
TTS_VOICE=speaker_00

# Memory Configuration
MEMORY_STORAGE=sqlite
MEMORY_DB_PATH=/app/data/conversations.db

# Logging
LOG_LEVEL=INFO
```

## 🔍 Monitoring & Debugging

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f orchestrator
docker-compose logs -f tts
```

### Check Service Health

```bash
# Check all services
docker-compose ps

# Health check endpoints
curl http://localhost:5000/health  # Orchestrator
curl http://localhost:5001/health  # STT
curl http://localhost:5002/health  # LLM
curl http://localhost:5003/health  # TTS
curl http://localhost:5004/health  # Memory
curl http://localhost:8080/health  # Web UI
```

### Access Container Shell

```bash
docker-compose exec orchestrator bash
docker-compose exec tts bash
```

## 🔄 Update & Maintenance

### Update Services

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Backup Data

```bash
# Backup conversation database
cp ./data/conversations.db ./backups/conversations_$(date +%Y%m%d).db

# Backup configuration
cp .env ./backups/.env_$(date +%Y%m%d)
```

### Clean Up

```bash
# Stop all services
docker-compose down

# Remove all containers and volumes
docker-compose down -v

# Clean up Docker system
docker system prune -a
```

## 🌐 Production Deployment

### Reverse Proxy Setup (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io {
        proxy_pass http://localhost:8080/socket.io;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
```

### SSL/TLS Setup

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com
```

### Firewall Configuration

```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Services (if exposing directly)
sudo ufw allow 8080/tcp
```

## 📊 Performance Tuning

### Resource Limits

Edit `docker-compose.yml` to adjust resource limits:

```yaml
services:
  tts:
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 8G
        reservations:
          memory: 4G
```

### Scaling Services

```bash
# Scale specific service
docker-compose up -d --scale tts=2

# Use load balancer for horizontal scaling
```

## 🐛 Troubleshooting

### Common Issues

**Services won't start:**

- Check Docker is running: `docker ps`
- Check logs: `docker-compose logs`
- Verify `.env` file exists and has correct API keys

**Out of memory errors:**

- Increase Docker memory limit in Docker Desktop
- Reduce concurrent model loading
- Use smaller models

**GPU not detected:**

- Install NVIDIA Container Toolkit
- Check NVIDIA drivers: `nvidia-smi`
- Verify CUDA compatibility

**Slow TTS synthesis:**

- First run downloads models (~1GB for Sesame CSM)
- Subsequent runs use cached models
- GPU acceleration significantly improves speed

**API connection errors:**

- Verify API keys in `.env`
- Check internet connectivity
- Review service health checks

## 📚 Additional Resources

- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Detailed setup instructions
- [README.md](./README.md) - Project overview and features
- [GitHub Repository](https://github.com/ereezyy/EDWoo)

## 🆘 Support

For issues and questions:

1. Check existing documentation
2. Review GitHub Issues
3. Submit detailed bug reports with logs

## 📝 License

See [LICENSE](./LICENSE) file for details.
