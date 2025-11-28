"""
Sesame CSM TTS Engine - Expressive speech synthesis
Based on senstella/csm-expressiva-1b model
"""
import os
import torch
import logging
from typing import Optional
import numpy as np

logger = logging.getLogger(__name__)

class SesameCsmTTS:
    """Sesame CSM TTS engine with expressive synthesis"""

    def __init__(self, config: dict):
        self.config = config
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = None
        self.processor = None
        self.sample_rate = 24000  # CSM default

    def lazy_load(self):
        """Lazy load model when first needed"""
        if self.model is not None:
            return

        try:
            logger.info("Loading Sesame CSM model...")
            from transformers import AutoModelForSeq2SeqLM, AutoProcessor

            model_name = "senstella/csm-expressiva-1b"

            # Require HuggingFace token
            hf_token = os.getenv('HUGGING_FACE_TOKEN')
            if not hf_token:
                raise ValueError("HUGGING_FACE_TOKEN required for Sesame CSM")

            # Load model
            self.processor = AutoProcessor.from_pretrained(
                model_name,
                use_auth_token=hf_token,
                cache_dir=self.config.get('model_cache_dir', './models/cache')
            )

            self.model = AutoModelForSeq2SeqLM.from_pretrained(
                model_name,
                use_auth_token=hf_token,
                cache_dir=self.config.get('model_cache_dir', './models/cache'),
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32
            ).to(self.device)

            self.model.eval()
            logger.info(f"Sesame CSM loaded on {self.device}")

        except Exception as e:
            logger.error(f"Failed to load Sesame CSM: {e}")
            raise

    def synthesize(self, text: str, speaker_id: int = 4, **kwargs) -> bytes:
        """
        Synthesize speech from text

        Args:
            text: Input text
            speaker_id: Speaker voice (default 4 for expressiva)
            **kwargs: Additional parameters

        Returns:
            Audio bytes (WAV format)
        """
        self.lazy_load()

        try:
            # Prepare inputs
            inputs = self.processor(
                text=text,
                return_tensors="pt",
                padding=True
            ).to(self.device)

            # Generate
            with torch.no_grad():
                output = self.model.generate(
                    **inputs,
                    speaker_id=speaker_id,
                    max_length=self.config.get('max_length', 1000),
                    do_sample=True,
                    temperature=self.config.get('temperature', 0.7)
                )

            # Convert to audio
            audio = self.processor.decode(output[0], skip_special_tokens=True)

            # Convert to WAV bytes
            audio_bytes = self._to_wav_bytes(audio)

            return audio_bytes

        except Exception as e:
            logger.error(f"Sesame CSM synthesis error: {e}")
            raise

    def synthesize_stream(self, text: str, speaker_id: int = 4, **kwargs):
        """
        Stream synthesis (generator)
        Note: CSM doesn't natively support streaming, so we chunk the output
        """
        self.lazy_load()

        # For now, generate full audio and yield in chunks
        audio_bytes = self.synthesize(text, speaker_id, **kwargs)

        # Yield in chunks
        chunk_size = self.config.get('stream_chunk_size', 4096)
        for i in range(0, len(audio_bytes), chunk_size):
            yield audio_bytes[i:i+chunk_size]

    def _to_wav_bytes(self, audio_array: np.ndarray) -> bytes:
        """Convert audio array to WAV bytes"""
        import io
        import wave

        # Ensure proper format
        if audio_array.dtype != np.int16:
            audio_array = (audio_array * 32767).astype(np.int16)

        # Create WAV file in memory
        buffer = io.BytesIO()
        with wave.open(buffer, 'wb') as wav_file:
            wav_file.setnchannels(1)  # Mono
            wav_file.setsampwidth(2)  # 16-bit
            wav_file.setframerate(self.sample_rate)
            wav_file.writeframes(audio_array.tobytes())

        return buffer.getvalue()

    def get_available_speakers(self):
        """Get list of available speaker IDs"""
        return list(range(8))  # CSM expressiva has 8 speakers
