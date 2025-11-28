"""
Text-to-Speech provider module.
This module provides a unified interface for different TTS engines.
"""

import os
import sys
import time
import tempfile
import subprocess
import threading
from pathlib import Path
from typing import Dict, List, Optional, Any, Union

# Handle both package and direct imports
try:
    from ..config import TTS_CONFIG, VOICE_SAMPLES_DIR
except ImportError:
    from config import TTS_CONFIG, VOICE_SAMPLES_DIR

# Optional imports that may not be used depending on configuration
try:
    import torch
    import numpy as np
    from pydub import AudioSegment
    from pydub.playback import play
    import soundfile as sf
    HAS_AUDIO_LIBS = True
except ImportError:
    HAS_AUDIO_LIBS = False


class TTSProvider:
    """
    A unified interface for different Text-to-Speech engines.
    Supports Chatterbox, Orpheus, Higgs, XTTS, and Kokoro.
    """

    def __init__(self, config: Dict = None):
        """
        Initialize the TTS provider with configuration settings.

        Args:
            config: Dictionary with configuration parameters
        """
        self.config = config or TTS_CONFIG
        self.engine = self.config["engine"].lower()
        self.voice = self.config["voice"]
        self.stream = self.config["stream"]
        self.speed = self.config["speed"]
        self.quality = self.config["quality"]
        self.voice_samples = self.config.get("voice_samples", [])

        # Features supported by specific engines
        self.features = self.config.get("features", {})
        self.voice_cloning = self.features.get("voice_cloning", False)
        self.emotion_tags = self.features.get("emotion_tags", False)

        # The TTS model - will be loaded on first use
        self._model = None
        self._is_streaming = False
        self._stop_streaming = threading.Event()
        self._audio_queue = []
        self._voice_sample_paths = []

        # Check if we have the necessary libs
        if not HAS_AUDIO_LIBS:
            print("Warning: Audio libraries not fully available. Install pydub, soundfile, and torch for full functionality.")

        # Initialize the engine
        self._initialize_engine()

    def _initialize_engine(self):
        """Set up the selected TTS engine."""
        print(f"Initializing TTS engine: {self.engine}")

        if self.engine == "chatterbox":
            self._initialize_chatterbox()
        elif self.engine == "orpheus":
            self._initialize_orpheus()
        elif self.engine == "higgs":
            self._initialize_higgs()
        elif self.engine == "xtts":
            self._initialize_xtts()
        elif self.engine == "kokoro":
            self._initialize_kokoro()
        elif self.engine == "sesame_csm":
            self._initialize_sesame_csm()
        else:
            raise ValueError(f"Unsupported TTS engine: {self.engine}")

        # Load voice samples if available and voice cloning is supported
        if self.voice_cloning and self.voice_samples:
            self._load_voice_samples()

    def _initialize_chatterbox(self):
        """Initialize the Chatterbox TTS engine."""
        try:
            import chatterbox
            from chatterbox.tts import TextToSpeech

            # Determine device
            device = "cuda" if torch.cuda.is_available() else "cpu"

            # Load chatterbox model - we load it lazily on first use
            self._model_class = TextToSpeech
            self._model_args = {
                "device": device,
                "quality": self.quality,
                "enable_voice_cloning": self.voice_cloning,
            }

            print(f"Chatterbox engine initialized (will load model on first use)")

        except ImportError:
            print("Error: Chatterbox package not installed. Install with 'pip install chatterbox'")
            raise

    def _initialize_orpheus(self):
        """Initialize the Orpheus TTS engine."""
        try:
            # Import appropriate libraries for Orpheus
            # Note: Orpheus external import might be different based on actual package
            # This is a placeholder for the actual Orpheus import structure
            import TTS
            from TTS.api import TTS as TTSModel

            # Orpheus parameters
            self._model_class = TTSModel
            self._model_args = {
                "model_name": "tts_models/en/ljspeech/tacotron2-DDC",
                "gpu": torch.cuda.is_available()
            }

            # Set up emotion tags
            self.emotion_tag_dict = self.config.get("emotion_tags", {})

            print(f"Orpheus engine initialized (will load model on first use)")

        except ImportError:
            print("Error: TTS package not installed. Install with 'pip install TTS'")
            raise

    def _initialize_higgs(self):
        """Initialize the Higgs TTS engine."""
        try:
            # This is a placeholder for actual Higgs initialization
            # Higgs typically requires more VRAM
            import TTS
            from TTS.api import TTS as TTSModel

            # Higgs parameters with higher quality model
            self._model_class = TTSModel
            self._model_args = {
                "model_name": "tts_models/en/vctk/vits",
                "gpu": torch.cuda.is_available()
            }

            print(f"Higgs engine initialized (will load model on first use)")

        except ImportError:
            print("Error: TTS package not installed. Install with 'pip install TTS'")
            raise

    def _initialize_xtts(self):
        """Initialize the XTTS engine."""
        try:
            # This is a placeholder for proper XTTS initialization
            import TTS
            from TTS.api import TTS as TTSModel

            # XTTS parameters
            self._model_class = TTSModel
            self._model_args = {
                "model_name": "tts_models/multilingual/multi-dataset/xtts_v2",
                "gpu": torch.cuda.is_available()
            }

            print(f"XTTS engine initialized (will load model on first use)")

        except ImportError:
            print("Error: TTS package not installed. Install with 'pip install TTS'")
            raise

    def _initialize_kokoro(self):
        """Initialize the Kokoro TTS engine."""
        try:
            # This is a placeholder for proper Kokoro initialization
            # Kokoro is optimized for lower VRAM usage
            import TTS
            from TTS.api import TTS as TTSModel

            # Kokoro parameters for lightweight usage
            self._model_class = TTSModel
            self._model_args = {
                "model_name": "tts_models/en/ljspeech/fast_pitch",
                "gpu": torch.cuda.is_available()
            }

            print(f"Kokoro engine initialized (will load model on first use)")

        except ImportError:
            print("Error: TTS package not installed. Install with 'pip install TTS'")
            raise

    def _initialize_sesame_csm(self):
        """Initialize the Sesame CSM TTS engine."""
        try:
            from .sesame_csm import SesameCsmTTS

            # Sesame CSM - expressive high-quality TTS
            self._model_class = SesameCsmTTS
            self._model_args = {
                "config": self.config
            }

            print(f"Sesame CSM engine initialized (will load model on first use)")

        except ImportError:
            print("Error: Sesame CSM dependencies not installed. Install with 'pip install transformers torch'")
            raise

    def _load_model(self):
        """Lazy-load the TTS model on first use."""
        if self._model is None:
            print(f"Loading {self.engine} model...")
            try:
                self._model = self._model_class(**self._model_args)
                print(f"TTS model loaded successfully")
            except Exception as e:
                print(f"Error loading TTS model: {e}")
                raise

    def _load_voice_samples(self):
        """Load voice sample files for cloning."""
        self._voice_sample_paths = []

        # Process provided voice samples
        for sample in self.voice_samples:
            if isinstance(sample, str):
                # Check if it's a path
                sample_path = Path(sample)
                if sample_path.exists() and sample_path.is_file():
                    self._voice_sample_paths.append(str(sample_path))
                else:
                    # Check in voice samples directory
                    voice_path = VOICE_SAMPLES_DIR / sample
                    if voice_path.exists() and voice_path.is_file():
                        self._voice_sample_paths.append(str(voice_path))
                    else:
                        print(f"Warning: Voice sample not found: {sample}")

        if not self._voice_sample_paths and self.voice_cloning:
            print("Warning: No valid voice samples found for cloning")
        else:
            print(f"Loaded {len(self._voice_sample_paths)} voice samples for cloning")

    def _process_text_with_emotion_tags(self, text):
        """Process text with emotion tags if supported by the engine."""
        if not self.emotion_tags:
            return text

        # The tags are already in the text, we just need to make sure
        # the engine supports them
        if self.engine == "orpheus":
            # Orpheus supports emotion tags natively
            return text
        else:
            # For other engines, we need to strip emotion tags
            processed_text = text
            for tag_name, tag_value in self.config["emotion_tags"].items():
                processed_text = processed_text.replace(tag_value, "")
            return processed_text

    def synthesize_speech(self, text, voice=None, output_file=None):
        """
        Synthesize speech from text.

        Args:
            text: The text to synthesize
            voice: Optional voice override
            output_file: Optional file to save the audio to

        Returns:
            Path to the generated audio file or None if streaming
        """
        if not text:
            print("Warning: Empty text provided, nothing to synthesize")
            return None

        # Process text for emotion tags if applicable
        processed_text = self._process_text_with_emotion_tags(text)

        # Use provided voice or default
        voice_to_use = voice or self.voice

        # Load model if not already loaded
        self._load_model()

        # Create output file if not provided
        temp_output = False
        if not output_file:
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
            output_file = temp_file.name
            temp_output = True
            temp_file.close()

        try:
            # Synthesize based on engine
            if self.engine == "chatterbox":
                self._synthesize_with_chatterbox(processed_text, voice_to_use, output_file)
            elif self.engine == "orpheus":
                self._synthesize_with_orpheus(processed_text, voice_to_use, output_file)
            elif self.engine == "sesame_csm":
                self._synthesize_with_sesame_csm(processed_text, voice_to_use, output_file)
            elif self.engine in ["higgs", "xtts", "kokoro"]:
                self._synthesize_with_tts(processed_text, voice_to_use, output_file)
            else:
                raise ValueError(f"Unsupported TTS engine: {self.engine}")

            # Stream audio if requested
            if self.stream:
                self._stream_audio(output_file)
                # If streaming, we don't return the file path since it's temporary
                if temp_output:
                    return None

            return output_file

        except Exception as e:
            print(f"Error synthesizing speech: {e}")
            if temp_output:
                try:
                    os.unlink(output_file)
                except OSError:
                    pass
            raise

    def _synthesize_with_chatterbox(self, text, voice, output_file):
        """Synthesize speech using Chatterbox."""
        # Prepare voice cloning if applicable
        voice_sample = None
        if self.voice_cloning and self._voice_sample_paths:
            voice_sample = self._voice_sample_paths[0]  # Use first sample

        # Generate speech
        self._model.synthesize(
            text=text,
            voice_samples=[voice_sample] if voice_sample else None,
            output_path=output_file,
            speed=self.speed
        )

    def _synthesize_with_orpheus(self, text, voice, output_file):
        """Synthesize speech using Orpheus."""
        # Orpheus supports emotion tags directly in the text

        # Generate speech
        wav = self._model.tts(
            text=text,
            speaker=voice if voice != "default" else None,
            speed=self.speed
        )

        # Save to file
        sf.write(output_file, wav, self._model.synthesizer.output_sample_rate)

    def _synthesize_with_sesame_csm(self, text, voice, output_file):
        """Synthesize speech using Sesame CSM."""
        # Parse speaker_id from voice parameter (default to 4 for expressiva)
        speaker_id = 4
        if voice and voice.isdigit():
            speaker_id = int(voice)

        # Generate speech using CSM
        audio_bytes = self._model.synthesize(text=text, speaker_id=speaker_id)

        # Save to file
        with open(output_file, 'wb') as f:
            f.write(audio_bytes)

    def _synthesize_with_tts(self, text, voice, output_file):
        """Synthesize speech using TTS-based engines (Higgs, XTTS, Kokoro)."""
        # Generate speech
        wav = self._model.tts(
            text=text,
            speaker=voice if voice != "default" else None,
            speed=self.speed
        )

        # Save to file
        sf.write(output_file, wav, self._model.synthesizer.output_sample_rate)

    def _stream_audio(self, audio_file):
        """Stream audio from file."""
        if not HAS_AUDIO_LIBS:
            print("Warning: Audio streaming not available without pydub")
            return

        # Load the audio file
        try:
            audio = AudioSegment.from_file(audio_file)

            # Play the audio
            play(audio)

        except Exception as e:
            print(f"Error streaming audio: {e}")

    def start_streaming(self):
        """Start streaming mode for continuous TTS."""
        if self._is_streaming:
            print("Already in streaming mode")
            return

        self._is_streaming = True
        self._stop_streaming.clear()
        self._audio_queue = []

        # Start the streaming thread
        self._stream_thread = threading.Thread(target=self._stream_worker)
        self._stream_thread.daemon = True
        self._stream_thread.start()

        print("Started TTS streaming mode")

    def stop_streaming(self):
        """Stop streaming mode."""
        if not self._is_streaming:
            return

        self._stop_streaming.set()
        if hasattr(self, '_stream_thread') and self._stream_thread:
            self._stream_thread.join(timeout=2.0)

        self._is_streaming = False
        print("Stopped TTS streaming mode")

    def _stream_worker(self):
        """Worker thread for streaming TTS."""
        while not self._stop_streaming.is_set():
            # Check if there's text in the queue
            if self._audio_queue:
                text = self._audio_queue.pop(0)

                # Synthesize and play
                try:
                    output_file = self.synthesize_speech(text, stream=False)
                    if output_file:
                        self._stream_audio(output_file)
                        # Delete the temporary file (ignore errors)
                        try:
                            os.unlink(output_file)
                        except OSError:
                            pass
                except Exception as e:
                    print(f"Error in TTS streaming: {e}")

            # Sleep a bit to prevent CPU hogging
            time.sleep(0.1)

    def stream_text(self, text):
        """Add text to the streaming queue."""
        if not self._is_streaming:
            self.start_streaming()

        self._audio_queue.append(text)

    def clone_voice(self, sample_file):
        """
        Clone a voice from an audio sample.

        Args:
            sample_file: Path to the audio sample file

        Returns:
            True if successful, False otherwise
        """
        if not self.voice_cloning:
            print(f"Voice cloning not supported by {self.engine} engine or disabled in config")
            return False

        sample_path = Path(sample_file)
        if not sample_path.exists() or not sample_path.is_file():
            print(f"Voice sample file not found: {sample_file}")
            return False

        # Add to voice samples
        self._voice_sample_paths.append(str(sample_path))

        # Copy to voice samples directory for persistence
        try:
            dest_path = VOICE_SAMPLES_DIR / sample_path.name
            if not dest_path.exists():
                import shutil
                shutil.copy2(sample_path, dest_path)
                print(f"Voice sample copied to: {dest_path}")
        except Exception as e:
            print(f"Warning: Could not copy voice sample: {e}")

        return True


# Simple usage example
if __name__ == "__main__":
    # Example usage
    tts = TTSProvider()

    text = "Hello, this is a test of the text-to-speech system."
    output_file = tts.synthesize_speech(text)

    print(f"Speech synthesized to: {output_file}")
