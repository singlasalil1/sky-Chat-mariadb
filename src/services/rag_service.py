"""
RAG Service Module
Orchestrates the complete RAG (Retrieval-Augmented Generation) pipeline.
Combines embedding, vector search, and LLM services for intelligent responses.
"""

import time
import json
from typing import List, Dict, Optional
from src.services.embedding_service import EmbeddingService, create_embedding_service
from src.services.vector_search_service import VectorSearchService, create_vector_search_service
from src.services.llm_service import LLMService, create_llm_service
from src.database.connection import DatabaseConnection, get_connection


class RAGService:
    """
    Main RAG service that orchestrates the complete retrieval-augmented generation pipeline.
    """

    def __init__(
        self,
        embedding_service: Optional[EmbeddingService] = None,
        llm_service: Optional[LLMService] = None,
        vector_search_service: Optional[VectorSearchService] = None
    ):
        """
        Initialize RAG service.

        Args:
            embedding_service: Optional embedding service (creates default if not provided)
            llm_service: Optional LLM service (creates default if not provided)
            vector_search_service: Optional vector search service (creates default if not provided)
        """
        # Initialize services with defaults if not provided
        self.embedding_service = embedding_service or create_embedding_service()
        self.llm_service = llm_service or create_llm_service()
        self.vector_search_service = vector_search_service or create_vector_search_service(
            self.embedding_service
        )

        print("✓ RAG Service initialized")
        print(f"  Embedding: {self.embedding_service.get_model_info()}")
        print(f"  LLM: {self.llm_service.get_model_info()}")

    def query(
        self,
        query_text: str,
        top_k: int = 5,
        temperature: float = 0.7,
        min_similarity: float = 0.3,
        session_id: Optional[str] = None,
        include_metrics: bool = True
    ) -> Dict:
        """
        Process a query through the complete RAG pipeline.

        Args:
            query_text: User's question/query
            top_k: Number of documents to retrieve
            temperature: LLM temperature (0-1)
            min_similarity: Minimum similarity threshold for retrieval
            session_id: Optional session ID for tracking
            include_metrics: Whether to include timing metrics

        Returns:
            Dict with response, context, and metadata
        """
        start_time = time.time()
        metrics = {}

        # Step 1: Generate query embedding
        embed_start = time.time()
        query_embedding = self.embedding_service.generate_embedding(query_text)
        metrics['embedding_time_ms'] = int((time.time() - embed_start) * 1000)

        # Step 2: Retrieve relevant documents
        retrieval_start = time.time()
        context_docs = self.vector_search_service.search(
            query_embedding=query_embedding,
            top_k=top_k,
            min_similarity=min_similarity
        )
        metrics['retrieval_time_ms'] = int((time.time() - retrieval_start) * 1000)
        metrics['documents_retrieved'] = len(context_docs)

        # Step 3: Generate LLM response with context
        llm_start = time.time()
        llm_result = self.llm_service.generate_response(
            query=query_text,
            context_docs=context_docs,
            temperature=temperature
        )
        metrics['llm_time_ms'] = int((time.time() - llm_start) * 1000)

        # Total time
        metrics['total_time_ms'] = int((time.time() - start_time) * 1000)

        # Build response
        response = {
            'response': llm_result['response'],
            'context_documents': self._format_context_docs(context_docs),
            'query': query_text,
            'model_info': {
                'embedding_model': self.embedding_service.get_model_info(),
                'llm_model': self.llm_service.get_model_info()
            }
        }

        if include_metrics:
            response['metrics'] = metrics
            response['usage'] = llm_result.get('usage', {})

        # Log query if session provided
        if session_id:
            self._log_query(
                session_id=session_id,
                query_text=query_text,
                query_embedding=query_embedding,
                context_docs=context_docs,
                llm_response=llm_result['response'],
                metrics=metrics
            )

        return response

    def query_with_hybrid_search(
        self,
        query_text: str,
        top_k: int = 5,
        temperature: float = 0.7,
        filters: Optional[Dict] = None,
        session_id: Optional[str] = None
    ) -> Dict:
        """
        Query using hybrid search (vector + metadata filters).

        Args:
            query_text: User query
            top_k: Number of results
            temperature: LLM temperature
            filters: Metadata filters
            session_id: Session ID

        Returns:
            Response dict
        """
        start_time = time.time()
        metrics = {}

        # Generate embedding
        embed_start = time.time()
        query_embedding = self.embedding_service.generate_embedding(query_text)
        metrics['embedding_time_ms'] = int((time.time() - embed_start) * 1000)

        # Hybrid search
        retrieval_start = time.time()
        context_docs = self.vector_search_service.hybrid_search(
            query_text=query_text,
            top_k=top_k,
            filters=filters
        )
        metrics['retrieval_time_ms'] = int((time.time() - retrieval_start) * 1000)

        # Generate response
        llm_start = time.time()
        llm_result = self.llm_service.generate_response(
            query=query_text,
            context_docs=context_docs,
            temperature=temperature
        )
        metrics['llm_time_ms'] = int((time.time() - llm_start) * 1000)
        metrics['total_time_ms'] = int((time.time() - start_time) * 1000)

        return {
            'response': llm_result['response'],
            'context_documents': self._format_context_docs(context_docs),
            'query': query_text,
            'metrics': metrics,
            'filters_applied': filters
        }

    def _format_context_docs(self, docs: List[Dict]) -> List[Dict]:
        """
        Format context documents for response.

        Args:
            docs: Retrieved documents

        Returns:
            Formatted document list
        """
        formatted = []
        for doc in docs:
            formatted.append({
                'title': doc['title'],
                'doc_type': doc['doc_type'],
                'similarity': round(doc['similarity'], 3),
                'metadata': doc.get('metadata', {})
            })
        return formatted

    def _log_query(
        self,
        session_id: str,
        query_text: str,
        query_embedding: List[float],
        context_docs: List[Dict],
        llm_response: str,
        metrics: Dict
    ):
        """
        Log the query to the database for analytics.

        Args:
            session_id: Session identifier
            query_text: Original query
            query_embedding: Query embedding vector
            context_docs: Retrieved documents
            llm_response: LLM response
            metrics: Performance metrics
        """
        conn = None
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor(dictionary=True)

            # Ensure session exists
            cursor.execute("""
                INSERT IGNORE INTO chat_sessions (session_id)
                VALUES (?)
            """, [session_id])

            # Extract doc IDs
            doc_ids = [doc['doc_id'] for doc in context_docs]

            # Insert query log
            cursor.execute("""
                INSERT INTO rag_queries (
                    session_id,
                    query_text,
                    query_embedding,
                    retrieved_doc_ids,
                    llm_response,
                    response_time_ms,
                    embedding_time_ms,
                    retrieval_time_ms,
                    llm_time_ms
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, [
                session_id,
                query_text,
                json.dumps(query_embedding[:50]),  # Store first 50 dims for analysis
                json.dumps(doc_ids),
                llm_response,
                metrics.get('total_time_ms', 0),
                metrics.get('embedding_time_ms', 0),
                metrics.get('retrieval_time_ms', 0),
                metrics.get('llm_time_ms', 0)
            ])

            conn.commit()

        except Exception as e:
            print(f"Warning: Failed to log query: {str(e)}")
            conn.rollback()
        finally:
            cursor.close()
            conn.close()

    def get_session_history(self, session_id: str, limit: int = 10) -> List[Dict]:
        """
        Get query history for a session.

        Args:
            session_id: Session identifier
            limit: Number of recent queries to retrieve

        Returns:
            List of previous queries and responses
        """
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        try:
            cursor.execute("""
                SELECT
                    query_id,
                    query_text,
                    llm_response,
                    retrieved_doc_ids,
                    response_time_ms,
                    created_at
                FROM rag_queries
                WHERE session_id = ?
                ORDER BY created_at DESC
                LIMIT ?
            """, [session_id, limit])

            history = []
            for row in cursor.fetchall():
                history.append({
                    'query_id': row['query_id'],
                    'query': row['query_text'],
                    'response': row['llm_response'],
                    'doc_ids': json.loads(row['retrieved_doc_ids']) if row['retrieved_doc_ids'] else [],
                    'response_time_ms': row['response_time_ms'],
                    'timestamp': row['created_at'].isoformat() if row['created_at'] else None
                })

            return history

        finally:
            cursor.close()
            conn.close()

    def get_statistics(self) -> Dict:
        """
        Get RAG system statistics.

        Returns:
            Dict with system statistics
        """
        # Get vector search stats
        vector_stats = self.vector_search_service.get_statistics()

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        try:
            # Get query stats
            cursor.execute("""
                SELECT
                    COUNT(*) as total_queries,
                    AVG(response_time_ms) as avg_response_time,
                    AVG(embedding_time_ms) as avg_embedding_time,
                    AVG(retrieval_time_ms) as avg_retrieval_time,
                    AVG(llm_time_ms) as avg_llm_time
                FROM rag_queries
            """)

            query_stats = cursor.fetchone()

            return {
                'knowledge_base': vector_stats,
                'queries': {
                    'total': query_stats['total_queries'],
                    'avg_response_time_ms': round(query_stats['avg_response_time'] or 0, 2),
                    'avg_embedding_time_ms': round(query_stats['avg_embedding_time'] or 0, 2),
                    'avg_retrieval_time_ms': round(query_stats['avg_retrieval_time'] or 0, 2),
                    'avg_llm_time_ms': round(query_stats['avg_llm_time'] or 0, 2)
                },
                'models': {
                    'embedding': self.embedding_service.get_model_info(),
                    'llm': self.llm_service.get_model_info()
                }
            }

        finally:
            cursor.close()
            conn.close()


# Factory function
def create_rag_service(
    embedding_provider: str = None,
    llm_provider: str = None
) -> RAGService:
    """
    Factory function to create a RAG service with default configurations.

    Args:
        embedding_provider: Embedding provider ('openai', 'sentence-transformers')
        llm_provider: LLM provider ('openai', 'anthropic', 'ollama')

    Returns:
        Initialized RAGService
    """
    embedding_service = create_embedding_service(provider=embedding_provider)
    llm_service = create_llm_service(provider=llm_provider)
    vector_search_service = create_vector_search_service(embedding_service)

    return RAGService(
        embedding_service=embedding_service,
        llm_service=llm_service,
        vector_search_service=vector_search_service
    )
