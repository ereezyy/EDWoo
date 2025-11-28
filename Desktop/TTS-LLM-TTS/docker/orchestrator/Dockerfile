# Orchestrator Service Dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir fastapi uvicorn[standard] httpx

# Copy application code
COPY ../../config.py ./config.py
COPY ../../core.py ./core.py
COPY ../../personality ./personality

# Copy service runner
COPY service.py ./service.py

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl --fail http://localhost:5000/health || exit 1

# Run service
CMD ["python", "service.py"]
