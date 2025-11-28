"""
STT Microservice - Speech-to-Text using Whisper
"""
import os
import logging
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Import from main project
import sys
sys.path.insert(0, '/app')

from stt.whisper_stt import WhisperSTT
from config import STT_CONFIG

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
async def transcribe(audio: UploadFile = File(...)):
    """Transcribe audio file"""
    try:
        if stt is None:
            raise HTTPException(status_code=503, detail="STT not initialized")

        # Save uploaded file temporarily
        temp_path = f"/tmp/{audio.filename}"
        with open(temp_path, "wb") as f:
            f.write(await audio.read())

        # Transcribe
        result = stt.model.transcribe(temp_path)
        text = result.get("text", "").strip()

        # Clean up
        os.remove(temp_path)

        return {"text": text, "language": result.get("language", "unknown")}

    except Exception as e:
        logger.error(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    """Health check endpoint"""
    if stt is None:
        return {"status": "initializing"}
    return {"status": "ok", "service": "stt"}

if __name__ == "__main__":
    port = int(os.getenv('STT_PORT', 5001))
    uvicorn.run(app, host="0.0.0.0", port=port)
