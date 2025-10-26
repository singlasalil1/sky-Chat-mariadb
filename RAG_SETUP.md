# SkyChat RAG Integration Guide

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Setup Instructions](#setup-instructions)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

---

## Overview

SkyChat now supports **RAG (Retrieval-Augmented Generation)** - an AI-powered query system that combines:
- **Vector Search**: Semantic search through flight data documents
- **LLM Integration**: Natural language response generation
- **Hybrid Mode**: Best of both classic pattern matching and AI responses

### What is RAG?

RAG enhances traditional keyword search by:
1. Converting text into embeddings (vector representations)
2. Finding semantically similar documents using cosine similarity
3. Passing relevant context to an LLM (GPT-4, Claude, etc.)
4. Generating natural, context-aware responses

### Benefits

- ✅ Natural conversation instead of structured queries
- ✅ Handles complex, multi-part questions
- ✅ Provides cited sources for answers
- ✅ Works with conversational follow-ups
- ✅ Falls back to classic mode when pattern matching works

---

## Architecture

```
User Query
    ↓
Chat Service (mode selector)
    ↓
┌─────────────────────┐
│   Hybrid Mode       │
│  (Default)          │
├─────────────────────┤
│ 1. Try Pattern      │←──── Classic Mode
│    Matching         │      (Regex)
│                     │
│ 2. If no match,     │
│    use RAG          │←──── RAG Mode
└─────────────────────┘      (AI-powered)
           ↓
    RAG Pipeline
           ↓
  ┌──────────────────────┐
  │ Embedding Service    │
  │ (OpenAI/Local)       │
  └──────────────────────┘
           ↓
  ┌──────────────────────┐
  │ Vector Search        │
  │ (MariaDB + Python)   │
  └──────────────────────┘
           ↓
  ┌──────────────────────┐
  │ LLM Service          │
  │ (GPT/Claude/Ollama)  │
  └──────────────────────┘
           ↓
     AI Response
```

### Components

**Modular Services** (following your requirement for modularity):
- `embedding_service.py` - Text-to-vector conversion
- `vector_search_service.py` - Similarity search
- `llm_service.py` - Response generation
- `rag_service.py` - Orchestrator
- `knowledge_base_builder.py` - Document generation

---

## Setup Instructions

### Prerequisites

1. **Python 3.9+** installed
2. **MariaDB** running with SkyChat database initialized
3. **API Keys** (choose one option):
   - **Option A**: OpenAI API key (recommended, easiest)
   - **Option B**: Anthropic API key (Claude)
   - **Option C**: Ollama installed (free, local)

### Step 1: Install Dependencies

```bash
# Install core + RAG dependencies
pip install -r requirements.txt
```

If you want to use **local models** (free, no API keys):
```bash
# Install sentence transformers for local embeddings
pip install sentence-transformers

# Install Ollama for local LLM (separate installation)
# Visit: https://ollama.ai
```

### Step 2: Configure Environment

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and configure:

#### For OpenAI (Recommended - Easiest)
```env
RAG_ENABLED=true
EMBEDDING_PROVIDER=openai
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
```

#### For Local Models (Free)
```env
RAG_ENABLED=true
EMBEDDING_PROVIDER=sentence-transformers
LLM_PROVIDER=ollama
# No API keys needed!
```

**Note**: If using Ollama, start it first:
```bash
ollama serve
ollama pull llama3.2
```

#### For Anthropic (Claude)
```env
RAG_ENABLED=true
EMBEDDING_PROVIDER=openai
LLM_PROVIDER=anthropic
OPENAI_API_KEY=sk-your-openai-key  # For embeddings
ANTHROPIC_API_KEY=sk-ant-your-key  # For LLM
```

### Step 3: Run RAG Setup Script

This script creates the RAG database tables, builds the knowledge base, and generates embeddings:

```bash
python setup_rag.py
```

**Expected output:**
```
============================================================
SkyChat RAG Setup
============================================================

✓ Database connection successful

============================================================
STEP 1: Creating RAG Database Schema
============================================================
  Executing statement 1/5...
  ...
✓ Successfully executed 5 statements

============================================================
STEP 2: Building Knowledge Base
============================================================
Building knowledge base...
1. Building airport documents...
✓ Generated 500 airport documents
✓ Inserted 500 documents into database

2. Building airline documents...
✓ Generated 300 airline documents
...

Total documents: 1900

============================================================
STEP 3: Generating Embeddings
============================================================
Initializing embedding service with provider: openai
Model: text-embedding-3-small
Dimensions: 1536

Generating embeddings for 1900 documents...
Processing batch 1/19 (100 documents)...
...

✓ Generated 1900 embeddings in 45.23 seconds

============================================================
✓ RAG SETUP COMPLETE!
============================================================
```

**Options:**
```bash
# Limit data size for faster setup (good for testing)
python setup_rag.py --airport-limit 100 --airline-limit 50 --route-limit 200

# Skip steps if re-running
python setup_rag.py --skip-schema --skip-kb  # Only regenerate embeddings

# Use specific provider
python setup_rag.py --provider sentence-transformers
```

### Step 4: Start the Server

```bash
python app.py
```

Visit: `http://localhost:5000`

---

## Configuration

### Environment Variables

| Variable | Options | Default | Description |
|----------|---------|---------|-------------|
| `RAG_ENABLED` | true/false | false | Enable RAG features |
| `RAG_DEFAULT_MODE` | classic/rag/hybrid | hybrid | Default query mode |
| `EMBEDDING_PROVIDER` | openai/sentence-transformers/cohere | sentence-transformers | Embedding model provider |
| `LLM_PROVIDER` | openai/anthropic/ollama | openai | LLM provider |
| `RAG_TOP_K` | 1-20 | 5 | Number of docs to retrieve |
| `RAG_MIN_SIMILARITY` | 0.0-1.0 | 0.3 | Minimum similarity threshold |
| `RAG_TEMPERATURE` | 0.0-1.0 | 0.7 | LLM creativity (higher = more creative) |

### Cost Considerations

#### OpenAI Pricing (Pay-as-you-go)
- **Embeddings** (text-embedding-3-small): $0.02 / 1M tokens
  - Initial setup (~1900 docs): ~$0.01
  - Per query: ~$0.0001
- **LLM** (gpt-4o-mini): $0.15 / 1M input, $0.60 / 1M output
  - Per query: ~$0.001-0.005

**Expected monthly cost** for moderate usage: **$5-10**

#### Free Alternative
- Sentence Transformers (local embeddings): $0
- Ollama (local LLM): $0
- **Total**: $0 (requires ~8GB RAM)

---

## Usage

### Query Modes

#### 1. Classic Mode (Pattern Matching)
Fast, structured queries:
```
"Find flights from JFK to LAX"
"Search airport London"
"Show busiest routes"
```

#### 2. RAG Mode (AI-Powered)
Natural conversation:
```
"What's the best way to fly from New York to Tokyo?"
"Tell me about hub airports in Europe"
"Which airlines fly to Southeast Asia?"
```

#### 3. Hybrid Mode (Default)
Automatically chooses the best approach:
- Structured queries → Classic mode (fast)
- Conversational queries → RAG mode (intelligent)

### Example Queries

**Classic Mode:**
```json
POST /api/chat
{
  "query": "Find flights from JFK to LAX",
  "mode": "classic"
}
```

**RAG Mode:**
```json
POST /api/chat
{
  "query": "What are the major hubs in Asia and what airlines operate there?",
  "mode": "rag",
  "sessionId": "user-123"
}
```

**Response:**
```json
{
  "query": "What are the major hubs in Asia...",
  "result": {
    "type": "rag_response",
    "message": "Based on our flight data, the major hub airports in Asia include:\n\n1. **Hong Kong International Airport (HKG)** - Serves 180+ destinations...",
    "data": {
      "context_documents": [
        {
          "title": "Major Hub: Hong Kong International Airport (HKG)",
          "doc_type": "airport_info",
          "similarity": 0.87
        }
      ]
    },
    "metrics": {
      "total_time": 1523,
      "embedding_time": 234,
      "retrieval_time": 89,
      "llm_time": 1200,
      "documents_retrieved": 5
    }
  },
  "mode": "rag"
}
```

---

## API Reference

### Endpoints

#### `POST /api/chat`
Process a chat query.

**Request:**
```json
{
  "query": "string",
  "mode": "classic|rag|hybrid",  // optional, default: hybrid
  "sessionId": "string"           // optional, for tracking
}
```

**Response:**
```json
{
  "query": "string",
  "result": {
    "type": "rag_response|direct_routes|airport_search|...",
    "message": "string",
    "data": {},
    "metrics": {}
  },
  "mode": "string"
}
```

#### `GET /api/rag/status`
Get RAG system status and statistics.

**Response:**
```json
{
  "enabled": true,
  "statistics": {
    "knowledge_base": {
      "total_documents": 1900,
      "documents_by_type": {
        "airport_info": 600,
        "airline_info": 300,
        "route_info": 1000
      }
    },
    "queries": {
      "total": 156,
      "avg_response_time_ms": 1523
    }
  },
  "config": {
    "default_mode": "hybrid",
    "top_k": 5
  }
}
```

#### `GET /api/rag/session/{sessionId}`
Get query history for a session.

**Response:**
```json
{
  "session_id": "user-123",
  "history": [
    {
      "query_id": 1,
      "query": "What are major hubs?",
      "response": "Major hub airports include...",
      "timestamp": "2025-01-15T10:30:00"
    }
  ]
}
```

---

## Troubleshooting

### Issue: "RAG service not available"

**Cause**: Missing dependencies or API keys

**Solution**:
1. Check `.env` has `RAG_ENABLED=true`
2. Verify API keys are set
3. Run: `pip install openai numpy scikit-learn`
4. Check logs for specific error

### Issue: "Embedding generation failed"

**Cause**: Invalid API key or network issue

**Solution**:
1. Verify API key: `echo $OPENAI_API_KEY`
2. Test API: `curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"`
3. Switch to local: `EMBEDDING_PROVIDER=sentence-transformers`

### Issue: Slow responses

**Optimization tips**:
1. Reduce `RAG_TOP_K` to 3
2. Increase `RAG_MIN_SIMILARITY` to 0.5
3. Use faster LLM: `gpt-4o-mini` or `ollama`
4. Enable caching (future enhancement)

### Issue: Poor answer quality

**Solutions**:
1. Increase `RAG_TOP_K` to 7-10
2. Lower `RAG_MIN_SIMILARITY` to 0.2
3. Adjust `RAG_TEMPERATURE` (lower = more factual)
4. Rebuild knowledge base with more documents

### Issue: Ollama connection refused

**Solution**:
```bash
# Start Ollama server
ollama serve

# In another terminal, pull model
ollama pull llama3.2

# Verify it's running
curl http://localhost:11434/api/tags
```

---

## Advanced Topics

### Adding Custom Documents

You can extend the knowledge base with custom documents:

```python
from src.services.knowledge_base_builder import KnowledgeBaseBuilder
import json

builder = KnowledgeBaseBuilder()

custom_docs = [{
    'doc_type': 'general_knowledge',
    'title': 'Best Practices for International Travel',
    'content': 'When flying internationally, arrive 3 hours early...',
    'metadata': json.dumps({'topic': 'travel_tips'})
}]

doc_ids = builder.insert_documents(custom_docs)
# Then run: python setup_rag.py --skip-schema --skip-kb
```

### Switching Providers

Easy provider switching without code changes:

```bash
# Use OpenAI
export EMBEDDING_PROVIDER=openai
export LLM_PROVIDER=openai

# Use Anthropic Claude
export LLM_PROVIDER=anthropic

# Use local models
export EMBEDDING_PROVIDER=sentence-transformers
export LLM_PROVIDER=ollama
```

### Monitoring

Check RAG statistics:
```bash
curl http://localhost:5000/api/rag/status | jq .
```

---

## Next Steps

1. **Frontend Integration**: Update Chat.jsx to add mode toggle
2. **Caching**: Implement embedding caching for faster repeated queries
3. **Fine-tuning**: Customize system prompts for domain-specific responses
4. **Analytics**: Track which queries use RAG vs classic mode

---

## Support

For issues or questions:
1. Check logs: `tail -f app.log`
2. Review this documentation
3. Test with simple queries first
4. Verify database has data: `SELECT COUNT(*) FROM documents;`

**Happy querying! 🚀**
