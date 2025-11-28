"""
Whisper-based Speech-to-Text processing module.
This module handles audio capture and transcription using OpenAI's Whisper model.
"""

import os
import tempfile
import time
import wave
import threading
import queue
import numpy as np
import torch
import sounddevice as sd
import whisper
from pydub import AudioSegment

# Handle both package and direct imports
try:
    from ..config import STT_CONFIG
except ImportError:
    from config import STT_CONFIG


class WhisperSTT:
    """Speech-to-Text transcription using Whisper."""

    def __init__(self, config=None):
        """Initialize the WhisperSTT module with the provided configuration."""
        self.config = config or STT_CONFIG
        self.device = self.config["device"]
        self.model_name = self.config["whisper_model"]
        self.language = self.config["language"]
        self.sample_rate = self.config["sample_rate"]
        self.energy_threshold = self.config["energy_threshold"]
        self.device_index = self.config["device_index"]

        # Load the model lazily when first needed to save memory
        self._model = None
        self._recording = False
        self._audio_queue = queue.Queue()
        self._recording_thread = None

    @property
    def model(self):
        """Lazy-load the Whisper model when first accessed."""
        if self._model is None:
            print(f"Loading Whisper model '{self.model_name}'...")
            self._model = whisper.load_model(
                self.model_name,
                device=self.device if torch.cuda.is_available() else "cpu"
            )
            print(f"Whisper model '{self.model_name}' loaded successfully.")
        return self._model

    def start_recording(self):
        """Start recording audio from the microphone."""
        if self._recording:
            print("Already recording.")
            return

        self._recording = True
        self._audio_queue = queue.Queue()
        self._recording_thread = threading.Thread(target=self._record_audio)
        self._recording_thread.daemon = True
        self._recording_thread.start()
        print("Recording started. Speak now...")

    def stop_recording(self):
        """Stop recording audio from the microphone."""
        if not self._recording:
            print("Not recording.")
            return

        self._recording = False
        if self._recording_thread:
            self._recording_thread.join(timeout=2.0)

        print("Recording stopped.")

    def _record_audio(self):
        """Record audio from the microphone and put it in the queue."""
        def audio_callback(indata, frames, time, status):
            if status:
                print(f"Audio callback status: {status}")
            # Convert to float32 if not already
            audio_data = indata.copy()
            if audio_data.dtype != np.float32:
                audio_data = audio_data.astype(np.float32)

            # Check if audio is above energy threshold
            energy = np.sqrt(np.mean(audio_data**2))
            if energy * 10000 > self.energy_threshold:  # Scale for better sensitivity
                self._audio_queue.put(audio_data)

        try:
            with sd.InputStream(
                samplerate=self.sample_rate,
                channels=1,
                callback=audio_callback,
                blocksize=1024,
                device=self.device_index
            ):
                while self._recording:
                    time.sleep(0.1)
        except Exception as e:
            print(f"Error in audio recording: {e}")
            self._recording = False

    def _save_audio_to_file(self):
        """Save recorded audio from the queue to a temporary file."""
        if self._audio_queue.empty():
            print("No audio recorded.")
            return None

        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            temp_filename = temp_file.name

        # Get all audio chunks from the queue
        audio_chunks = []
        while not self._audio_queue.empty():
            try:
                chunk = self._audio_queue.get_nowait()
                audio_chunks.append(chunk)
            except queue.Empty:
                break

        if not audio_chunks:
            return None

        # Concatenate all chunks
        audio_data = np.vstack(audio_chunks)

        # Save to WAV file
        with wave.open(temp_filename, 'w') as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)  # 16-bit audio
            wf.setframerate(self.sample_rate)
            audio_int16 = (audio_data * 32767).astype(np.int16)
            wf.writeframes(audio_int16.tobytes())

        return temp_filename

    def transcribe_file(self, audio_file):
        """Transcribe an audio file using Whisper."""
        try:
            # Convert audio to the format required by Whisper if needed
            audio = whisper.load_audio(audio_file)
            audio = whisper.pad_or_trim(audio)

            # Make log-Mel spectrogram
            mel = whisper.log_mel_spectrogram(audio).to(self.device)

            # Detect language if not specified
            if self.language == "auto":
                _, probs = self.model.detect_language(mel)
                detected_lang = max(probs, key=probs.get)
                print(f"Detected language: {detected_lang}")
            else:
                detected_lang = self.language

            # Decode with the Whisper model
            options = whisper.DecodingOptions(
                language=detected_lang if detected_lang != "auto" else None,
                fp16=torch.cuda.is_available()
            )
            result = whisper.decode(self.model, mel, options)

            # Return the transcribed text
            return result.text

        except Exception as e:
            print(f"Error transcribing audio: {e}")
            return ""

    def listen_and_transcribe(self, timeout=10):
        """
        Start recording, listen for a specified timeout, then transcribe.

        Args:
            timeout: Maximum recording time in seconds

        Returns:
            Transcribed text
        """
        self.start_recording()

        # Wait for the specified timeout
        time.sleep(timeout)

        # Stop recording
        self.stop_recording()

        # Save audio and transcribe
        audio_file = self._save_audio_to_file()
        if audio_file:
            transcription = self.transcribe_file(audio_file)
            # Cleanup temporary file (ignore errors - file may not exist)
            try:
                os.unlink(audio_file)
            except OSError:
                pass
            return transcription

        return ""

    def transcribe_continuous(self, callback, stop_event=None):
        """
        Continuously record and transcribe audio until stop_event is set.

        Args:
            callback: Function to call with transcribed text
            stop_event: Threading event to signal when to stop recording
        """
        if stop_event is None:
            stop_event = threading.Event()

        self.start_recording()

        while not stop_event.is_set():
            # Record for a short period
            time.sleep(5)  # Record 5 seconds at a time

            # Temporarily pause recording to process audio
            was_recording = self._recording
            if was_recording:
                self.stop_recording()

            # Save and transcribe
            audio_file = self._save_audio_to_file()
            if audio_file and os.path.getsize(audio_file) > 0:
                transcription = self.transcribe_file(audio_file)
                if transcription.strip():  # Only if there's actual text
                    callback(transcription)
                # Cleanup (ignore errors - file may not exist)
                try:
                    os.unlink(audio_file)
                except OSError:
                    pass

            # Resume recording if it was active
            if was_recording and not stop_event.is_set():
                self.start_recording()

        # Ensure recording is stopped
        self.stop_recording()


# Simple usage example
if __name__ == "__main__":
    # Example usage
    stt = WhisperSTT()

    print("Say something...")
    text = stt.listen_and_transcribe(timeout=5)
    print(f"You said: {text}")
