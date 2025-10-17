import sys
import os
import re
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from src.services.airport_service import AirportService
from src.services.airline_service import AirlineService
from src.services.route_service import RouteService
from src.database.connection import DatabaseConnection

class ChatService:
    @staticmethod
    def process_query(query):
        """Process natural language query and return appropriate results"""
        query_lower = query.lower()

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
                results = RouteService.get_busiest_routes(10)
                return {
                    'type': 'busiest_routes',
                    'data': results,
                    'message': 'Top 10 busiest routes by number of airlines'
                }

            # Longest routes
            if 'longest' in query_lower:
                results = RouteService.get_longest_routes(10)
                return {
                    'type': 'longest_routes',
                    'data': results,
                    'message': 'Top 10 longest routes by distance'
                }

        # Airport search patterns
        if 'airport' in query_lower:
            # Extract search term (last word or after "airport")
            match = re.search(r'airport\s+(.+)', query, re.IGNORECASE)
            if match:
                search_term = match.group(1).strip()
                results = AirportService.search_airports(search_term)
                return {
                    'type': 'airport_search',
                    'data': results,
                    'message': f'Found {len(results)} airports matching "{search_term}"'
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

        # Default response
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
