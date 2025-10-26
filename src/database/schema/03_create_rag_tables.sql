-- RAG (Retrieval-Augmented Generation) Schema
-- This file creates tables for storing documents and embeddings

-- Documents table: stores knowledge base content
CREATE TABLE IF NOT EXISTS documents (
    doc_id INT AUTO_INCREMENT PRIMARY KEY,
    doc_type VARCHAR(50) NOT NULL,  -- 'airport_info', 'airline_info', 'route_info', 'general_knowledge'
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    metadata JSON,  -- Flexible metadata storage (airport_id, airline_id, etc.)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_doc_type (doc_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Embeddings table: stores vector embeddings for documents
CREATE TABLE IF NOT EXISTS embeddings (
    embedding_id INT AUTO_INCREMENT PRIMARY KEY,
    doc_id INT NOT NULL,
    embedding_vector JSON NOT NULL,  -- Store as JSON array for compatibility
    model_name VARCHAR(100) NOT NULL,  -- e.g., 'text-embedding-3-small'
    vector_dimensions INT NOT NULL,  -- e.g., 1536
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doc_id) REFERENCES documents(doc_id) ON DELETE CASCADE,
    INDEX idx_doc_id (doc_id),
    INDEX idx_model_name (model_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chat history with RAG context
CREATE TABLE IF NOT EXISTS chat_sessions (
    session_id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100),  -- For future user authentication
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_last_activity (last_activity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enhanced user_queries table for RAG
-- Note: We'll modify existing user_queries if it exists
-- For now, create RAG-specific query log
CREATE TABLE IF NOT EXISTS rag_queries (
    query_id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(100),
    query_text TEXT NOT NULL,
    query_embedding JSON,  -- Store query embedding for analysis
    retrieved_doc_ids JSON,  -- Array of doc_ids that were retrieved
    llm_response TEXT,
    response_time_ms INT,  -- Total response time
    embedding_time_ms INT,  -- Time to generate embedding
    retrieval_time_ms INT,  -- Time for vector search
    llm_time_ms INT,  -- Time for LLM generation
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Document sources for citations
CREATE TABLE IF NOT EXISTS document_sources (
    source_id INT AUTO_INCREMENT PRIMARY KEY,
    doc_id INT NOT NULL,
    source_type VARCHAR(50) NOT NULL,  -- 'database', 'manual', 'imported'
    source_reference VARCHAR(500),  -- e.g., 'airports.airport_id=123'
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doc_id) REFERENCES documents(doc_id) ON DELETE CASCADE,
    INDEX idx_doc_id (doc_id),
    INDEX idx_source_type (source_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
