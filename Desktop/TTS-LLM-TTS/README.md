# TTS-LLM-TTS: Speech-to-Text + LLM + Text-to-Speech System

A complete conversational AI system with speech input/output capabilities, persistent memory, and customizable personalities.

## Overview

TTS-LLM-TTS integrates three main components to create a seamless voice-based AI assistant:

1. **STT (Speech-to-Text)**: Transcribe spoken language to text using Whisper
2. **LLM (Language Model)**: Process text and generate responses using various AI models
3. **TTS (Text-to-Speech)**: Convert text responses back to spoken audio

Additional features include:

- **Persistent Memory**: Save and retrieve conversation history
- **Personality Profiles**: Define different assistant personalities
- **Web & CLI Interface**: Access the system through a browser or command line
- **Voice Cloning**: Clone voices for the text-to-speech output
- **Continuous Conversation Mode**: Hands-free operation
- **Docker Microservices**: Scalable deployment with isolated services
- **Sesame CSM TTS**: High-quality expressive speech synthesis with 0.6x real-time factor

## Requirements

- Python 3.9+
- PyTorch
- CUDA-capable GPU recommended (especially for local LLMs and higher-quality TTS)
- Microphone for speech input
- Speakers for audio output

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/TTS-LLM-TTS.git
   cd TTS-LLM-TTS
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. (Optional) Configure API keys for cloud-based LLMs:
   Create a `.env` file in the project root with your API keys:

   ```
   OPENAI_API_KEY=your_openai_key_here
   OPENROUTER_API_KEY=your_openrouter_key_here
   ANTHROPIC_API_KEY=your_anthropic_key_here
   ```

## Docker Deployment (Recommended for Production)

For production deployments, use Docker Compose to run the system as microservices:

### Prerequisites

- Docker Desktop installed and running
- NVIDIA GPU with CUDA support
- NVIDIA Container Toolkit installed
- 8GB+ VRAM recommended
- 32GB RAM recommended

### Setup

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your API keys:

   ```bash
   # Required for Sesame CSM and HuggingFace models
   HUGGING_FACE_TOKEN=your_token_here

   # Optional: Add API keys for cloud LLM providers
   OPENAI_API_KEY=your_key_here
   ANTHROPIC_API_KEY=your_key_here
   OPENROUTER_API_KEY=your_key_here
   ```

3. Build and start all services:

   ```bash
   docker compose build
   docker compose up -d
   ```

4. Access the web interface at `http://localhost:8080`

### Docker Services

The system runs as 6 independent microservices:

- **STT Service** (Port 5001): Speech-to-text transcription
- **LLM Service** (Port 5002): Language model inference
- **TTS Service** (Port 5003): Text-to-speech synthesis
- **Memory Service** (Port 5004): Conversation storage
- **Orchestrator** (Port 5000): Coordinates all services
- **Web UI** (Port 8080): User interface

### Docker Commands

```bash
# View logs
docker compose logs -f

# Stop services
docker compose down

# Restart a specific service
docker compose restart tts

# View service status
docker compose ps
```

## Configuration

Configuration files are located in the project root:

- `config.py`: Main configuration file for all components
- `.env`: Environment variables for Docker deployment

Key configuration options:

- **STT**: Engine, model, language
- **LLM**: Provider, model, temperature
- **TTS**: Engine, voice, quality
- **Memory**: Storage type, history limits
- **Personality**: Default profile, custom profiles
- **UI**: Port, host, theme
- **System**: Log level, VRAM optimization

## Usage

### Web Interface

To start the web interface:

```bash
python main.py
```

By default, the interface will be available at <http://127.0.0.1:5000>.

You can customize the host and port:

```bash
python main.py --host 0.0.0.0 --port 8080
```

### Command Line Interface

To use the interactive command-line interface:

```bash
python main.py --cli
```

For a simple one-time exchange (useful for scripting):

```bash
python main.py --cli --non-interactive
```

## Features in Detail

### Speech-to-Text (STT)

The STT component uses OpenAI's Whisper model to transcribe spoken language into text. Features include:

