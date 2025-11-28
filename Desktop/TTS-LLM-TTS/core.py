"""
Core integration module for TTS-LLM-TTS.
This module integrates all components (STT, LLM, TTS, Memory, Personality)
into a cohesive system.
"""

import os
import time
import asyncio
import threading
import uuid
from typing import Dict, List, Optional, Any, Callable, Union
from pathlib import Path

from config import (
    STT_CONFIG,
    LLM_CONFIG,
    TTS_CONFIG,
    MEMORY_CONFIG,
    PERSONALITY_CONFIG
)
from stt import WhisperSTT
from llm import LLMProvider
from tts import TTSProvider
from memory import MemoryManager
from personality import ProfileManager


class TTSLLMTTSCore:
    """
    Core integration class for the TTS-LLM-TTS system.
    Coordinates all components and handles the main conversation flow.
    """

    def __init__(self,
                 stt_config=None,
                 llm_config=None,
                 tts_config=None,
                 memory_config=None,
                 personality_config=None):
        """
        Initialize the TTS-LLM-TTS core with all components.

        Args:
            stt_config: Configuration for speech-to-text
            llm_config: Configuration for language model
            tts_config: Configuration for text-to-speech
            memory_config: Configuration for memory
            personality_config: Configuration for personality
        """
        print("Initializing TTS-LLM-TTS core...")

        # Initialize components
        self.stt = WhisperSTT(stt_config or STT_CONFIG)
        self.llm = LLMProvider(llm_config or LLM_CONFIG)
        self.tts = TTSProvider(tts_config or TTS_CONFIG)
        self.memory = MemoryManager(memory_config or MEMORY_CONFIG)
        self.personality = ProfileManager(personality_config or PERSONALITY_CONFIG)

        # Set up conversation state
        self.current_conversation_id = None
        self.is_active = False
        self.stop_event = threading.Event()
        self.continuous_mode = False
        self.response_callback = None

        print("TTS-LLM-TTS core initialized successfully")

    def start_new_conversation(self) -> str:
        """
        Start a new conversation session.

        Returns:
            Conversation ID
        """
        # Create a new conversation in memory
        self.current_conversation_id = self.memory.create_new_conversation()

        # Get greeting from active personality
        greeting = self.personality.get_greeting()

        # Initial message list with system prompt from personality
        system_prompt = self.personality.get_system_prompt()
        messages = [
            {"role": "system", "content": system_prompt}
        ]

        # Store the initial messages
        self.memory.save_conversation(self.current_conversation_id, messages)

        # Speak the greeting
        self.tts.synthesize_speech(greeting)

        print(f"Started new conversation: {self.current_conversation_id}")
        return self.current_conversation_id

    def use_conversation(self, conversation_id: str) -> bool:
        """
        Use an existing conversation.

        Args:
            conversation_id: ID of conversation to use

        Returns:
            True if successful, False otherwise
        """
        conversation = self.memory.load_conversation(conversation_id)
        if not conversation:
            print(f"Conversation {conversation_id} not found")
            return False

        self.current_conversation_id = conversation_id
        print(f"Using conversation: {self.current_conversation_id}")
        return True

    def process_text_input(self, text: str, stream: bool = False) -> str:
        """
        Process text input from the user.

        Args:
            text: User's text input
            stream: Whether to stream the response

        Returns:
            Response text from LLM
        """
        if not self.current_conversation_id:
            self.start_new_conversation()

        # Get the current conversation history
        conversation = self.memory.load_conversation(self.current_conversation_id)
        messages = conversation.get("messages", [])

        # Apply personality to the user's input
        modified_text = self.personality.apply_profile_to_prompt(text)

        # Add user message to history
        messages.append({"role": "user", "content": text})

        # Stream response if requested
        response_content = ""

        def response_streamer(content_chunk):
            nonlocal response_content
            response_content += content_chunk
            if stream and self.response_callback:
                self.response_callback(content_chunk, False)

        # Generate response from LLM
        response = self.llm.generate(
            messages=messages,
            stream=stream,
            callback=response_streamer if stream else None
        )

        if not stream:
            response_content = response.get("content", "")

        # Add assistant response to history
        assistant_message = {"role": "assistant", "content": response_content}
        messages.append(assistant_message)

        # Save updated conversation
        self.memory.save_conversation(self.current_conversation_id, messages)

        # Synthesize speech from the response
        if self.tts and not self.continuous_mode:
            self.tts.synthesize_speech(response_content)

        return response_content

    async def process_text_input_async(self, text: str, stream: bool = True) -> str:
        """
        Process text input asynchronously.

        Args:
            text: User's text input
            stream: Whether to stream the response

        Returns:
            Response text from LLM
        """
        if not self.current_conversation_id:
            self.start_new_conversation()

        # Get the current conversation history
        conversation = self.memory.load_conversation(self.current_conversation_id)
        messages = conversation.get("messages", [])

        # Apply personality to the user's input
        modified_text = self.personality.apply_profile_to_prompt(text)

        # Add user message to history
        messages.append({"role": "user", "content": text})

        # Stream response if requested
        response_content = ""

        def response_streamer(content_chunk):
            nonlocal response_content
            response_content += content_chunk
            if stream and self.response_callback:
                self.response_callback(content_chunk, False)

        # Generate response from LLM asynchronously
        response = await self.llm.generate_async(
            messages=messages,
            stream=stream,
            callback=response_streamer if stream else None
        )

        if not stream:
            response_content = response.get("content", "")

        # Add assistant response to history
        assistant_message = {"role": "assistant", "content": response_content}
        messages.append(assistant_message)

        # Save updated conversation
        self.memory.save_conversation(self.current_conversation_id, messages)

        # Synthesize speech from the response if not in continuous mode
        if self.tts and not self.continuous_mode:
            # Use a background thread for TTS to avoid blocking
            tts_thread = threading.Thread(
                target=self.tts.synthesize_speech,
                args=(response_content,)
            )
            tts_thread.daemon = True
            tts_thread.start()

        return response_content

    def listen_and_respond(self, timeout: int = 10, stream: bool = False) -> str:
        """
        Listen for user input, process it, and respond.

        Args:
            timeout: Maximum recording time in seconds
            stream: Whether to stream the response

        Returns:
            Response text from LLM
        """
        if not self.current_conversation_id:
            self.start_new_conversation()

        print(f"Listening for {timeout} seconds...")

        # Record and transcribe audio
        text = self.stt.listen_and_transcribe(timeout=timeout)

        if not text:
            print("Nothing heard or recognized.")
            return ""

        print(f"User said: {text}")

        # Process the transcribed text
        return self.process_text_input(text, stream=stream)

    def start_continuous_conversation(self, response_callback: Callable[[str, bool], None] = None):
        """
        Start a continuous conversation loop with streaming responses.

        Args:
            response_callback: Function to call with response chunks and is_final flag
        """
        if self.is_active:
            print("Continuous conversation already active")
            return

        if not self.current_conversation_id:
            self.start_new_conversation()

        self.is_active = True
        self.stop_event.clear()
        self.continuous_mode = True
        self.response_callback = response_callback

        # Start the conversation loop in a background thread
        self._conversation_thread = threading.Thread(target=self._continuous_conversation_loop)
        self._conversation_thread.daemon = True
        self._conversation_thread.start()

        print("Continuous conversation started")

    def _continuous_conversation_loop(self):
        """Background thread for continuous conversation."""

        # Set up streaming for TTS
        if self.tts:
            self.tts.start_streaming()

        def handle_transcription(text):
            if not text or self.stop_event.is_set():
                return

            print(f"User said: {text}")

            # Process the text
            async def process_async():
                response = await self.process_text_input_async(text, stream=True)
                if self.response_callback:
                    self.response_callback("", True)  # Signal completion

                # Stream the response to TTS
                if self.tts:
                    self.tts.stream_text(response)

            # Run the async function in the background
            asyncio.run(process_async())

        # Use STT in continuous mode
        self.stt.transcribe_continuous(
            callback=handle_transcription,
            stop_event=self.stop_event
        )

        # Stop TTS streaming when done
        if self.tts:
            self.tts.stop_streaming()

        self.is_active = False
        print("Continuous conversation stopped")

    def stop_continuous_conversation(self):
        """Stop the continuous conversation."""
        if not self.is_active:
            return

        self.stop_event.set()
        if hasattr(self, '_conversation_thread'):
            self._conversation_thread.join(timeout=2.0)

        self.continuous_mode = False
        self.is_active = False
        print("Continuous conversation stopping...")

    def change_personality(self, profile_name: str) -> bool:
        """
        Change the active personality profile.

        Args:
            profile_name: Name of the profile to activate

        Returns:
            True if successful, False otherwise
        """
        success = self.personality.set_active_profile(profile_name)

        if success and self.current_conversation_id:
            # Update system prompt in conversation
            conversation = self.memory.load_conversation(self.current_conversation_id)
            messages = conversation.get("messages", [])

            # Replace system message if it exists or add it
            system_prompt = self.personality.get_system_prompt()
            system_index = None

            for i, message in enumerate(messages):
                if message.get("role") == "system":
                    system_index = i
                    break

            if system_index is not None:
                messages[system_index]["content"] = system_prompt
            else:
                messages.insert(0, {"role": "system", "content": system_prompt})

            # Save updated conversation
            self.memory.save_conversation(self.current_conversation_id, messages)

            # Announce the change
            greeting = self.personality.get_greeting()
            if self.tts:
                self.tts.synthesize_speech(greeting)

        return success

    def search_memory(self, query: str, limit: int = 5) -> List[Dict]:
        """
        Search conversation memory for relevant messages.

        Args:
            query: Search query
            limit: Maximum number of results

        Returns:
            List of matching message snippets with context
        """
        return self.memory.search_conversations(query, limit=limit)

    def get_conversation_summary(self) -> str:
        """
        Get a summary of the current conversation.

        Returns:
            Summary of the conversation
        """
        if not self.current_conversation_id:
            return "No active conversation"

        return self.memory.summarize_conversation(self.current_conversation_id)

    def list_available_personalities(self) -> List[Dict]:
        """
        Get a list of available personality profiles.

        Returns:
            List of personality profile info
        """
        return self.personality.get_all_profiles()

    def clone_voice(self, sample_file: str) -> bool:
        """
        Clone a voice from an audio sample for the TTS system.

        Args:
            sample_file: Path to the audio sample file

        Returns:
            True if successful, False otherwise
        """
        if not self.tts:
            return False

        return self.tts.clone_voice(sample_file)

    def set_tts_voice(self, voice: str) -> bool:
        """
        Set the TTS voice to use.

        Args:
            voice: Name of the voice to use

        Returns:
            True if successful, False otherwise
        """
        if not self.tts:
            return False

        self.tts.voice = voice
        return True


# Basic usage example
if __name__ == "__main__":
    # Example usage
    core = TTSLLMTTSCore()

    # Start a new conversation
    conversation_id = core.start_new_conversation()

    # Process text input
    response = core.process_text_input("Hello, how are you today?")
    print(f"Response: {response}")

    # Change personality
    core.change_personality("creative")

    # Process another input
    response = core.process_text_input("Tell me a short story about a robot.")
    print(f"Response: {response}")
