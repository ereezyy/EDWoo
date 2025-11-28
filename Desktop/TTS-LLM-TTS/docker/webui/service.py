"""
WebUI Microservice - Flask web interface
"""
import os
import logging
from flask import Flask, render_template, jsonify
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
    """Serve the main UI page"""
    # Get personality profiles
    try:
        response = requests.get(f"{ORCHESTRATOR_URL}/health", timeout=5)
        orchestrator_available = response.status_code == 200
    except:
        orchestrator_available = False

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
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok", "service": "webui"})

@app.route('/api/process', methods=['POST'])
def process_text():
    """Process text through orchestrator"""
    try:
        from flask import request
        data = request.json

        # Forward to orchestrator
        response = requests.post(
            f"{ORCHESTRATOR_URL}/process",
            json=data,
            timeout=30
        )
        response.raise_for_status()

        return jsonify(response.json())

    except requests.RequestException as e:
        logger.error(f"Error communicating with orchestrator: {e}")
        return jsonify({"error": str(e)}), 502
    except Exception as e:
        logger.error(f"Error processing request: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/synthesize/<conversation_id>', methods=['POST'])
def synthesize_audio(conversation_id):
    """Get TTS audio for conversation"""
    try:
        # Forward to orchestrator
        response = requests.post(
            f"{ORCHESTRATOR_URL}/synthesize_response",
            params={"conversation_id": conversation_id},
            timeout=30
        )
        response.raise_for_status()

        return jsonify(response.json())

    except requests.RequestException as e:
        logger.error(f"Error communicating with orchestrator: {e}")
        return jsonify({"error": str(e)}), 502
    except Exception as e:
        logger.error(f"Error synthesizing audio: {e}")
        return jsonify({"error": str(e)}), 500

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    logger.info("Client connected")

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    logger.info("Client disconnected")

@socketio.on('message')
def handle_message(data):
    """Handle incoming messages from client"""
    try:
        # Forward to orchestrator
        response = requests.post(
            f"{ORCHESTRATOR_URL}/process",
            json=data,
            timeout=30
        )
        response.raise_for_status()

        # Send response back to client
        socketio.emit('response', response.json())

    except Exception as e:
        logger.error(f"Error handling message: {e}")
        socketio.emit('error', {"error": str(e)})

if __name__ == '__main__':
    port = int(os.getenv('WEBUI_PORT', 8080))
    logger.info(f"Starting WebUI on port {port}")
    socketio.run(app, host='0.0.0.0', port=port, debug=False)
