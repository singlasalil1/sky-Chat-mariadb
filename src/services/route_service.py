import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from src.database.connection import DatabaseConnection

class RouteService:
    @staticmethod
    def find_direct_routes(source_iata, dest_iata):
        """Find direct routes between two airports"""
        sql = """
            SELECT r.*,
                   a.name as airline_name, a.iata as airline_iata,
                   src.name as source_name, src.city as source_city,
                   dst.name as dest_name, dst.city as dest_city
            FROM routes r
            JOIN airlines a ON r.airline_id = a.airline_id
            JOIN airports src ON r.source_airport_id = src.airport_id
            JOIN airports dst ON r.dest_airport_id = dst.airport_id
            WHERE src.iata = ? AND dst.iata = ?
            ORDER BY a.name
        """
        return DatabaseConnection.execute_query(sql, (source_iata, dest_iata))

    @staticmethod
    def find_routes_with_one_stop(source_iata, dest_iata):
        """Find routes with one connection"""
        sql = """
            SELECT
                r1.source_airport_id,
                r1.dest_airport_id as connection_airport_id,
                r2.dest_airport_id,
                src.iata as source_iata, src.name as source_name,
                conn.iata as connection_iata, conn.name as connection_name,
                dst.iata as dest_iata, dst.name as dest_name,
                a1.name as first_airline, a2.name as second_airline
            FROM routes r1
            JOIN routes r2 ON r1.dest_airport_id = r2.source_airport_id
            JOIN airports src ON r1.source_airport_id = src.airport_id
            JOIN airports conn ON r1.dest_airport_id = conn.airport_id
            JOIN airports dst ON r2.dest_airport_id = dst.airport_id
            JOIN airlines a1 ON r1.airline_id = a1.airline_id
            JOIN airlines a2 ON r2.airline_id = a2.airline_id
            WHERE src.iata = ? AND dst.iata = ?
            LIMIT 20
        """
        return DatabaseConnection.execute_query(sql, (source_iata, dest_iata))

    @staticmethod
    def get_routes_by_airline(airline_iata):
        """Get all routes operated by an airline"""
        sql = """
            SELECT r.*,
                   src.iata as source_iata, src.name as source_name, src.city as source_city,
                   dst.iata as dest_iata, dst.name as dest_name, dst.city as dest_city
            FROM routes r
            JOIN airlines a ON r.airline_id = a.airline_id
            JOIN airports src ON r.source_airport_id = src.airport_id
            JOIN airports dst ON r.dest_airport_id = dst.airport_id
            WHERE a.iata = ?
            ORDER BY src.iata, dst.iata
        """
        return DatabaseConnection.execute_query(sql, (airline_iata,))

    @staticmethod
    def get_routes_from_airport(airport_iata):
        """Get all routes departing from an airport"""
        sql = """
            SELECT r.*,
                   a.name as airline_name, a.iata as airline_iata,
                   dst.iata as dest_iata, dst.name as dest_name, dst.city as dest_city, dst.country as dest_country
            FROM routes r
            JOIN airlines a ON r.airline_id = a.airline_id
            JOIN airports src ON r.source_airport_id = src.airport_id
            JOIN airports dst ON r.dest_airport_id = dst.airport_id
            WHERE src.iata = ?
            ORDER BY dst.city
        """
        return DatabaseConnection.execute_query(sql, (airport_iata,))

    @staticmethod
    def get_busiest_routes(limit=10):
        """Get busiest routes by number of airlines"""
        sql = """
            SELECT
                src.iata as source_iata, src.name as source_name, src.city as source_city,
                dst.iata as dest_iata, dst.name as dest_name, dst.city as dest_city,
                COUNT(DISTINCT r.airline_id) as airline_count
            FROM routes r
            JOIN airports src ON r.source_airport_id = src.airport_id
            JOIN airports dst ON r.dest_airport_id = dst.airport_id
            GROUP BY r.source_airport_id, r.dest_airport_id
            ORDER BY airline_count DESC
            LIMIT ?
        """
        return DatabaseConnection.execute_query(sql, (limit,))

    @staticmethod
    def get_longest_routes(limit=10):
        """Get longest routes by distance"""
        sql = """
            SELECT
                src.iata as source_iata, src.name as source_name, src.city as source_city,
                dst.iata as dest_iata, dst.name as dest_name, dst.city as dest_city,
                a.name as airline_name,
                (6371 * acos(cos(radians(src.latitude)) * cos(radians(dst.latitude)) *
                cos(radians(dst.longitude) - radians(src.longitude)) +
                sin(radians(src.latitude)) * sin(radians(dst.latitude)))) AS distance_km
            FROM routes r
            JOIN airports src ON r.source_airport_id = src.airport_id
            JOIN airports dst ON r.dest_airport_id = dst.airport_id
            JOIN airlines a ON r.airline_id = a.airline_id
            ORDER BY distance_km DESC
            LIMIT ?
        """
        return DatabaseConnection.execute_query(sql, (limit,))
