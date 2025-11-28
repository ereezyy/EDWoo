"""
WebUI Microservice - Flask web interface.

This service provides the web-based user interface for the TTS-LLM-TTS system.
It serves HTML templates and proxies API requests to the orchestrator service.
"""
import os
import logging
from typing import Dict, Any, Tuple

from flask import Flask, render_template, jsonify, request
from flask_socketio import SocketIO
from flask_cors import CORS
import requests

# Setup logging
logging.basicConfig(level=os.getenv('LOG_LEVEL', 'INFO'))
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__,
            template_folder='/app/ui/templates',
            static_folder='/app/ui/static')
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Orchestrator URL
ORCHESTRATOR_URL = os.getenv('ORCHESTRATOR_URL', 'http://orchestrator:5000')

@app.route('/')
def index():
    """Serve the main UI page."""
    # Check orchestrator availability for status display
    orchestrator_available = False
    try:
        response = requests.get(f"{ORCHESTRATOR_URL}/health", timeout=5)
        orchestrator_available = response.status_code == 200
    except requests.RequestException as e:
        logger.warning(f"Orchestrator health check failed: {e}")

    # Default personality profiles
    personalities = [
        {"name": "assistant", "display_name": "Standard Assistant"},
        {"name": "friendly", "display_name": "Friendly & Casual"},
        {"name": "professional", "display_name": "Professional"},
        {"name": "technical", "display_name": "Technical Expert"}
    ]

    return render_template(
        'index.html',
        theme='dark',
        personalities=personalities,
        active_personality='assistant',
        orchestrator_available=orchestrator_available
    )

@app.route('/health')
def health() -> Tuple[Any, int]:
    """Health check endpoint for service monitoring.

    Returns:
        JSON response with service status.
    """
    return jsonify({"status": "ok", "service": "webui"}), 200

@app.route('/api/process', methods=['POST'])
def process_text() -> Tuple[Any, int]:
    """Process text through orchestrator.

    Expects JSON payload with 'text' field and optional 'conversation_id'.

    Returns:
        JSON response with assistant's reply or error message.
    """
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400

        # Forward to orchestrator
        response = requests.post(
            f"{ORCHESTRATOR_URL}/process",
            json=data,
            timeout=30
        )
        response.raise_for_status()

        return jsonify(response.json()), 200

    except requests.RequestException as e:
        logger.error(f"Error communicating with orchestrator: {e}")
        return jsonify({"error": "Service unavailable", "detail": str(e)}), 502
    except Exception as e:
        logger.error(f"Error processing request: {e}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/synthesize/<conversation_id>', methods=['POST'])
def synthesize_audio(conversation_id: str) -> Tuple[Any, int]:
    """Get TTS audio for a specific conversation.

    Args:
        conversation_id: The unique identifier of the conversation.

    Returns:
        JSON response with synthesized audio data or error message.
    """
    if not conversation_id or not conversation_id.strip():
        return jsonify({"error": "conversation_id is required"}), 400

    try:
        response = requests.post(
            f"{ORCHESTRATOR_URL}/synthesize_response",
            params={"conversation_id": conversation_id},
            timeout=30
        )
        response.raise_for_status()

        return jsonify(response.json()), 200

    except requests.RequestException as e:
        logger.error(f"Error communicating with orchestrator: {e}")
        return jsonify({"error": "Service unavailable", "detail": str(e)}), 502
    except Exception as e:
        logger.error(f"Error synthesizing audio: {e}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500

@socketio.on('connect')
def handle_connect() -> None:
    """Handle client WebSocket connection."""
    logger.info("Client connected")


@socketio.on('disconnect')
def handle_disconnect() -> None:
    """Handle client WebSocket disconnection."""
    logger.info("Client disconnected")


@socketio.on('message')
def handle_message(data: Dict[str, Any]) -> None:
    """Handle incoming messages from WebSocket client.

    Args:
        data: Message payload containing text and optional conversation_id.
    """
    if not data or not isinstance(data, dict):
        logger.warning("Received invalid message data")
        socketio.emit('error', {"error": "Invalid message format"})
        return

    try:
        response = requests.post(
            f"{ORCHESTRATOR_URL}/process",
            json=data,
            timeout=30
        )
        response.raise_for_status()
        socketio.emit('response', response.json())

    except requests.RequestException as e:
        logger.error(f"Error communicating with orchestrator: {e}")
        socketio.emit('error', {"error": "Service unavailable"})
    except Exception as e:
        logger.error(f"Error handling message: {e}", exc_info=True)
        socketio.emit('error', {"error": "Internal error"})

if __name__ == '__main__':
    port = int(os.getenv('WEBUI_PORT', 8080))
    logger.info(f"Starting WebUI on port {port}")
    socketio.run(app, host='0.0.0.0', port=port, debug=False)
