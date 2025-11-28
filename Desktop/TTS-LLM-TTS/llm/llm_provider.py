"""
Language Model Provider module.
This module provides a unified interface for different LLM backends.
"""

import os
import json
import time
import requests
from typing import Dict, List, Optional, Any, Union

# Handle both package and direct imports
try:
    from ..config import LLM_CONFIG, LOCAL_LLM_CONFIG
except ImportError:
    from config import LLM_CONFIG, LOCAL_LLM_CONFIG

# Optional imports that may not be used depending on configuration
try:
    import openai
except ImportError:
    openai = None

try:
    import anthropic
except ImportError:
    anthropic = None

try:
    import transformers
    from transformers import AutoModelForCausalLM, AutoTokenizer
    from transformers import TextIteratorStreamer
    import torch
    HAS_TRANSFORMERS = True
except ImportError:
    HAS_TRANSFORMERS = False


class LLMProvider:
    """
    A unified interface for different LLM providers.
    Supports OpenAI, Anthropic, OpenRouter, and local models.
    """

    def __init__(self, config: Dict = None):
        """
        Initialize the LLM provider with configuration settings.

        Args:
            config: Dictionary with configuration parameters
        """
        self.config = config or LLM_CONFIG
        self.provider = self.config["provider"]
        self.model = self.config["model"]
        self.fallback_model = self.config["fallback_model"]
        self.temperature = self.config["temperature"]
        self.max_tokens = self.config["max_tokens"]
        self.api_key = self.config["api_key"]
        self.api_base = self.config["api_base"]
        self.use_local = self.config["use_local"]

        # For local models
        self.local_model = None
        self.local_tokenizer = None

        # Load API keys from environment if not in config
        if self.provider == "openai" and not self.api_key:
            self.api_key = os.getenv("OPENAI_API_KEY", "")
        elif self.provider == "anthropic" and not self.api_key:
            self.api_key = os.getenv("ANTHROPIC_API_KEY", "")
        elif self.provider == "openrouter" and not self.api_key:
            self.api_key = os.getenv("OPENROUTER_API_KEY", "")

        # Initialize the selected provider
        self._initialize_provider()

    def _initialize_provider(self):
        """Setup the selected LLM provider."""

        if self.use_local:
            self._initialize_local_model()
            return

        if self.provider == "openai":
            if not openai:
                raise ImportError("OpenAI package not installed. Please install with 'pip install openai'")
            openai.api_key = self.api_key
            if self.api_base:
                openai.api_base = self.api_base

        elif self.provider == "anthropic":
            if not anthropic:
                raise ImportError("Anthropic package not installed. Please install with 'pip install anthropic'")
            self.anthropic_client = anthropic.Anthropic(api_key=self.api_key)

        elif self.provider == "openrouter":
            # OpenRouter uses requests directly, no specific initialization needed
            if not self.api_key:
                raise ValueError("OpenRouter API key is required")

        else:
            raise ValueError(f"Unsupported provider: {self.provider}")

    def _initialize_local_model(self):
        """Initialize a local model using HuggingFace Transformers."""
        if not HAS_TRANSFORMERS:
            raise ImportError(
                "Transformers package not installed. Please install with "
                "'pip install transformers torch'"
            )

        local_config = LOCAL_LLM_CONFIG
        model_name = local_config["model_name"]
        model_path = local_config["model_path"] or model_name

        print(f"Loading local model: {model_name}")

        # Device configuration
        if torch.cuda.is_available():
            print(f"CUDA available: {torch.cuda.device_count()} devices")
            device = "cuda"
        else:
            print("CUDA not available, falling back to CPU")
            device = "cpu"

        # Get model configuration
        load_in_8bit = local_config.get("load_in_8bit", False)
        load_in_4bit = local_config.get("load_in_4bit", False)
        device_map = local_config.get("device_map", "auto")

        # Load model with optimizations
        try:
            if load_in_8bit:
                self.local_model = AutoModelForCausalLM.from_pretrained(
                    model_path,
                    device_map=device_map,
                    load_in_8bit=True,
                    torch_dtype=torch.float16
                )
            elif load_in_4bit:
                self.local_model = AutoModelForCausalLM.from_pretrained(
                    model_path,
                    device_map=device_map,
                    load_in_4bit=True,
                    torch_dtype=torch.float16
                )
            else:
                self.local_model = AutoModelForCausalLM.from_pretrained(
                    model_path,
                    device_map=device_map,
                    torch_dtype=torch.float16 if device == "cuda" else torch.float32
                )

            # Load tokenizer
            self.local_tokenizer = AutoTokenizer.from_pretrained(model_path)
            if not self.local_tokenizer.pad_token:
                self.local_tokenizer.pad_token = self.local_tokenizer.eos_token

            print(f"Local model {model_name} loaded successfully")

        except Exception as e:
            print(f"Error loading local model: {e}")
            raise

    def _format_messages_for_provider(self, messages: List[Dict]) -> Union[List[Dict], str]:
        """
        Format the messages according to the provider's requirements.

        Args:
            messages: List of message dictionaries with 'role' and 'content'

        Returns:
            Formatted messages for the current provider
        """
        if self.provider in ["openai", "openrouter"]:
            # These providers use the standard ChatML format
            return messages

        elif self.provider == "anthropic":
            # Convert messages to Anthropic's format (for older SDK versions)
            system_message = None
            formatted_messages = []

            for msg in messages:
                if msg["role"] == "system":
                    system_message = msg["content"]
                elif msg["role"] == "user":
                    formatted_messages.append({"role": "user", "content": msg["content"]})
                elif msg["role"] == "assistant":
                    formatted_messages.append({"role": "assistant", "content": msg["content"]})
                # Ignore other roles

            return formatted_messages, system_message

        elif self.use_local:
            # Format for local models, typically a prompt string
            formatted_prompt = ""
            system_content = None

            # Extract system message if present
            for msg in messages:
                if msg["role"] == "system":
                    system_content = msg["content"]
                    break

            # Start with system message if available
            if system_content:
                formatted_prompt += f"SYSTEM: {system_content}\n\n"

            # Add conversation messages
            for msg in messages:
                if msg["role"] == "user":
                    formatted_prompt += f"USER: {msg['content']}\n"
                elif msg["role"] == "assistant":
                    formatted_prompt += f"ASSISTANT: {msg['content']}\n"

            # Add final assistant prefix
            formatted_prompt += "ASSISTANT: "

            return formatted_prompt

        else:
            raise ValueError(f"Unsupported provider: {self.provider}")

    async def generate_async(self,
                     messages: List[Dict],
                     temperature: float = None,
                     max_tokens: int = None,
                     stream: bool = False,
                     callback=None) -> Dict:
        """
        Asynchronously generate a response from the language model.

        Args:
            messages: List of message dictionaries
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens to generate
            stream: Whether to stream the response
            callback: Callback function for streaming responses

        Returns:
            Response from the model
        """
        # Use provided parameters or fall back to defaults
        temperature = temperature if temperature is not None else self.temperature
        max_tokens = max_tokens if max_tokens is not None else self.max_tokens

        try:
            if self.use_local:
                # Local model generation is synchronous
                return await self._generate_local(messages, temperature, max_tokens, stream, callback)

            if self.provider == "openai":
                return await self._generate_openai_async(messages, temperature, max_tokens, stream, callback)

            elif self.provider == "anthropic":
                return await self._generate_anthropic_async(messages, temperature, max_tokens, stream, callback)

            elif self.provider == "openrouter":
                return await self._generate_openrouter_async(messages, temperature, max_tokens, stream, callback)

            else:
                raise ValueError(f"Unsupported provider: {self.provider}")

        except Exception as e:
            print(f"Error generating response with {self.provider}: {str(e)}")
            # Try fallback model if configured
            if self.fallback_model and self.model != self.fallback_model:
                print(f"Trying fallback model: {self.fallback_model}")
                original_model = self.model
                self.model = self.fallback_model
                try:
                    result = await self.generate_async(messages, temperature, max_tokens, stream, callback)
                    return result
                finally:
                    # Restore original model
                    self.model = original_model

            # Re-raise the exception if no fallback or fallback failed
            raise

    def generate(self,
                 messages: List[Dict],
                 temperature: float = None,
                 max_tokens: int = None,
                 stream: bool = False,
                 callback=None) -> Dict:
        """
        Synchronously generate a response from the language model.

        Args:
            messages: List of message dictionaries
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens to generate
            stream: Whether to stream the response
            callback: Callback function for streaming responses

        Returns:
            Response from the model
        """
        # Use provided parameters or fall back to defaults
        temperature = temperature if temperature is not None else self.temperature
        max_tokens = max_tokens if max_tokens is not None else self.max_tokens

        try:
            if self.use_local:
                return self._generate_local(messages, temperature, max_tokens, stream, callback)

            if self.provider == "openai":
                return self._generate_openai(messages, temperature, max_tokens, stream, callback)

            elif self.provider == "anthropic":
                return self._generate_anthropic(messages, temperature, max_tokens, stream, callback)

            elif self.provider == "openrouter":
                return self._generate_openrouter(messages, temperature, max_tokens, stream, callback)

            else:
                raise ValueError(f"Unsupported provider: {self.provider}")

        except Exception as e:
            print(f"Error generating response with {self.provider}: {str(e)}")
            # Try fallback model if configured
            if self.fallback_model and self.model != self.fallback_model:
                print(f"Trying fallback model: {self.fallback_model}")
                original_model = self.model
                self.model = self.fallback_model
                try:
                    result = self.generate(messages, temperature, max_tokens, stream, callback)
                    return result
                finally:
                    # Restore original model
                    self.model = original_model

            # Re-raise the exception if no fallback or fallback failed
            raise

    def _generate_openai(self, messages, temperature, max_tokens, stream, callback):
        """Generate response using OpenAI API."""
        if not openai:
            raise ImportError("OpenAI package not installed")

        formatted_messages = self._format_messages_for_provider(messages)

        response = openai.ChatCompletion.create(
            model=self.model,
            messages=formatted_messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=stream
        )

        if stream and callback:
            collected_content = []
            for chunk in response:
                if hasattr(chunk, 'choices') and len(chunk.choices) > 0:
                    if hasattr(chunk.choices[0], 'delta'):
                        delta = chunk.choices[0].delta
                        if hasattr(delta, 'content') and delta.content:
                            content = delta.content
                            collected_content.append(content)
                            callback(content)

            return {"content": "".join(collected_content), "provider": "openai", "model": self.model}

        elif stream:
            # Collect streaming content if no callback is provided
            collected_content = []
            for chunk in response:
                if hasattr(chunk, 'choices') and len(chunk.choices) > 0:
                    if hasattr(chunk.choices[0], 'delta'):
                        delta = chunk.choices[0].delta
                        if hasattr(delta, 'content') and delta.content:
                            collected_content.append(delta.content)

            return {"content": "".join(collected_content), "provider": "openai", "model": self.model}

        else:
            # Non-streaming response
            content = response.choices[0].message.content
            return {"content": content, "provider": "openai", "model": self.model}

    async def _generate_openai_async(self, messages, temperature, max_tokens, stream, callback):
        """Generate response asynchronously using OpenAI API."""
        if not openai:
            raise ImportError("OpenAI package not installed")

        formatted_messages = self._format_messages_for_provider(messages)

        response = await openai.ChatCompletion.acreate(
            model=self.model,
            messages=formatted_messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=stream
        )

        if stream and callback:
            collected_content = []
            async for chunk in response:
                if hasattr(chunk, 'choices') and len(chunk.choices) > 0:
                    if hasattr(chunk.choices[0], 'delta'):
                        delta = chunk.choices[0].delta
                        if hasattr(delta, 'content') and delta.content:
                            content = delta.content
                            collected_content.append(content)
                            callback(content)

            return {"content": "".join(collected_content), "provider": "openai", "model": self.model}

        elif stream:
            # Collect streaming content if no callback is provided
            collected_content = []
            async for chunk in response:
                if hasattr(chunk, 'choices') and len(chunk.choices) > 0:
                    if hasattr(chunk.choices[0], 'delta'):
                        delta = chunk.choices[0].delta
                        if hasattr(delta, 'content') and delta.content:
                            collected_content.append(delta.content)

            return {"content": "".join(collected_content), "provider": "openai", "model": self.model}

        else:
            # Non-streaming response
            content = response.choices[0].message.content
            return {"content": content, "provider": "openai", "model": self.model}

    def _generate_anthropic(self, messages, temperature, max_tokens, stream, callback):
        """Generate response using Anthropic API."""
        if not anthropic:
            raise ImportError("Anthropic package not installed")

        # Format the messages
        formatted_messages, system_message = self._format_messages_for_provider(messages)

        # Create the completion
        response = self.anthropic_client.messages.create(
            model=self.model,
            messages=formatted_messages,
            system=system_message,
            max_tokens=max_tokens,
            temperature=temperature,
            stream=stream
        )

        if stream and callback:
            collected_content = []
            for chunk in response:
                if hasattr(chunk, 'delta') and hasattr(chunk.delta, 'text'):
                    content = chunk.delta.text
                    if content:
                        collected_content.append(content)
                        callback(content)

            return {"content": "".join(collected_content), "provider": "anthropic", "model": self.model}

        elif stream:
            # Collect streaming content if no callback is provided
            collected_content = []
            for chunk in response:
                if hasattr(chunk, 'delta') and hasattr(chunk.delta, 'text'):
                    content = chunk.delta.text
                    if content:
                        collected_content.append(content)

            return {"content": "".join(collected_content), "provider": "anthropic", "model": self.model}

        else:
            # Non-streaming response
            content = response.content[0].text
            return {"content": content, "provider": "anthropic", "model": self.model}

    async def _generate_anthropic_async(self, messages, temperature, max_tokens, stream, callback):
        """Generate response asynchronously using Anthropic API."""
        if not anthropic:
            raise ImportError("Anthropic package not installed")

        # Format the messages
        formatted_messages, system_message = self._format_messages_for_provider(messages)

        # Create the completion
        response = await self.anthropic_client.messages.create(
            model=self.model,
            messages=formatted_messages,
            system=system_message,
            max_tokens=max_tokens,
            temperature=temperature,
            stream=stream
        )

        if stream and callback:
            collected_content = []
            async for chunk in response:
                if hasattr(chunk, 'delta') and hasattr(chunk.delta, 'text'):
                    content = chunk.delta.text
                    if content:
                        collected_content.append(content)
                        callback(content)

            return {"content": "".join(collected_content), "provider": "anthropic", "model": self.model}

        elif stream:
            # Collect streaming content if no callback is provided
            collected_content = []
            async for chunk in response:
                if hasattr(chunk, 'delta') and hasattr(chunk.delta, 'text'):
                    content = chunk.delta.text
                    if content:
                        collected_content.append(content)

            return {"content": "".join(collected_content), "provider": "anthropic", "model": self.model}

        else:
            # Non-streaming response
            content = response.content[0].text
            return {"content": content, "provider": "anthropic", "model": self.model}

    def _generate_openrouter(self, messages, temperature, max_tokens, stream, callback):
        """Generate response using OpenRouter API."""
        if not self.api_key:
            raise ValueError("OpenRouter API key is required")

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }

        formatted_messages = self._format_messages_for_provider(messages)

        payload = {
            "model": self.model,
            "messages": formatted_messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": stream
        }

        if stream:
            response = requests.post(
                f"{self.api_base}/chat/completions",
                headers=headers,
                json=payload,
                stream=True
            )
            response.raise_for_status()

            if callback:
                collected_content = []
                for line in response.iter_lines():
                    if line:
                        line = line.decode('utf-8')
                        if line.startswith('data: ') and not line.startswith('data: [DONE]'):
                            data = json.loads(line[6:])
                            if 'choices' in data and len(data['choices']) > 0:
                                if 'delta' in data['choices'][0]:
                                    delta = data['choices'][0]['delta']
                                    if 'content' in delta and delta['content']:
                                        content = delta['content']
                                        collected_content.append(content)
                                        callback(content)

                return {"content": "".join(collected_content), "provider": "openrouter", "model": self.model}

            else:
                # Collect streaming content if no callback is provided
                collected_content = []
                for line in response.iter_lines():
                    if line:
                        line = line.decode('utf-8')
                        if line.startswith('data: ') and not line.startswith('data: [DONE]'):
                            data = json.loads(line[6:])
                            if 'choices' in data and len(data['choices']) > 0:
                                if 'delta' in data['choices'][0]:
                                    delta = data['choices'][0]['delta']
                                    if 'content' in delta and delta['content']:
                                        collected_content.append(delta['content'])

                return {"content": "".join(collected_content), "provider": "openrouter", "model": self.model}

        else:
            # Non-streaming response
            response = requests.post(
                f"{self.api_base}/chat/completions",
                headers=headers,
                json=payload
            )
            response.raise_for_status()

            response_json = response.json()
            content = response_json["choices"][0]["message"]["content"]

            return {"content": content, "provider": "openrouter", "model": self.model}

    async def _generate_openrouter_async(self, messages, temperature, max_tokens, stream, callback):
        """
        Generate response asynchronously using OpenRouter API.
        Note: This is a basic async wrapper around the sync implementation.
        """
        # For simplicity, we'll just call the sync version
        # In a real implementation, you would use aiohttp for proper async
        return self._generate_openrouter(messages, temperature, max_tokens, stream, callback)

    def _generate_local(self, messages, temperature, max_tokens, stream, callback):
        """Generate response using a local model."""
        if not self.local_model or not self.local_tokenizer:
            raise ValueError("Local model not initialized")

        # Format the input for the local model
        prompt = self._format_messages_for_provider(messages)

        # Tokenize the input
        inputs = self.local_tokenizer(prompt, return_tensors="pt").to(self.local_model.device)
        input_ids = inputs["input_ids"]

        # Set up streaming if requested
        if stream:
            streamer = TextIteratorStreamer(self.local_tokenizer, timeout=10, skip_prompt=True, skip_special_tokens=True)
            generation_kwargs = {
                "input_ids": input_ids,
                "streamer": streamer,
                "max_new_tokens": max_tokens,
                "temperature": temperature,
                "do_sample": temperature > 0,
                "top_p": 0.95,
                "top_k": 50,
            }

            # Start generation in a separate thread
            import threading
            thread = threading.Thread(target=self.local_model.generate, kwargs=generation_kwargs)
            thread.start()

            # Process the streamed output
            collected_content = []
            for text in streamer:
                collected_content.append(text)
                if callback:
                    callback(text)

            return {"content": "".join(collected_content), "provider": "local", "model": LOCAL_LLM_CONFIG["model_name"]}

        else:
            # Non-streaming generation
            with torch.no_grad():
                outputs = self.local_model.generate(
                    input_ids,
                    max_new_tokens=max_tokens,
                    temperature=temperature,
                    do_sample=temperature > 0,
                    top_p=0.95,
                    top_k=50,
                )

            # Decode and return the generated text
            generated_text = self.local_tokenizer.decode(outputs[0][input_ids.shape[1]:], skip_special_tokens=True)

            return {"content": generated_text, "provider": "local", "model": LOCAL_LLM_CONFIG["model_name"]}

    async def _generate_local_async(self, messages, temperature, max_tokens, stream, callback):
        """
        Generate response asynchronously using a local model.
        This is just a wrapper around the synchronous version.
        """
        # For simplicity, call the sync version
        return self._generate_local(messages, temperature, max_tokens, stream, callback)


# Basic test function
if __name__ == "__main__":
    # Example usage
    config = {
        "provider": "openrouter",
        "model": "deepseek/deepseek-chat-v3",
        "api_key": os.getenv("OPENROUTER_API_KEY", ""),
        "temperature": 0.7,
        "max_tokens": 500,
    }

    llm = LLMProvider(config)

    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Tell me a short joke about programming."}
    ]

    response = llm.generate(messages)
    print(f"Model: {response['model']}")
    print(f"Response: {response['content']}")
