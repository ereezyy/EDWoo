# TTS-LLM-TTS Setup Guide

## 🎉 System Enhancements Complete

Your TTS-LLM-TTS system has been successfully enhanced with:

✅ **Docker Microservices Architecture** - Production-ready deployment
✅ **Sesame CSM TTS Engine** - High-quality expressive speech synthesis
✅ **Environment Configuration** - Easy API key management
✅ **Enhanced Documentation** - Complete deployment guides
✅ **Fixed Import Structure** - Works standalone and as a package

---

## ⚠️ Current Issue: Whisper Installation

The system detected a broken OpenAI Whisper installation. This needs to be fixed before running.

### Fix Whisper Installation

```powershell
# Uninstall any conflicting whisper packages
pip uninstall whisper openai-whisper -y

# Reinstall openai-whisper properly
pip install openai-whisper

# Verify installation
python -c "import whisper; print('Whisper installed successfully:', whisper.__version__)"
```

---

## 🚀 Quick Start (After Fixing Whisper)

### Option 1: Standalone Python

1. **Install dependencies:**

   ```powershell
   pip install -r requirements.txt
   ```

2. **Configure API keys (optional):**

   ```powershell
   copy .env.example .env
   notepad .env  # Add your API keys
   ```

3. **Run the web interface:**

   ```powershell
   python main.py
   ```

   Access at: <http://localhost:5000>

4. **Or run CLI mode:**

   ```powershell
   python main.py --cli
   ```

### Option 2: Docker Deployment (Recommended for Production)

1. **Prerequisites:**
   - Docker Desktop installed
   - NVIDIA GPU with CUDA support
   - NVIDIA Container Toolkit

2. **Setup:**

   ```powershell
   copy .env.example .env
   notepad .env  # Add HUGGING_FACE_TOKEN and other API keys
   ```

3. **Build and start:**

   ```powershell
   docker compose build
   docker compose up -d
   ```

   Access at: <http://localhost:8080>

4. **Manage services:**

   ```powershell
   docker compose logs -f       # View logs
   docker compose ps            # Check status
   docker compose down          # Stop all services
   docker compose restart tts   # Restart specific service
   ```

---

## 📦 New Features

### Sesame CSM TTS Engine

- **Location:** `tts/sesame_csm.py`
- **Model:** senstella/csm-expressiva-1b
- **Performance:** 0.6x real-time factor (very fast!)
- **Voices:** 8 different speaker voices
- **Requirements:** HuggingFace token (add to .env)

**To use Sesame CSM:**

1. Get HuggingFace token from <https://huggingface.co/settings/tokens>
2. Add to `.env`: `HUGGING_FACE_TOKEN=your_token_here`
3. In `config.py`, set TTS engine to `"sesame_csm"`

### Docker Microservices

- **STT Service** (Port 5001): Speech-to-text transcription
- **LLM Service** (Port 5002): Language model inference
- **TTS Service** (Port 5003): Text-to-speech synthesis
- **Memory Service** (Port 5004): Conversation storage
- **Orchestrator** (Port 5000): Service coordination
- **Web UI** (Port 8080): User interface

Each service runs independently and can be scaled or updated without affecting others.

---

## 🔧 Configuration

### Edit `config.py` to customize

**TTS Engines Available:**

- `"sesame_csm"` - NEW! Premium expressive synthesis
- `"chatterbox"` - Voice cloning with 30-second samples
- `"orpheus"` - Emotion tags support (<laugh>, <sigh>)
- `"higgs"` - Highest quality (8GB+ VRAM)
- `"xtts"` - Multilingual support
- `"kokoro"` - Low VRAM option

**LLM Providers:**

- `"openrouter"` - Free models (DeepSeek, Llama)
- `"openai"` - GPT models
- `"anthropic"` - Claude models
- `"local"` - Run models locally

---

## 🐛 Troubleshooting

### Whisper Import Error

**Symptom:** `TypeError: argument of type 'NoneType' is not iterable`
**Solution:** Reinstall openai-whisper (see above)

### CUDA/GPU Issues

**Symptom:** GPU not detected
**Solution:**

- Install NVIDIA drivers
- Install CUDA toolkit
- For Docker: Install NVIDIA Container Toolkit

### Port Already in Use

**Symptom:** Port 5000 or 8080 already in use
**Solution:** Change ports in `config.py` or `.env`

### API Rate Limits

**Symptom:** API requests failing
**Solution:** Check API key limits with your provider

---

## 📚 Documentation

- **README.md** - Overview and features
- **SETUP_GUIDE.md** - This file
- **.env.example** - Environment variable template
- **docker-compose.yml** - Docker service definitions

---

## 🎯 Test the System

After fixing Whisper, run the import test:

```powershell
python test_imports.py
```

You should see:

```
✅ All imports successful! The system structure is correct.
```

---

## 💡 Next Steps

1. **Fix Whisper installation** (see above)
2. **Test imports:** `python test_imports.py`
3. **Choose deployment method:** Standalone Python or Docker
4. **Configure API keys** in `.env` file
5. **Start the system:** `python main.py` or `docker compose up`
6. **Explore features:** Try different TTS engines, personalities, voice cloning

---

## 🌟 Enjoy Your Enhanced Voice Assistant

Your system now has enterprise-grade features with the simplicity of a standalone app. Choose the deployment that fits your needs!
