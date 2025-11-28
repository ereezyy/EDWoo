"""
Memory Microservice - Conversation storage and retrieval
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

from memory.memory_manager import MemoryManager
from config import MEMORY_CONFIG

# Setup logging
logging.basicConfig(level=os.getenv('LOG_LEVEL', 'INFO'))
logger = logging.getLogger(__name__)

# Initialize app
app = FastAPI(title="Memory Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Memory
memory = None

class ConversationData(BaseModel):
    messages: List[Dict[str, str]]

class SearchRequest(BaseModel):
    query: str
    limit: Optional[int] = 5

@app.on_event("startup")
async def startup_event():
    global memory
    logger.info("Initializing Memory Manager...")
    memory = MemoryManager(MEMORY_CONFIG)
    logger.info("Memory Service ready")

@app.post("/conversations/new")
async def create_conversation():
    """Create a new conversation"""
    try:
        if memory is None:
            raise HTTPException(status_code=503, detail="Memory not initialized")

        conversation_id = memory.create_new_conversation()
        return {"conversation_id": conversation_id, "message": "Conversation created"}

    except Exception as e:
        logger.error(f"Error creating conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id:str):
    """Get conversation by ID"""
    try:
        if memory is None:
            raise HTTPException(status_code=503, detail="Memory not initialized")

        conversation = memory.load_conversation(conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        return conversation

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error loading conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/conversations/{conversation_id}")
async def update_conversation(conversation_id: str, data: ConversationData):
    """Update conversation with new messages"""
    try:
        if memory is None:
            raise HTTPException(status_code=503, detail="Memory not initialized")

        memory.save_conversation(conversation_id, data.messages)
        return {"message": "Conversation updated", "conversation_id": conversation_id}

    except Exception as e:
        logger.error(f"Error updating conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete a conversation"""
    try:
        if memory is None:
            raise HTTPException(status_code=503, detail="Memory not initialized")

        success = memory.delete_conversation(conversation_id)
        if success:
            return {"message": "Conversation deleted", "conversation_id": conversation_id}
        else:
            raise HTTPException(status_code=404, detail="Conversation not found")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/conversations")
async def list_conversations(limit: Optional[int] = 10):
    """List all conversations"""
    try:
        if memory is None:
            raise HTTPException(status_code=503, detail="Memory not initialized")

        conversations = memory.get_all_conversations(limit=limit)
        return {"conversations": conversations, "count": len(conversations)}

    except Exception as e:
        logger.error(f"Error listing conversations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search")
async def search_conversations(request: SearchRequest):
    """Search conversations"""
    try:
        if memory is None:
            raise HTTPException(status_code=503, detail="Memory not initialized")

        results = memory.search_conversations(request.query, limit=request.limit)
        return {"results": results, "count": len(results)}

    except Exception as e:
        logger.error(f"Error searching conversations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/conversations/{conversation_id}/summary")
async def summarize_conversation(conversation_id: str):
    """Get conversation summary"""
    try:
        if memory is None:
            raise HTTPException(status_code=503, detail="Memory not initialized")

        summary = memory.summarize_conversation(conversation_id)
        return {"conversation_id": conversation_id, "summary": summary}

    except Exception as e:
        logger.error(f"Error summarizing conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    """Health check endpoint"""
    if memory is None:
        return {"status": "initializing"}
    return {
        "status": "ok",
        "service": "memory",
        "storage_type": memory.storage_type
    }

if __name__ == "__main__":
    port = int(os.getenv('MEMORY_PORT', 5004))
    uvicorn.run(app, host="0.0.0.0", port=port)