- Multiple language support
- Automatic language detection
- Various model sizes (tiny, base, small, medium, large)
- CPU and CUDA acceleration

### Language Model (LLM)

The LLM component supports multiple providers and models:

- **OpenRouter**: Access to many models including DeepSeek, Llama, Claude
- **OpenAI**: GPT-3.5 and GPT-4
- **Anthropic**: Claude models
- **Local**: Run open-source models locally (e.g., Gemma, Llama)

### Text-to-Speech (TTS)

Multiple TTS engines are supported:

- **Sesame CSM**: Premium expressive synthesis with 0.6x real-time factor (8 speaker voices, requires HF token)
- **Chatterbox**: High-quality with voice cloning capability (30-second samples)
- **Orpheus**: Good quality with emotional tags (`<laugh>`, `<chuckle>`, `<sigh>`)
- **Higgs v2**: Highest quality but requires significant GPU memory (8GB+ VRAM)
- **XTTS v2**: Excellent multilingual support with voice cloning
- **Kokoro**: Lower resource requirements, optimized for limited VRAM

### Persistent Memory

Conversations are saved and can be retrieved later:

- JSON-based file storage
- Optional vector storage for semantic search
- Conversation summaries
- Memory management with automatic cleanup

### Personality Profiles

Customize how the AI responds:

- System prompts for different personalities
- Configurable speech characteristics (formality, humor, etc.)
- Custom voice selection per personality
- Custom greeting and farewell messages

### Voice Cloning

You can clone voices from short audio samples:

1. Record a voice sample (30 seconds recommended)
2. Upload through the web interface
3. The system will use the cloned voice for responses

### Continuous Mode

For a hands-free experience:

- System listens continuously
- Automatically processes speech when detected
- Streams responses in real-time

## Project Structure

```
TTS-LLM-TTS/
│
├── config.py               # Configuration settings
├── core.py                 # Core integration module
├── main.py                 # Entry point
│
├── stt/                    # Speech-to-Text components
│   ├── __init__.py
│   └── whisper_stt.py      # Whisper STT implementation
│
├── llm/                    # Language Model components
│   ├── __init__.py
│   └── llm_provider.py     # LLM provider implementations
│
├── tts/                    # Text-to-Speech components
│   ├── __init__.py
│   └── tts_provider.py     # TTS engine implementations
│
├── memory/                 # Memory components
│   ├── __init__.py
│   ├── memory_manager.py   # Persistent memory management
│   └── storage/            # Memory storage directory
│
├── personality/            # Personality components
│   ├── __init__.py
│   ├── profile_manager.py  # Personality profile management
│   └── profiles/           # Profile storage directory
│
├── ui/                     # User Interface
│   ├── __init__.py
│   ├── app.py              # Flask web application
│   ├── templates/          # HTML templates
│   └── static/             # Static assets (CSS, JS)
│
└── logs/                   # Log files directory
```

## Extending the System

### Adding a New LLM Provider

1. Modify `llm/llm_provider.py` to add a new provider
2. Implement the provider's API connection
3. Update `config.py` with new provider options

### Adding a New TTS Engine

1. Modify `tts/tts_provider.py` to add a new engine
2. Implement the engine's synthesis method
3. Update `config.py` with new engine options

### Creating Custom Personalities

Using the web interface:

1. Go to the System Status section
2. Click "Create New Personality"
3. Configure the personality parameters

Using code:

1. Create a new personality JSON file in the `personality/profiles` directory
2. Use the existing profiles as templates

## Troubleshooting

Common issues and solutions:

- **Audio device not found**: Ensure your microphone is properly connected and selected in your system settings.
- **Memory issues with large models**: Try reducing model sizes or enabling VRAM optimization in config.py.
- **API rate limits**: If using cloud LLMs, check API key usage limits with your provider.
- **Speech recognition issues**: Try speaking more clearly or using a higher quality microphone.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- OpenAI Whisper for speech recognition
- Various LLM providers
- TTS engine developers
- Flask and SocketIO for the web interface
