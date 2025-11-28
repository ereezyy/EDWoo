"""
Orchestrator Microservice - Coordinates all services.

This service acts as the central coordinator for the TTS-LLM-TTS system,
managing communication between STT, LLM, TTS, and Memory services.
"""
import os
import logging
from typing import Dict, Optional, Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import uvicorn

# Setup logging
logging.basicConfig(level=os.getenv('LOG_LEVEL', 'INFO'))
logger = logging.getLogger(__name__)

# Initialize app
app = FastAPI(title="Orchestrator Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Service URLs
STT_SERVICE_URL = os.getenv('STT_SERVICE_URL', 'http://stt:5001')
LLM_SERVICE_URL = os.getenv('LLM_SERVICE_URL', 'http://llm:5002')
TTS_SERVICE_URL = os.getenv('TTS_SERVICE_URL', 'http://tts:5003')
MEMORY_SERVICE_URL = os.getenv('MEMORY_SERVICE_URL', 'http://memory:5004')

# HTTP client
http_client = None

class ProcessRequest(BaseModel):
    text: str
    conversation_id: Optional[str] = None
    personality: Optional[str] = "assistant"

class ProcessResponse(BaseModel):
    user_transcript: str
    assistant_response: str
    conversation_id: str

@app.on_event("startup")
async def startup_event():
    global http_client
    logger.info("Initializing Orchestrator...")
    http_client = httpx.AsyncClient(timeout=60.0)
    logger.info("Orchestrator ready")

@app.on_event("shutdown")
async def shutdown_event():
    global http_client
    if http_client:
        await http_client.aclose()
    logger.info("Orchestrator shutdown")

@app.post("/process", response_model=ProcessResponse)
async def process_text(request: ProcessRequest):
    """Process text through the full pipeline"""
    try:
        # Get or create conversation
        conversation_id = request.conversation_id
        if not conversation_id:
            # Create new conversation
            resp = await http_client.post(f"{MEMORY_SERVICE_URL}/conversations/new")
            resp.raise_for_status()
            conversation_id = resp.json()["conversation_id"]

        # Get conversation history
        resp = await http_client.get(f"{MEMORY_SERVICE_URL}/conversations/{conversation_id}")
        resp.raise_for_status()
        conversation = resp.json()
        messages = conversation.get("messages", [])

        # Add user message
        messages.append({"role": "user", "content": request.text})

        # Generate LLM response
        llm_request = {
            "messages": messages,
            "stream": False
        }
        resp = await http_client.post(f"{LLM_SERVICE_URL}/generate", json=llm_request)
        resp.raise_for_status()
        llm_response = resp.json()
        assistant_text = llm_response["content"]

        # Add assistant response to messages
        messages.append({"role": "assistant", "content": assistant_text})

        # Update conversation in memory
        await http_client.put(
            f"{MEMORY_SERVICE_URL}/conversations/{conversation_id}",
            json={"messages": messages}
        )

        return ProcessResponse(
            user_transcript=request.text,
            assistant_response=assistant_text,
            conversation_id=conversation_id
        )

    except httpx.HTTPError as e:
        logger.error(f"HTTP error in pipeline: {e}")
        raise HTTPException(status_code=502, detail=f"Service communication error: {str(e)}")
    except Exception as e:
        logger.error(f"Error in pipeline: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/synthesize_response")
async def synthesize_response(conversation_id: str):
    """Get TTS audio for last assistant response"""
    try:
        # Get conversation
        resp = await http_client.get(f"{MEMORY_SERVICE_URL}/conversations/{conversation_id}")
        resp.raise_for_status()
        conversation = resp.json()
        messages = conversation.get("messages", [])

        # Get last assistant message
        assistant_message = None
        for msg in reversed(messages):
            if msg.get("role") == "assistant":
                assistant_message = msg.get("content")
                break

        if not assistant_message:
            raise HTTPException(status_code=404, detail="No assistant response found")

        # Synthesize speech
        tts_request = {
            "text": assistant_message,
            "return_base64": True
        }
        resp = await http_client.post(f"{TTS_SERVICE_URL}/synthesize", json=tts_request)
        resp.raise_for_status()

        return resp.json()

    except httpx.HTTPError as e:
        logger.error(f"HTTP error synthesizing: {e}")
        raise HTTPException(status_code=502, detail=f"Service communication error: {str(e)}")
    except Exception as e:
        logger.error(f"Error synthesizing: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health() -> Dict[str, Any]:
    """Health check endpoint with downstream service status.

    Returns:
        JSON with orchestrator status and status of all downstream services.
    """
    services_status: Dict[str, str] = {}

    # Check STT service
    try:
        resp = await http_client.get(f"{STT_SERVICE_URL}/health", timeout=2.0)
        services_status["stt"] = "ok" if resp.status_code == 200 else "error"
    except Exception:
        services_status["stt"] = "unreachable"

    # Check LLM service
    try:
        resp = await http_client.get(f"{LLM_SERVICE_URL}/health", timeout=2.0)
        services_status["llm"] = "ok" if resp.status_code == 200 else "error"
    except Exception:
        services_status["llm"] = "unreachable"

    # Check TTS service
    try:
        resp = await http_client.get(f"{TTS_SERVICE_URL}/health", timeout=2.0)
        services_status["tts"] = "ok" if resp.status_code == 200 else "error"
    except Exception:
        services_status["tts"] = "unreachable"

    # Check Memory service
    try:
        resp = await http_client.get(f"{MEMORY_SERVICE_URL}/health", timeout=2.0)
        services_status["memory"] = "ok" if resp.status_code == 200 else "error"
    except Exception:
        services_status["memory"] = "unreachable"

    return {
        "status": "ok",
        "service": "orchestrator",
        "services": services_status
    }

if __name__ == "__main__":
    port = int(os.getenv('ORCHESTRATOR_PORT', 5000))
    uvicorn.run(app, host="0.0.0.0", port=port)
