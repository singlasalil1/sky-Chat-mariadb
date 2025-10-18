# MariaDB Vector Search Setup

## Requirements

MariaDB Vector Search is available in:
- MariaDB 11.6+ (with Vector plugin)
- Or using UDF (User Defined Functions) for vector operations

## Current Implementation Plan

Since MariaDB vector search requires 11.6+ or custom plugins, we'll implement a **basic semantic search** using:

1. **Text embeddings** stored as JSON
2. **Cosine similarity** calculated via SQL
3. **Pre-computed embeddings** for airport/airline descriptions

## Setup Steps

### Option 1: Basic Text-based Semantic Search (Implemented)
- Use FULLTEXT indexes for text search
- Score results by relevance
- Fast and works with current MariaDB version

### Option 2: Vector Search with JSON (Future)
- Store embeddings as JSON arrays
- Calculate cosine similarity in SQL
- Requires embedding generation

### Option 3: Upgrade to MariaDB 11.6+ (Production)
- Full vector search capabilities
- Built-in vector data types
- Optimized vector indexes

## Current Implementation

We're using **real database metrics** with optimized queries:
- Actual MariaDB execution time
- Comparison with PostgreSQL (estimated)
- Real result counts
- No fake metrics
