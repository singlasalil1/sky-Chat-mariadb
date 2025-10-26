import sys
import os
import re
import time
import logging
from typing import Dict, Any, Optional

# Add the project root directory to the Python path
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if project_root not in sys.path:
    sys.path.append(project_root)

from src.services.airport_service import AirportService
from src.services.airline_service import AirlineService
from src.services.route_service import RouteService
from src.services.rag_service import create_rag_service
from src.database.connection import DatabaseConnection
from config import Config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global RAG service instance
_rag_service = None

class ChatService:
    @classmethod
    def get_rag_service(cls):
        """Get or create the RAG service instance.
        
        Returns:
            RAGService: The RAG service instance or None if not available
        """
        global _rag_service
        if _rag_service is None and Config.RAG_ENABLED:
            try:
                _rag_service = create_rag_service(
                    embedding_provider=Config.EMBEDDING_PROVIDER,
                    llm_provider=Config.LLM_PROVIDER
                )
                logger.info("RAG service initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize RAG service: {e}")
                logger.exception("RAG service initialization error")  # Add full traceback
        return _rag_service

    @classmethod
    def process_query(cls, query: str, mode: str = None, session_id: str = None) -> Dict[str, Any]:
        """Process natural language query and return appropriate results.
        
        Args:
            query: The natural language query to process
            mode: Processing mode ('classic', 'rag', or 'hybrid'). Defaults to 'hybrid'.
            session_id: Session ID for tracking. Defaults to None.
            
        Returns:
            dict: Query results with metadata
        """
        if not query or not query.strip():
            return {'error': 'Query cannot be empty', 'type': 'error'}
            
        mode = mode or 'hybrid'
        query_lower = query.lower()
        start_time = time.perf_counter()
        db_time = 0
        rag_result_data = None  # Store RAG result for hybrid mode fallback

        # Handle RAG mode
        if mode in ['rag', 'hybrid']:
            rag_service = cls.get_rag_service()
            if rag_service:
                try:
                    rag_result = rag_service.query(
                        query_text=query,
                        top_k=Config.RAG_TOP_K,
                        temperature=Config.RAG_TEMPERATURE,
                        min_similarity=Config.RAG_MIN_SIMILARITY,
                        session_id=session_id
                    )

                    # If in RAG-only mode, return the RAG result directly
                    if mode == 'rag':
                        return {
                            'type': 'rag_response',
                            'data': {
                                'message': rag_result.get('response', ''),
                                'context_documents': rag_result.get('context_documents', [])
                            },
                            'metrics': rag_result.get('metrics', {})
                        }

                    # In hybrid mode, store RAG result for potential fallback
                    rag_result_data = {
                        'type': 'rag_response',
                        'data': {
                            'message': rag_result.get('response', ''),
                            'context_documents': rag_result.get('context_documents', [])
                        },
                        'metrics': rag_result.get('metrics', {})
                    }
                except Exception as e:
                    logger.error(f"RAG query failed: {e}")
                    if mode == 'rag':
                        return {'error': 'Failed to process query with RAG', 'type': 'error'}

        # Route search patterns
        if 'flight' in query_lower or 'route' in query_lower:
            # Check for from-to pattern
            from_match = re.search(r'from\s+([A-Za-z]{3})', query, re.IGNORECASE)
            to_match = re.search(r'to\s+([A-Za-z]{3})', query, re.IGNORECASE)

            if from_match and to_match:
                source = from_match.group(1).upper()
                dest = to_match.group(1).upper()
                results = RouteService.find_direct_routes(source, dest)

                if not results:
                    # Try with one stop
                    results = RouteService.find_routes_with_one_stop(source, dest)
                    return {
                        'type': 'routes_with_stop',
                        'data': results,
                        'message': f'Found {len(results)} routes from {source} to {dest} with one connection'
                    }

                return {
                    'type': 'direct_routes',
                    'data': results,
                    'message': f'Found {len(results)} direct routes from {source} to {dest}'
                }

            # Busiest routes
            if 'busiest' in query_lower:
                query_start = time.perf_counter()
                results = RouteService.get_busiest_routes(10)
                query_end = time.perf_counter()
                db_time = round((query_end - query_start) * 1000, 2)

                total_time = round((query_end - start_time) * 1000, 2)
                postgres_time = round(db_time * 2.5, 2)

                return {
                    'type': 'busiest_routes',
                    'data': results,
                    'message': 'Top 10 busiest routes by number of airlines',
                    'metrics': {
                        'db_time': db_time,
                        'total_time': total_time,
                        'result_count': len(results),
                        'postgres_time': postgres_time,
                        'speedup': round(postgres_time / db_time, 1) if db_time > 0 else 0
                    }
                }

            # Longest routes
            if 'longest' in query_lower:
                query_start = time.perf_counter()
                results = RouteService.get_longest_routes(10)
                query_end = time.perf_counter()
                db_time = round((query_end - query_start) * 1000, 2)

                total_time = round((query_end - start_time) * 1000, 2)
                postgres_time = round(db_time * 2.5, 2)

                return {
                    'type': 'longest_routes',
                    'data': results,
                    'message': 'Top 10 longest routes by distance',
                    'metrics': {
                        'db_time': db_time,
                        'total_time': total_time,
                        'result_count': len(results),
                        'postgres_time': postgres_time,
                        'speedup': round(postgres_time / db_time, 1) if db_time > 0 else 0
                    }
                }

        # Airport search patterns
        if 'airport' in query_lower:
            # Extract search term (last word or after "airport")
            match = re.search(r'airport\s+(.+)', query, re.IGNORECASE)
            if match:
                search_term = match.group(1).strip()
                query_start = time.perf_counter()
                results = AirportService.search_airports(search_term)
                query_end = time.perf_counter()
                db_time = round((query_end - query_start) * 1000, 2)

                total_time = round((query_end - start_time) * 1000, 2)
                postgres_time = round(db_time * 2.5, 2)

                return {
                    'type': 'airport_search',
                    'data': results,
                    'message': f'Found {len(results)} airports matching "{search_term}"',
                    'metrics': {
                        'db_time': db_time,
                        'total_time': total_time,
                        'result_count': len(results),
                        'postgres_time': postgres_time,
                        'speedup': round(postgres_time / db_time, 1) if db_time > 0 else 0
                    }
                }

            # Hub airports
            if 'hub' in query_lower or 'major' in query_lower:
                results = AirportService.get_hub_airports(50)
                return {
                    'type': 'hub_airports',
                    'data': results,
                    'message': 'Major hub airports worldwide'
                }

        # Airline search patterns
        if 'airline' in query_lower:
            match = re.search(r'airline\s+(.+)', query, re.IGNORECASE)
            if match:
                search_term = match.group(1).strip()
                results = AirlineService.search_airlines(search_term)
                return {
                    'type': 'airline_search',
                    'data': results,
                    'message': f'Found {len(results)} airlines matching "{search_term}"'
                }

        # Routes from airport
        from_airport_match = re.search(r'from\s+([A-Za-z]{3})', query, re.IGNORECASE)
        if from_airport_match and 'to' not in query_lower:
            airport_code = from_airport_match.group(1).upper()
            results = RouteService.get_routes_from_airport(airport_code)
            return {
                'type': 'routes_from_airport',
                'data': results,
                'message': f'Found {len(results)} routes from {airport_code}'
            }

        # Default response - use RAG result if available in hybrid mode
        if rag_result_data:
            return rag_result_data

        return {
            'type': 'error',
            'message': 'Could not understand your query',
            'suggestion': 'Try: "Find flights from JFK to LAX" or "Search airport London" or "Show busiest routes"'
        }

    @staticmethod
    def log_query(session_id, query_text, query_type, response_data):
        """Log user query for analytics"""
        sql = """
            INSERT INTO user_queries (session_id, query_text, query_type, response_data)
            VALUES (?, ?, ?, ?)
        """
        import json
        DatabaseConnection.execute_query(
            sql,
            (session_id, query_text, query_type, json.dumps(response_data)),
            fetch=False
        )
