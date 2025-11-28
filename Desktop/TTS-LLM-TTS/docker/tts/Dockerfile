# TTS Service Dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    ffmpeg \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY ../../tts/requirements.txt ./tts_requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r tts_requirements.txt && \
    pip install --no-cache-dir fastapi uvicorn[standard] python-multipart torch torchaudio transformers

# Copy application code
COPY ../../config.py ./config.py
COPY ../../tts ./tts

# Copy service runner
COPY service.py ./service.py

# Expose port
EXPOSE 5003

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=300s --retries=6 \
    CMD curl --fail http://localhost:5003/health || exit 1

# Run service
CMD ["python", "service.py"]
