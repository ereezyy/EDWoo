"""
TTS Microservice - Text-to-Speech synthesis
"""
import os
import logging
import base64
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional
import uvicorn

# Import from main project
import sys
sys.path.insert(0, '/app')

from tts.tts_provider import TTSProvider
from config import TTS_CONFIG

# Setup logging
logging.basicConfig(level=os.getenv('LOG_LEVEL', 'INFO'))
logger = logging.getLogger(__name__)

# Initialize app
app = FastAPI(title="TTS Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize TTS
tts = None

class SynthesizeRequest(BaseModel):
    text: str
    voice: Optional[str] = None
    speed: Optional[float] = None
    return_base64: Optional[bool] = False

class SynthesizeResponse(BaseModel):
    audio_base64: Optional[str] = None
    sample_rate: Optional[int] = None
    engine: str

@app.on_event("startup")
async def startup_event():
    global tts
    logger.info("Initializing TTS Provider...")
    tts = TTSProvider(TTS_CONFIG)
    logger.info("TTS Service ready")

@app.post("/synthesize")
async def synthesize(request: SynthesizeRequest):
    """Synthesize speech from text"""
    try:
        if tts is None:
            raise HTTPException(status_code=503, detail="TTS not initialized")

        # Override voice if provided
        voice = request.voice if request.voice else tts.voice

        # Synthesize speech
        audio_file = tts.synthesize_speech(
            text=request.text,
            voice=voice,
            output_file=None  # Will create temp file
        )

        if not audio_file:
            raise HTTPException(status_code=500, detail="Failed to synthesize speech")

        # Read audio file
        with open(audio_file, 'rb') as f:
            audio_data = f.read()

        # Clean up temp file
        try:
            os.remove(audio_file)
        except:
            pass

        if request.return_base64:
            # Return as base64
            audio_b64 = base64.b64encode(audio_data).decode('utf-8')
            return SynthesizeResponse(
                audio_base64=audio_b64,
                sample_rate=tts.config.get('sample_rate', 22050),
                engine=tts.engine
            )
        else:
            # Return as audio file
            return Response(
                content=audio_data,
                media_type="audio/wav",
                headers={
                    "Content-Disposition": "attachment; filename=speech.wav"
                }
            )

    except Exception as e:
        logger.error(f"Synthesis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/clone_voice")
async def clone_voice(audio: UploadFile = File(...)):
    """Clone a voice from audio sample"""
    try:
        if tts is None:
            raise HTTPException(status_code=503, detail="TTS not initialized")

        # Save uploaded file temporarily
        temp_path = f"/tmp/{audio.filename}"
        with open(temp_path, "wb") as f:
            f.write(await audio.read())

        # Clone voice
        success = tts.clone_voice(temp_path)

        # Clean up
        try:
            os.remove(temp_path)
        except:
            pass

        if success:
            return {"message": "Voice cloned successfully", "filename": audio.filename}
        else:
            raise HTTPException(status_code=400, detail="Voice cloning failed")

    except Exception as e:
        logger.error(f"Voice cloning error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    """Health check endpoint"""
    if tts is None:
        return {"status": "initializing"}
    return {
        "status": "ok",
        "service": "tts",
        "engine": tts.engine,
        "voice": tts.voice
    }

@app.get("/engines")
async def list_engines():
    """List available TTS engines"""
    return {
        "available_engines": [
            "sesame_csm",
            "chatterbox",
            "orpheus",
            "higgs",
            "xtts",
            "kokoro"
        ],
        "current_engine": tts.engine if tts else None
    }

@app.get("/voices")
async def list_voices():
    """List available voices for current engine"""
    if tts is None:
        raise HTTPException(status_code=503, detail="TTS not initialized")

    # Return available voices based on engine
    if tts.engine == "sesame_csm" and hasattr(tts._model, 'get_available_speakers'):
        return {"voices": tts._model.get_available_speakers()}
    else:
        return {"voices": ["default"], "current": tts.voice}

if __name__ == "__main__":
    port = int(os.getenv('TTS_PORT', 5003))
    uvicorn.run(app, host="0.0.0.0", port=port)
