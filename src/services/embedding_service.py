"""
Embedding Service Module
Handles text-to-vector conversion using various embedding models.
Supports OpenAI, Sentence Transformers, and other providers.
"""

import numpy as np
from typing import List, Optional, Dict
import json
import os


class EmbeddingService:
    """
    Service for generating text embeddings.
    Supports multiple providers with automatic fallback.
    """

    def __init__(self, provider: str = "openai", model_name: Optional[str] = None):
        """
        Initialize embedding service.

        Args:
            provider: 'openai', 'sentence-transformers', or 'cohere'
            model_name: Specific model to use (provider-dependent)
        """
        self.provider = provider
        self.model_name = model_name
        self.client = None
        self.model = None
        self.vector_dimensions = None

        self._initialize_provider()

    def _initialize_provider(self):
        """Initialize the selected embedding provider."""
        if self.provider == "openai":
            self._initialize_openai()
        elif self.provider == "sentence-transformers":
            self._initialize_sentence_transformers()
        elif self.provider == "cohere":
            self._initialize_cohere()
        else:
            raise ValueError(f"Unsupported provider: {self.provider}")

    def _initialize_openai(self):
        """Initialize OpenAI embeddings."""
        try:
            from openai import OpenAI

            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OPENAI_API_KEY environment variable not set")

            self.client = OpenAI(api_key=api_key)
            self.model_name = self.model_name or "text-embedding-3-small"
            self.vector_dimensions = 1536  # Default for text-embedding-3-small

            print(f"✓ OpenAI embedding service initialized with model: {self.model_name}")
        except ImportError:
            raise ImportError("openai package not installed. Run: pip install openai")
        except Exception as e:
            raise Exception(f"Failed to initialize OpenAI: {str(e)}")

    def _initialize_sentence_transformers(self):
        """Initialize Sentence Transformers (local embeddings)."""
        try:
            from sentence_transformers import SentenceTransformer

            self.model_name = self.model_name or "all-MiniLM-L6-v2"
            self.model = SentenceTransformer(self.model_name)
            self.vector_dimensions = self.model.get_sentence_embedding_dimension()

            print(f"✓ Sentence Transformers initialized with model: {self.model_name}")
            print(f"  Vector dimensions: {self.vector_dimensions}")
        except ImportError:
            raise ImportError("sentence-transformers package not installed. Run: pip install sentence-transformers")
        except Exception as e:
            raise Exception(f"Failed to initialize Sentence Transformers: {str(e)}")

    def _initialize_cohere(self):
        """Initialize Cohere embeddings."""
        try:
            import cohere

            api_key = os.getenv("COHERE_API_KEY")
            if not api_key:
                raise ValueError("COHERE_API_KEY environment variable not set")

            self.client = cohere.Client(api_key)
            self.model_name = self.model_name or "embed-english-v3.0"
            self.vector_dimensions = 1024  # Cohere embed-english-v3.0

            print(f"✓ Cohere embedding service initialized with model: {self.model_name}")
        except ImportError:
            raise ImportError("cohere package not installed. Run: pip install cohere")
        except Exception as e:
            raise Exception(f"Failed to initialize Cohere: {str(e)}")

    def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for a single text.

        Args:
            text: Input text to embed

        Returns:
            List of floats representing the embedding vector
        """
        if not text or not text.strip():
            raise ValueError("Text cannot be empty")

        if self.provider == "openai":
            return self._generate_openai_embedding(text)
        elif self.provider == "sentence-transformers":
            return self._generate_sentence_transformers_embedding(text)
        elif self.provider == "cohere":
            return self._generate_cohere_embedding(text)

    def _generate_openai_embedding(self, text: str) -> List[float]:
        """Generate embedding using OpenAI API."""
        try:
            response = self.client.embeddings.create(
                model=self.model_name,
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            raise Exception(f"OpenAI embedding generation failed: {str(e)}")

    def _generate_sentence_transformers_embedding(self, text: str) -> List[float]:
        """Generate embedding using Sentence Transformers."""
        try:
            embedding = self.model.encode(text, convert_to_numpy=True)
            return embedding.tolist()
        except Exception as e:
            raise Exception(f"Sentence Transformers embedding generation failed: {str(e)}")

    def _generate_cohere_embedding(self, text: str) -> List[float]:
        """Generate embedding using Cohere API."""
        try:
            response = self.client.embed(
                texts=[text],
                model=self.model_name,
                input_type="search_query"
            )
            return response.embeddings[0]
        except Exception as e:
            raise Exception(f"Cohere embedding generation failed: {str(e)}")

    def batch_generate_embeddings(self, texts: List[str], batch_size: int = 100) -> List[List[float]]:
        """
        Generate embeddings for multiple texts in batches.

        Args:
            texts: List of texts to embed
            batch_size: Number of texts to process per batch

        Returns:
            List of embedding vectors
        """
        if not texts:
            return []

        embeddings = []

        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]

            if self.provider == "openai":
                batch_embeddings = self._batch_generate_openai_embeddings(batch)
            elif self.provider == "sentence-transformers":
                batch_embeddings = self._batch_generate_sentence_transformers_embeddings(batch)
            elif self.provider == "cohere":
                batch_embeddings = self._batch_generate_cohere_embeddings(batch)

            embeddings.extend(batch_embeddings)

            print(f"  Processed {min(i + batch_size, len(texts))}/{len(texts)} embeddings")

        return embeddings

    def _batch_generate_openai_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Batch generate embeddings using OpenAI."""
        try:
            response = self.client.embeddings.create(
                model=self.model_name,
                input=texts
            )
            return [item.embedding for item in response.data]
        except Exception as e:
            raise Exception(f"OpenAI batch embedding generation failed: {str(e)}")

    def _batch_generate_sentence_transformers_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Batch generate embeddings using Sentence Transformers."""
        try:
            embeddings = self.model.encode(texts, convert_to_numpy=True)
            return embeddings.tolist()
        except Exception as e:
            raise Exception(f"Sentence Transformers batch embedding generation failed: {str(e)}")

    def _batch_generate_cohere_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Batch generate embeddings using Cohere."""
        try:
            response = self.client.embed(
                texts=texts,
                model=self.model_name,
                input_type="search_document"
            )
            return response.embeddings
        except Exception as e:
            raise Exception(f"Cohere batch embedding generation failed: {str(e)}")

    @staticmethod
    def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
        """
        Calculate cosine similarity between two vectors.

        Args:
            vec1: First vector
            vec2: Second vector

        Returns:
            Similarity score between -1 and 1 (higher is more similar)
        """
        vec1_array = np.array(vec1)
        vec2_array = np.array(vec2)

        # Handle zero vectors
        norm1 = np.linalg.norm(vec1_array)
        norm2 = np.linalg.norm(vec2_array)

        if norm1 == 0 or norm2 == 0:
            return 0.0

        return float(np.dot(vec1_array, vec2_array) / (norm1 * norm2))

    def get_model_info(self) -> Dict:
        """Get information about the current embedding model."""
        return {
            "provider": self.provider,
            "model_name": self.model_name,
            "vector_dimensions": self.vector_dimensions
        }


# Factory function for easy instantiation
def create_embedding_service(provider: str = None, model_name: str = None) -> EmbeddingService:
    """
    Factory function to create an embedding service with sensible defaults.

    Args:
        provider: Embedding provider (defaults to env var or 'sentence-transformers')
        model_name: Model name (provider-specific)

    Returns:
        Initialized EmbeddingService
    """
    if provider is None:
        # Check environment variable, fallback to free local option
        provider = os.getenv("EMBEDDING_PROVIDER", "sentence-transformers")

    if model_name is None:
        model_name = os.getenv("EMBEDDING_MODEL", None)

    return EmbeddingService(provider=provider, model_name=model_name)
