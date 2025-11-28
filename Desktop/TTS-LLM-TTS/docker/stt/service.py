"""
STT Microservice - Speech-to-Text using Whisper.

This service provides speech-to-text transcription using
OpenAI's Whisper model for accurate audio transcription.
"""
import os
import sys
import logging
from typing import Dict, Any

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Add app directory to path for importing mounted modules
sys.path.insert(0, '/app')

from stt.whisper_stt import WhisperSTT  # noqa: E402
from config import STT_CONFIG  # noqa: E402

# Setup logging
logging.basicConfig(level=os.getenv('LOG_LEVEL', 'INFO'))
logger = logging.getLogger(__name__)

# Initialize app
app = FastAPI(title="STT Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize STT
stt = None

@app.on_event("startup")
async def startup_event():
    global stt
    logger.info("Initializing Whisper STT...")
    stt = WhisperSTT(STT_CONFIG)
    logger.info("STT Service ready")

@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)) -> Dict[str, Any]:
    """Transcribe audio file to text.

    Args:
        audio: Uploaded audio file to transcribe.

    Returns:
        Transcribed text and detected language.

    Raises:
        HTTPException: If STT is not initialized or transcription fails.
    """
    try:
        if stt is None:
            raise HTTPException(status_code=503, detail="STT not initialized")

        # Save uploaded file temporarily
        temp_path = f"/tmp/{audio.filename}"
        with open(temp_path, "wb") as f:
            f.write(await audio.read())

        # Transcribe using Whisper model
        result = stt.model.transcribe(temp_path)
        text = result.get("text", "").strip()

        # Clean up temp file (ignore errors - file may not exist)
        try:
            os.remove(temp_path)
        except OSError:
            pass

        return {"text": text, "language": result.get("language", "unknown")}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Transcription error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health() -> Dict[str, Any]:
    """Health check endpoint for service monitoring.

    Returns:
        Service status information.
    """
    if stt is None:
        return {"status": "initializing", "service": "stt"}
    return {"status": "ok", "service": "stt"}

if __name__ == "__main__":
    port = int(os.getenv('STT_PORT', 5001))
    uvicorn.run(app, host="0.0.0.0", port=port)
