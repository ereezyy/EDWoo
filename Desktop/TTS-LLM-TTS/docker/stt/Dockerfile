# STT Service Dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies (requirements will be mounted at runtime)
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn[standard] \
    python-multipart \
    torch \
    torchaudio \
    openai-whisper \
    soundfile \
    numpy

# Copy service runner only (other files mounted via docker-compose)
COPY service.py ./service.py

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=5 \
    CMD curl --fail http://localhost:5001/health || exit 1

# Run service
CMD ["python", "service.py"]
