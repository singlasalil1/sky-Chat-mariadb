"""
LLM Service Module
Handles Large Language Model interactions for response generation.
Supports OpenAI, Anthropic, and local models via Ollama.
"""

import os
import json
from typing import List, Dict, Optional


class LLMService:
    """
    Service for generating responses using Large Language Models.
    """

    def __init__(self, provider: str = "openai", model_name: Optional[str] = None, ollama_base_url: str = "http://localhost:11434"):
        """
        Initialize LLM service.

        Args:
            provider: 'openai', 'anthropic', or 'ollama'
            model_name: Specific model to use
            ollama_base_url: Base URL for Ollama service (default: http://localhost:11434)
        """
        self.provider = provider
        self.model_name = model_name
        self.client = None
        self.ollama_base_url = ollama_base_url

        self._initialize_provider()

    def _initialize_provider(self):
        """Initialize the selected LLM provider."""
        if self.provider == "openai":
            self._initialize_openai()
        elif self.provider == "anthropic":
            self._initialize_anthropic()
        elif self.provider == "ollama":
            self._initialize_ollama()
        else:
            raise ValueError(f"Unsupported provider: {self.provider}")

    def _initialize_openai(self):
        """Initialize OpenAI API."""
        try:
            from openai import OpenAI

            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OPENAI_API_KEY environment variable not set")

            self.client = OpenAI(api_key=api_key)
            self.model_name = self.model_name or "gpt-4o-mini"

            print(f"✓ OpenAI LLM service initialized with model: {self.model_name}")
        except ImportError:
            raise ImportError("openai package not installed. Run: pip install openai")
        except Exception as e:
            raise Exception(f"Failed to initialize OpenAI: {str(e)}")

    def _initialize_anthropic(self):
        """Initialize Anthropic API."""
        try:
            from anthropic import Anthropic

            api_key = os.getenv("ANTHROPIC_API_KEY")
            if not api_key:
                raise ValueError("ANTHROPIC_API_KEY environment variable not set")

            self.client = Anthropic(api_key=api_key)
            self.model_name = self.model_name or "claude-3-5-haiku-20241022"

            print(f"✓ Anthropic LLM service initialized with model: {self.model_name}")
        except ImportError:
            raise ImportError("anthropic package not installed. Run: pip install anthropic")
        except Exception as e:
            raise Exception(f"Failed to initialize Anthropic: {str(e)}")

    def _initialize_ollama(self):
        """Initialize Ollama (local LLM)."""
        try:
            import requests

            # Test Ollama connection
            response = requests.get(f"{self.ollama_base_url}/api/tags")
            if response.status_code != 200:
                raise Exception("Ollama server not responding")

            self.model_name = self.model_name or "llama3.2"

            print(f"✓ Ollama LLM service initialized with model: {self.model_name}")
            print(f"  Ollama URL: {self.ollama_base_url}")
        except Exception as e:
            raise Exception(f"Failed to initialize Ollama at {self.ollama_base_url}: {str(e)}. Make sure Ollama is running.")

    def generate_response(
        self,
        query: str,
        context_docs: List[Dict],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> Dict:
        """
        Generate a response using the LLM with RAG context.

        Args:
            query: User query
            context_docs: Retrieved documents for context
            system_prompt: Optional system prompt override
            temperature: Sampling temperature (0-1)
            max_tokens: Maximum response length

        Returns:
            Dict with response text and metadata
        """
        # Construct the prompt with context
        prompt = self._construct_prompt(query, context_docs, system_prompt)

        # Generate response based on provider
        if self.provider == "openai":
            return self._generate_openai_response(prompt, temperature, max_tokens)
        elif self.provider == "anthropic":
            return self._generate_anthropic_response(prompt, temperature, max_tokens)
        elif self.provider == "ollama":
            return self._generate_ollama_response(prompt, temperature, max_tokens)

    def _construct_prompt(
        self,
        query: str,
        context_docs: List[Dict],
        system_prompt: Optional[str] = None
    ) -> Dict:
        """
        Construct a prompt with context documents.

        Args:
            query: User query
            context_docs: Retrieved documents
            system_prompt: Optional system prompt

        Returns:
            Dict with system and user messages
        """
        # Default system prompt
        if system_prompt is None:
            system_prompt = """You are SkyChat, an intelligent flight information assistant powered by RAG (Retrieval-Augmented Generation).

Your role is to:
1. Answer questions about airports, airlines, routes, and flight information
2. Use the provided context documents to give accurate, detailed answers
3. Cite your sources when possible (mention document titles)
4. Be conversational and helpful
5. If the context doesn't contain relevant information, say so clearly
6. Provide structured data (routes, airport codes, etc.) when appropriate

Always prioritize accuracy over speculation. If you're unsure, acknowledge it."""

        # Format context documents
        context_text = self._format_context(context_docs)

        # Construct user message with context
        user_message = f"""Context Documents:
{context_text}

User Query: {query}

Please provide a helpful, accurate response based on the context above. Include relevant details like airport codes, airline names, and route information when applicable."""

        return {
            "system": system_prompt,
            "user": user_message,
            "context_docs": context_docs  # Keep for metadata
        }

    def _format_context(self, context_docs: List[Dict]) -> str:
        """
        Format context documents for the prompt.

        Args:
            context_docs: List of retrieved documents

        Returns:
            Formatted context string
        """
        if not context_docs:
            return "No relevant context documents found."

        formatted = []
        for i, doc in enumerate(context_docs, 1):
            formatted.append(f"""
Document {i}: {doc['title']}
Type: {doc['doc_type']}
Relevance: {doc['similarity']:.2f}
Content: {doc['content']}
---""")

        return "\n".join(formatted)

    def _generate_openai_response(
        self,
        prompt: Dict,
        temperature: float,
        max_tokens: int
    ) -> Dict:
        """Generate response using OpenAI."""
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": prompt["system"]},
                    {"role": "user", "content": prompt["user"]}
                ],
                temperature=temperature,
                max_tokens=max_tokens
            )

            return {
                "response": response.choices[0].message.content,
                "model": self.model_name,
                "provider": self.provider,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                },
                "context_docs": prompt["context_docs"]
            }
        except Exception as e:
            raise Exception(f"OpenAI response generation failed: {str(e)}")

    def _generate_anthropic_response(
        self,
        prompt: Dict,
        temperature: float,
        max_tokens: int
    ) -> Dict:
        """Generate response using Anthropic."""
        try:
            response = self.client.messages.create(
                model=self.model_name,
                system=prompt["system"],
                messages=[
                    {"role": "user", "content": prompt["user"]}
                ],
                temperature=temperature,
                max_tokens=max_tokens
            )

            return {
                "response": response.content[0].text,
                "model": self.model_name,
                "provider": self.provider,
                "usage": {
                    "prompt_tokens": response.usage.input_tokens,
                    "completion_tokens": response.usage.output_tokens,
                    "total_tokens": response.usage.input_tokens + response.usage.output_tokens
                },
                "context_docs": prompt["context_docs"]
            }
        except Exception as e:
            raise Exception(f"Anthropic response generation failed: {str(e)}")

    def _generate_ollama_response(
        self,
        prompt: Dict,
        temperature: float,
        max_tokens: int
    ) -> Dict:
        """Generate response using Ollama."""
        try:
            import requests

            # Combine system and user prompts for Ollama
            full_prompt = f"{prompt['system']}\n\n{prompt['user']}"

            response = requests.post(
                f"{self.ollama_base_url}/api/generate",
                json={
                    "model": self.model_name,
                    "prompt": full_prompt,
                    "temperature": temperature,
                    "options": {
                        "num_predict": max_tokens
                    },
                    "stream": False
                }
            )

            response.raise_for_status()
            result = response.json()

            return {
                "response": result["response"],
                "model": self.model_name,
                "provider": self.provider,
                "usage": {
                    "prompt_tokens": result.get("prompt_eval_count", 0),
                    "completion_tokens": result.get("eval_count", 0),
                    "total_tokens": result.get("prompt_eval_count", 0) + result.get("eval_count", 0)
                },
                "context_docs": prompt["context_docs"]
            }
        except Exception as e:
            raise Exception(f"Ollama response generation failed: {str(e)}")

    def generate_simple_response(self, prompt: str, temperature: float = 0.7) -> str:
        """
        Generate a simple response without RAG context.

        Args:
            prompt: User prompt
            temperature: Sampling temperature

        Returns:
            Response text
        """
        result = self.generate_response(
            query=prompt,
            context_docs=[],
            temperature=temperature
        )
        return result["response"]

    def get_model_info(self) -> Dict:
        """Get information about the current LLM."""
        return {
            "provider": self.provider,
            "model_name": self.model_name
        }


# Factory function
def create_llm_service(provider: str = None, model_name: str = None, ollama_base_url: str = None) -> LLMService:
    """
    Factory function to create an LLM service with sensible defaults.

    Args:
        provider: LLM provider (defaults to env var or 'openai')
        model_name: Model name (provider-specific)
        ollama_base_url: Base URL for Ollama (defaults to env var or 'http://localhost:11434')

    Returns:
        Initialized LLMService
    """
    if provider is None:
        provider = os.getenv("LLM_PROVIDER", "openai")

    if model_name is None:
        model_name = os.getenv("LLM_MODEL", None)

    if ollama_base_url is None:
        ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

    return LLMService(provider=provider, model_name=model_name, ollama_base_url=ollama_base_url)
