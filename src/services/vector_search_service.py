"""
Vector Search Service Module
Handles similarity search for document retrieval using embeddings.
Supports MariaDB storage with Python-side similarity computation.
"""

import json
import numpy as np
from typing import List, Dict, Optional, Tuple
from src.database.connection import DatabaseConnection, get_connection
from src.services.embedding_service import EmbeddingService


class VectorSearchService:
    """
    Service for performing vector similarity search on document embeddings.
    """

    def __init__(self, embedding_service: EmbeddingService):
        """
        Initialize vector search service.

        Args:
            embedding_service: Instance of EmbeddingService for computing similarities
        """
        self.embedding_service = embedding_service

    def search(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        doc_type_filter: Optional[str] = None,
        min_similarity: float = 0.0
    ) -> List[Dict]:
        """
        Search for documents most similar to the query embedding.

        Args:
            query_embedding: Query vector to search for
            top_k: Number of top results to return
            doc_type_filter: Optional filter by document type
            min_similarity: Minimum similarity threshold (0-1)

        Returns:
            List of documents with similarity scores, sorted by relevance
        """
        conn = None
        cursor = None
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor(dictionary=True)

            # Build query to fetch documents with embeddings
            query = """
                SELECT
                    d.doc_id,
                    d.doc_type,
                    d.title,
                    d.content,
                    d.metadata,
                    e.embedding_vector,
                    e.model_name
                FROM documents d
                JOIN embeddings e ON d.doc_id = e.doc_id
            """

            params = []
            if doc_type_filter:
                query += " WHERE d.doc_type = ?"
                params.append(doc_type_filter)

            cursor.execute(query, params)
            rows = cursor.fetchall()

            # Calculate similarities
            results = []
            for row in rows:
                doc_embedding = json.loads(row['embedding_vector'])
                similarity = self.embedding_service.cosine_similarity(
                    query_embedding,
                    doc_embedding
                )

                # Filter by minimum similarity
                if similarity >= min_similarity:
                    results.append({
                        'doc_id': row['doc_id'],
                        'doc_type': row['doc_type'],
                        'title': row['title'],
                        'content': row['content'],
                        'metadata': json.loads(row['metadata']) if row['metadata'] else {},
                        'similarity': similarity,
                        'model_name': row['model_name']
                    })

            # Sort by similarity (descending) and take top_k
            results.sort(key=lambda x: x['similarity'], reverse=True)
            return results[:top_k]

        finally:
            cursor.close()
            conn.close()

    def search_by_text(
        self,
        query_text: str,
        top_k: int = 5,
        doc_type_filter: Optional[str] = None,
        min_similarity: float = 0.0
    ) -> List[Dict]:
        """
        Search for documents by text query (generates embedding automatically).

        Args:
            query_text: Text query
            top_k: Number of top results to return
            doc_type_filter: Optional filter by document type
            min_similarity: Minimum similarity threshold

        Returns:
            List of documents with similarity scores
        """
        # Generate embedding for query text
        query_embedding = self.embedding_service.generate_embedding(query_text)

        # Perform vector search
        return self.search(
            query_embedding=query_embedding,
            top_k=top_k,
            doc_type_filter=doc_type_filter,
            min_similarity=min_similarity
        )

    def hybrid_search(
        self,
        query_text: str,
        top_k: int = 5,
        filters: Optional[Dict] = None,
        min_similarity: float = 0.0
    ) -> List[Dict]:
        """
        Hybrid search combining vector similarity with metadata filtering.

        Args:
            query_text: Text query
            top_k: Number of top results to return
            filters: Dict of metadata filters (e.g., {'airport_id': 123})
            min_similarity: Minimum similarity threshold

        Returns:
            List of documents matching both semantic and metadata criteria
        """
        # Generate embedding
        query_embedding = self.embedding_service.generate_embedding(query_text)

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        try:
            # Build query with metadata filtering
            query = """
                SELECT
                    d.doc_id,
                    d.doc_type,
                    d.title,
                    d.content,
                    d.metadata,
                    e.embedding_vector,
                    e.model_name
                FROM documents d
                JOIN embeddings e ON d.doc_id = e.doc_id
                WHERE 1=1
            """

            params = []

            # Add metadata filters using JSON functions
            if filters:
                for key, value in filters.items():
                    query += f" AND JSON_EXTRACT(d.metadata, '$.{key}') = ?"
                    params.append(value)

            cursor.execute(query, params)
            rows = cursor.fetchall()

            # Calculate similarities
            results = []
            for row in rows:
                doc_embedding = json.loads(row['embedding_vector'])
                similarity = self.embedding_service.cosine_similarity(
                    query_embedding,
                    doc_embedding
                )

                if similarity >= min_similarity:
                    results.append({
                        'doc_id': row['doc_id'],
                        'doc_type': row['doc_type'],
                        'title': row['title'],
                        'content': row['content'],
                        'metadata': json.loads(row['metadata']) if row['metadata'] else {},
                        'similarity': similarity,
                        'model_name': row['model_name']
                    })

            # Sort by similarity and take top_k
            results.sort(key=lambda x: x['similarity'], reverse=True)
            return results[:top_k]

        finally:
            cursor.close()
            conn.close()

    def search_with_reranking(
        self,
        query_text: str,
        top_k: int = 5,
        initial_k: int = 20,
        doc_type_filter: Optional[str] = None
    ) -> List[Dict]:
        """
        Two-stage search: initial retrieval + reranking.
        Useful for improving precision with larger candidate sets.

        Args:
            query_text: Text query
            top_k: Final number of results
            initial_k: Number of candidates to retrieve initially
            doc_type_filter: Optional document type filter

        Returns:
            List of reranked documents
        """
        # Stage 1: Retrieve more candidates
        candidates = self.search_by_text(
            query_text=query_text,
            top_k=initial_k,
            doc_type_filter=doc_type_filter
        )

        # Stage 2: Rerank (could use cross-encoder or more sophisticated scoring)
        # For now, we'll use the same similarity scores but could add:
        # - Recency boost
        # - Document type preferences
        # - Metadata relevance scoring

        reranked = self._rerank_results(query_text, candidates)
        return reranked[:top_k]

    def _rerank_results(self, query_text: str, candidates: List[Dict]) -> List[Dict]:
        """
        Rerank candidate documents using additional signals.

        Args:
            query_text: Original query
            candidates: Initial candidate documents

        Returns:
            Reranked documents
        """
        # Simple reranking: boost recent documents and popular types
        for doc in candidates:
            base_score = doc['similarity']

            # Example boosts (can be customized)
            type_boost = {
                'airport_info': 1.1,
                'route_info': 1.05,
                'airline_info': 1.0,
                'general_knowledge': 0.95
            }.get(doc['doc_type'], 1.0)

            # Apply boosts
            doc['reranked_score'] = base_score * type_boost

        # Sort by reranked score
        candidates.sort(key=lambda x: x.get('reranked_score', x['similarity']), reverse=True)
        return candidates

    def get_statistics(self) -> Dict:
        """
        Get statistics about the vector database.

        Returns:
            Dict with statistics about documents and embeddings
        """
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        try:
            # Count documents by type
            cursor.execute("""
                SELECT doc_type, COUNT(*) as count
                FROM documents
                GROUP BY doc_type
            """)
            doc_counts = {row['doc_type']: row['count'] for row in cursor.fetchall()}

            # Total embeddings
            cursor.execute("SELECT COUNT(*) as count FROM embeddings")
            total_embeddings = cursor.fetchone()['count']

            # Model distribution
            cursor.execute("""
                SELECT model_name, COUNT(*) as count
                FROM embeddings
                GROUP BY model_name
            """)
            model_counts = {row['model_name']: row['count'] for row in cursor.fetchall()}

            return {
                'total_documents': sum(doc_counts.values()),
                'documents_by_type': doc_counts,
                'total_embeddings': total_embeddings,
                'embeddings_by_model': model_counts
            }

        finally:
            cursor.close()
            conn.close()

    def find_similar_documents(self, doc_id: int, top_k: int = 5) -> List[Dict]:
        """
        Find documents similar to a given document.

        Args:
            doc_id: Document ID to find similar documents for
            top_k: Number of similar documents to return

        Returns:
            List of similar documents
        """
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        try:
            # Get the embedding for the source document
            cursor.execute("""
                SELECT embedding_vector
                FROM embeddings
                WHERE doc_id = ?
            """, [doc_id])

            row = cursor.fetchone()
            if not row:
                return []

            source_embedding = json.loads(row['embedding_vector'])

            # Search for similar documents (excluding the source)
            all_results = self.search(
                query_embedding=source_embedding,
                top_k=top_k + 1  # +1 because we'll filter out the source
            )

            # Filter out the source document
            return [r for r in all_results if r['doc_id'] != doc_id][:top_k]

        finally:
            cursor.close()
            conn.close()


# Factory function
def create_vector_search_service(embedding_service: EmbeddingService) -> VectorSearchService:
    """
    Factory function to create a vector search service.

    Args:
        embedding_service: Initialized embedding service

    Returns:
        VectorSearchService instance
    """
    return VectorSearchService(embedding_service)
