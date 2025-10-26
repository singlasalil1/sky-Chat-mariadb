import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Database Configuration
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = int(os.getenv('DB_PORT', 3306))
    DB_USER = os.getenv('DB_USER', 'skychat_user')
    DB_PASSWORD = os.getenv('DB_PASSWORD', 'test')
    DB_NAME = os.getenv('DB_NAME', 'skychat')

    # Flask Configuration
    PORT = int(os.getenv('PORT', 5000))
    DEBUG = os.getenv('FLASK_ENV', 'development') == 'development'

    # OpenFlights URLs
    AIRPORTS_URL = os.getenv('AIRPORTS_URL', 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat')
    AIRLINES_URL = os.getenv('AIRLINES_URL', 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat')
    ROUTES_URL = os.getenv('ROUTES_URL', 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/routes.dat')

    # RAG Configuration
    # Embedding provider: 'openai', 'sentence-transformers', or 'cohere'
    EMBEDDING_PROVIDER = os.getenv('EMBEDDING_PROVIDER', 'sentence-transformers')
    EMBEDDING_MODEL = os.getenv('EMBEDDING_MODEL', None)  # Provider-specific model name

    # LLM provider: 'openai', 'anthropic', or 'ollama'
    LLM_PROVIDER = os.getenv('LLM_PROVIDER', 'openai')
    LLM_MODEL = os.getenv('LLM_MODEL', None)  # Provider-specific model name

    # Ollama Configuration (for local LLM)
    OLLAMA_BASE_URL = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')

    # API Keys (set these in .env file)
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', None)
    ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY', None)
    COHERE_API_KEY = os.getenv('COHERE_API_KEY', None)

    # RAG Settings
    RAG_ENABLED = os.getenv('RAG_ENABLED', 'false').lower() == 'true'
    RAG_DEFAULT_MODE = os.getenv('RAG_DEFAULT_MODE', 'hybrid')  # 'classic', 'rag', or 'hybrid'
    RAG_TOP_K = int(os.getenv('RAG_TOP_K', 5))  # Number of documents to retrieve
    RAG_MIN_SIMILARITY = float(os.getenv('RAG_MIN_SIMILARITY', 0.3))  # Minimum similarity threshold
    RAG_TEMPERATURE = float(os.getenv('RAG_TEMPERATURE', 0.7))  # LLM temperature
