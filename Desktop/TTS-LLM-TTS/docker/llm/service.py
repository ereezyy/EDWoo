"""
LLM Microservice - Language Model inference
"""
import os
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import uvicorn

# Import from main project
import sys
sys.path.insert(0, '/app')

from llm.llm_provider import LLMProvider
from config import LLM_CONFIG

# Setup logging
logging.basicConfig(level=os.getenv('LOG_LEVEL', 'INFO'))
logger = logging.getLogger(__name__)

# Initialize app
app = FastAPI(title="LLM Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize LLM
llm = None

class GenerateRequest(BaseModel):
    messages: List[Dict[str, str]]
    stream: Optional[bool] = False
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None

class GenerateResponse(BaseModel):
    content: str
    model: str
    tokens_used: Optional[int] = None

@app.on_event("startup")
async def startup_event():
    global llm
    logger.info("Initializing LLM Provider...")
    llm = LLMProvider(LLM_CONFIG)
    logger.info("LLM Service ready")

@app.post("/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest):
    """Generate text from LLM"""
    try:
        if llm is None:
            raise HTTPException(status_code=503, detail="LLM not initialized")

        # Override config with request parameters if provided
        kwargs = {}
        if request.temperature is not None:
            kwargs['temperature'] = request.temperature
        if request.max_tokens is not None:
            kwargs['max_tokens'] = request.max_tokens

        # Generate response
        response = llm.generate(
            messages=request.messages,
            stream=request.stream,
            **kwargs
        )

        return GenerateResponse(
            content=response.get("content", ""),
            model=response.get("model", llm.model),
            tokens_used=response.get("tokens_used")
        )

    except Exception as e:
        logger.error(f"Generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    """Health check endpoint"""
    if llm is None:
        return {"status": "initializing"}
    return {"status": "ok", "service": "llm", "provider": llm.provider, "model": llm.model}

@app.get("/models")
async def list_models():
    """List available models"""
    if llm is None:
        raise HTTPException(status_code=503, detail="LLM not initialized")

    return {
        "provider": llm.provider,
        "current_model": llm.model,
        "available_models": llm.get_available_models() if hasattr(llm, 'get_available_models') else []
    }

if __name__ == "__main__":
    port = int(os.getenv('LLM_PORT', 5002))
    uvicorn.run(app, host="0.0.0.0", port=port)
