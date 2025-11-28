# Memory Service Dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies (requirements will be mounted at runtime)
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn[standard] \
    aiofiles

# Copy service runner only (other files mounted via docker-compose)
COPY service.py ./service.py

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 5004

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl --fail http://localhost:5004/health || exit 1

# Run service
CMD ["python", "service.py"]
