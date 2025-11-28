# LLM Service Dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies (requirements will be mounted at runtime)
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn[standard] \
    httpx \
    openai \
    anthropic \
    requests

# Copy service runner only (other files mounted via docker-compose)
COPY service.py ./service.py

# Expose port
EXPOSE 5002

# Health check
HEALTHCHECK --interval=30s --timeout=15s --start-period=180s --retries=5 \
    CMD curl --fail http://localhost:5002/health || exit 1

# Run service
CMD ["python", "service.py"]
