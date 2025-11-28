"""
Memory subsystem for the TTS-LLM-TTS application.
Provides storage, retrieval, and management of conversation history.
"""

import os
import json
import time
import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional, Union

# Handle both package and direct imports
try:
    from ..config import MEMORY_CONFIG, MEMORY_DIR
except ImportError:
    from config import MEMORY_CONFIG, MEMORY_DIR

# Optional imports for vector storage
try:
    import numpy as np
    from sentence_transformers import SentenceTransformer
    HAS_VECTOR_LIBS = True

    # Try to import vector DB libraries
    try:
        import chromadb
        HAS_CHROMA = True
    except ImportError:
        HAS_CHROMA = False
except ImportError:
    HAS_VECTOR_LIBS = False
    HAS_CHROMA = False


class MemoryManager:
    """Manages persistent memory storage for conversations."""

    def __init__(self, config: Dict = None):
        """
        Initialize the memory manager with the provided configuration.

        Args:
            config: Configuration dictionary for memory options
        """
        self.config = config or MEMORY_CONFIG
        self.enabled = self.config.get("enabled", True)
        self.storage_type = self.config.get("storage_type", "json")
        self.max_history = self.config.get("max_history", 100)
        self.summary_interval = self.config.get("summary_interval", 10)
        self.file_based = self.config.get("file_based", True)

        # For vector storage
        self.vector_store = self.config.get("vector_store", "chroma")
        self.embedding_model = self.config.get("embedding_model",
                                      "sentence-transformers/all-MiniLM-L6-v2")

        # Initialize storage
        self.storage_dir = MEMORY_DIR
        os.makedirs(self.storage_dir, exist_ok=True)

        # Load embeddings model if using vector storage
        self._embedding_model = None
        self._vector_db = None
        if self.storage_type == "vector":
            self._initialize_vector_storage()

    def _initialize_vector_storage(self):
        """Initialize vector storage for semantic memory retrieval."""
        if not HAS_VECTOR_LIBS:
            print("Warning: Vector storage libraries not available. "
                  "Install sentence-transformers for vector storage capabilities.")
            # Fall back to JSON storage
            self.storage_type = "json"
            return

        print(f"Initializing vector-based memory with {self.embedding_model}...")

        # Initialize the embedding model (lazy-loaded when needed)

        # Set up the vector database
        if self.vector_store == "chroma" and HAS_CHROMA:
            # Create a persistent ChromaDB collection for memory
            try:
                chroma_dir = self.storage_dir / "chroma"
                os.makedirs(chroma_dir, exist_ok=True)

                self._vector_client = chromadb.PersistentClient(path=str(chroma_dir))
                self._vector_db = self._vector_client.get_or_create_collection(
                    name="conversations",
                    metadata={"hnsw:space": "cosine"}
                )
                print("Vector storage initialized with ChromaDB")
            except Exception as e:
                print(f"Error initializing ChromaDB: {e}")
                # Fall back to JSON storage
                self.storage_type = "json"
        else:
            print("Vector storage requested but no compatible DB available. "
                  "Falling back to JSON storage.")
            self.storage_type = "json"

    def _get_embedding_model(self):
        """Lazy-load the embedding model when needed."""
        if self._embedding_model is None and HAS_VECTOR_LIBS:
            try:
                self._embedding_model = SentenceTransformer(self.embedding_model)
            except Exception as e:
                print(f"Error loading embedding model: {e}")
                return None
        return self._embedding_model

    def save_conversation(self, conversation_id: str, messages: List[Dict]) -> bool:
        """
        Save a conversation to persistent storage.

        Args:
            conversation_id: Unique identifier for the conversation
            messages: List of message dictionaries with 'role' and 'content'

        Returns:
            True if saved successfully, False otherwise
        """
        if not self.enabled:
            return False

        try:
            # Prepare the conversation data
            conversation_data = {
                "id": conversation_id,
                "timestamp": datetime.datetime.now().isoformat(),
                "messages": messages,
            }

            if self.storage_type == "json":
                return self._save_json_conversation(conversation_id, conversation_data)
            elif self.storage_type == "sqlite":
                return self._save_sqlite_conversation(conversation_id, conversation_data)
            elif self.storage_type == "vector":
                return self._save_vector_conversation(conversation_id, conversation_data)
            else:
                print(f"Unsupported storage type: {self.storage_type}")
                return False

        except Exception as e:
            print(f"Error saving conversation: {e}")
            return False

    def _save_json_conversation(self, conversation_id: str, conversation_data: Dict) -> bool:
        """Save conversation as a JSON file."""
        try:
            file_path = self.storage_dir / f"{conversation_id}.json"

            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(conversation_data, f, ensure_ascii=False, indent=2)

            return True

        except Exception as e:
            print(f"Error saving JSON conversation: {e}")
            return False

    def _save_sqlite_conversation(self, conversation_id: str, conversation_data: Dict) -> bool:
        """Save conversation to SQLite database."""
        # This would be implemented with SQLite, but for simplicity we'll
        # use JSON here until a proper implementation is needed
        print("SQLite storage not fully implemented, falling back to JSON")
        return self._save_json_conversation(conversation_id, conversation_data)

    def _save_vector_conversation(self, conversation_id: str, conversation_data: Dict) -> bool:
        """Save conversation with vector embeddings for semantic search."""
        try:
            # Also save as JSON for backup
            self._save_json_conversation(conversation_id, conversation_data)

            if not self._vector_db or not HAS_VECTOR_LIBS:
                return False

            # Get embedding model
            model = self._get_embedding_model()
            if not model:
                return False

            # Process each message for embedding
            for i, message in enumerate(conversation_data["messages"]):
                content = message.get("content", "")
                if not content:
                    continue

                # Generate embedding for the message content
                embedding = model.encode(content)

                # Store in vector DB
                self._vector_db.add(
                    ids=[f"{conversation_id}_{i}"],
                    embeddings=[embedding.tolist()],
                    metadatas=[{
                        "conversation_id": conversation_id,
                        "message_index": i,
                        "role": message.get("role", "unknown"),
                        "timestamp": conversation_data["timestamp"],
                    }],
                    documents=[content]
                )

            return True

        except Exception as e:
            print(f"Error saving vector conversation: {e}")
            return False

    def load_conversation(self, conversation_id: str) -> Optional[Dict]:
        """
        Load a conversation from storage.

        Args:
            conversation_id: The unique identifier of the conversation

        Returns:
            Conversation data dictionary or None if not found
        """
        if not self.enabled:
            return None

        try:
            if self.storage_type == "json" or self.file_based:
                return self._load_json_conversation(conversation_id)
            elif self.storage_type == "sqlite":
                return self._load_sqlite_conversation(conversation_id)
            elif self.storage_type == "vector":
                # For vector storage, we still load the basic conversation from JSON
                return self._load_json_conversation(conversation_id)
            else:
                print(f"Unsupported storage type: {self.storage_type}")
                return None

        except Exception as e:
            print(f"Error loading conversation: {e}")
            return None

    def _load_json_conversation(self, conversation_id: str) -> Optional[Dict]:
        """Load conversation from a JSON file."""
        file_path = self.storage_dir / f"{conversation_id}.json"

        if not file_path.exists():
            return None

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)

        except Exception as e:
            print(f"Error loading JSON conversation: {e}")
            return None

    def _load_sqlite_conversation(self, conversation_id: str) -> Optional[Dict]:
        """Load conversation from SQLite database."""
        # For now, fall back to JSON until SQLite is implemented
        return self._load_json_conversation(conversation_id)

    def get_all_conversations(self) -> List[str]:
        """
        Get a list of all available conversation IDs.

        Returns:
            List of conversation IDs
        """
        if not self.enabled:
            return []

        try:
            # For file-based storage
            if self.file_based or self.storage_type == "json":
                json_files = list(self.storage_dir.glob("*.json"))
                return [file.stem for file in json_files]

            # Vector and SQLite would have different implementations
            return []

        except Exception as e:
            print(f"Error getting conversations: {e}")
            return []

    def search_conversations(self, query: str, limit: int = 5) -> List[Dict]:
        """
        Search conversations semantically (if vector storage) or by keyword.

        Args:
            query: Search query text
            limit: Maximum number of results to return

        Returns:
            List of conversation snippets matching the query
        """
        if not self.enabled:
            return []

        try:
            if self.storage_type == "vector" and self._vector_db and HAS_VECTOR_LIBS:
                return self._vector_search(query, limit)
            else:
                return self._keyword_search(query, limit)

        except Exception as e:
            print(f"Error searching conversations: {e}")
            return []

    def _vector_search(self, query: str, limit: int) -> List[Dict]:
        """Semantic search using vector embeddings."""
        try:
            # Get embedding model
            model = self._get_embedding_model()
            if not model:
                return []

            # Generate embedding for query
            query_embedding = model.encode(query)

            # Search vector DB
            results = self._vector_db.query(
                query_embeddings=[query_embedding.tolist()],
                n_results=limit
            )

            # Format results
            search_results = []
            if results and "documents" in results and len(results["documents"]) > 0:
                for i, doc in enumerate(results["documents"][0]):
                    metadata = results["metadatas"][0][i]
                    conversation_id = metadata.get("conversation_id")

                    # Load full conversation for context
                    conversation = self._load_json_conversation(conversation_id)
                    if not conversation:
                        continue

                    # Add to results
                    search_results.append({
                        "conversation_id": conversation_id,
                        "timestamp": metadata.get("timestamp"),
                        "content": doc,
                        "context": self._extract_context(conversation, metadata.get("message_index", 0))
                    })

            return search_results

        except Exception as e:
            print(f"Error in vector search: {e}")
            return []

    def _keyword_search(self, query: str, limit: int) -> List[Dict]:
        """Simple keyword-based search through conversations."""
        results = []
        conversations = self.get_all_conversations()
        query_terms = query.lower().split()

        for conv_id in conversations:
            conversation = self._load_json_conversation(conv_id)
            if not conversation:
                continue

            for i, message in enumerate(conversation.get("messages", [])):
                content = message.get("content", "").lower()

                # Check if all query terms are in the message
                if all(term in content for term in query_terms):
                    results.append({
                        "conversation_id": conv_id,
                        "timestamp": conversation.get("timestamp"),
                        "content": message.get("content"),
                        "context": self._extract_context(conversation, i)
                    })

                    # Limit results
                    if len(results) >= limit:
                        return results

        return results

    def _extract_context(self, conversation: Dict, message_index: int, context_size: int = 2) -> List[Dict]:
        """Extract surrounding messages for context."""
        messages = conversation.get("messages", [])
        start = max(0, message_index - context_size)
        end = min(len(messages), message_index + context_size + 1)

        return messages[start:end]

    def delete_conversation(self, conversation_id: str) -> bool:
        """
        Delete a conversation from storage.

        Args:
            conversation_id: The unique identifier of the conversation

        Returns:
            True if deleted successfully, False otherwise
        """
        if not self.enabled:
            return False

        try:
            # File-based deletion
            if self.file_based or self.storage_type == "json":
                file_path = self.storage_dir / f"{conversation_id}.json"
                if file_path.exists():
                    os.unlink(file_path)

            # Vector storage deletion
            if self.storage_type == "vector" and self._vector_db:
                self._vector_db.delete(
                    where={"conversation_id": conversation_id}
                )

            return True

        except Exception as e:
            print(f"Error deleting conversation: {e}")
            return False

    def summarize_conversation(self, conversation_id: str) -> Optional[str]:
        """
        Create a summary of a conversation using the LLM.
        This requires integration with the LLM component.

        Args:
            conversation_id: The unique identifier of the conversation

        Returns:
            Summary text or None if summarization fails
        """
        # This would typically call the LLM to generate a summary
        # For now, we'll return a placeholder
        conversation = self.load_conversation(conversation_id)
        if not conversation:
            return None

        message_count = len(conversation.get("messages", []))
        return f"Conversation with {message_count} messages. A proper summary would be generated by the LLM."

    def get_recent_messages(self, conversation_id: str, count: int = 10) -> List[Dict]:
        """
        Get the most recent messages from a conversation.

        Args:
            conversation_id: The unique identifier of the conversation
            count: Number of recent messages to retrieve

        Returns:
            List of message dictionaries
        """
        conversation = self.load_conversation(conversation_id)
        if not conversation:
            return []

        messages = conversation.get("messages", [])
        return messages[-count:] if count > 0 else messages

    def create_new_conversation(self) -> str:
        """
        Create a new conversation with a unique ID.

        Returns:
            New conversation ID
        """
        # Generate a unique ID based on timestamp
        conversation_id = f"conv_{int(time.time())}_{os.urandom(4).hex()}"

        # Initialize with empty messages
        conversation_data = {
            "id": conversation_id,
            "timestamp": datetime.datetime.now().isoformat(),
            "messages": []
        }

        # Save the initial conversation
        self.save_conversation(conversation_id, [])

        return conversation_id


# Basic usage example
if __name__ == "__main__":
    # Example usage
    memory = MemoryManager()

    # Create a new conversation
    conv_id = memory.create_new_conversation()
    print(f"Created new conversation: {conv_id}")

    # Add some messages
    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello, how are you today?"},
        {"role": "assistant", "content": "I'm doing well, thank you! How can I help you?"}
    ]

    memory.save_conversation(conv_id, messages)

    # Retrieve the conversation
    loaded_conv = memory.load_conversation(conv_id)
    if loaded_conv:
        print(f"Loaded conversation with {len(loaded_conv['messages'])} messages")

    # Search for conversations
    results = memory.search_conversations("how are you")
    print(f"Found {len(results)} matching conversations")
