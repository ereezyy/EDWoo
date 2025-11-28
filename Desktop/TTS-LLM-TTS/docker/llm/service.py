"""
LLM Microservice - Language Model inference.

This service provides language model inference capabilities using
various providers (OpenRouter, OpenAI, Anthropic, or local models).
"""
import os
import sys
import logging
from typing import List, Dict, Optional, Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Add app directory to path for importing mounted modules
sys.path.insert(0, '/app')

from llm.llm_provider import LLMProvider  # noqa: E402
from config import LLM_CONFIG  # noqa: E402

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
async def generate(request: GenerateRequest) -> GenerateResponse:
    """Generate text completion from language model.

    Args:
        request: Generation request with messages and optional parameters.

    Returns:
        Generated text response with model info and token usage.

    Raises:
        HTTPException: If LLM not initialized or generation fails.
    """
    if llm is None:
        raise HTTPException(status_code=503, detail="LLM not initialized")

    try:
        # Build kwargs with optional parameters
        kwargs: Dict[str, Any] = {}
        if request.temperature is not None:
            kwargs['temperature'] = request.temperature
        if request.max_tokens is not None:
            kwargs['max_tokens'] = request.max_tokens

        # Generate response from LLM
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

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Generation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Generation failed")


@app.get("/health")
async def health() -> Dict[str, Any]:
    """Health check endpoint for service monitoring.

    Returns:
        Service status with provider and model information.
    """
    if llm is None:
        return {"status": "initializing", "service": "llm"}
    return {
        "status": "ok",
        "service": "llm",
        "provider": llm.provider,
        "model": llm.model
    }


@app.get("/models")
async def list_models() -> Dict[str, Any]:
    """List available models for the current provider.

    Returns:
        Dict with current provider, model, and available models.

    Raises:
        HTTPException: If LLM not initialized.
    """
    if llm is None:
        raise HTTPException(status_code=503, detail="LLM not initialized")

    available = []
    if hasattr(llm, 'get_available_models'):
        available = llm.get_available_models()

    return {
        "provider": llm.provider,
        "current_model": llm.model,
        "available_models": available
    }

if __name__ == "__main__":
    port = int(os.getenv('LLM_PORT', 5002))
    uvicorn.run(app, host="0.0.0.0", port=port)
