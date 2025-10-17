import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from src.database.connection import DatabaseConnection

class AirportService:
    @staticmethod
    def search_airports(query):
        """Search airports by name, city, country, or IATA code"""
        sql = """
            SELECT * FROM airports
            WHERE name LIKE ? OR city LIKE ? OR country LIKE ? OR iata LIKE ?
            LIMIT 10
        """
        search_term = f"%{query}%"
        return DatabaseConnection.execute_query(sql, (search_term, search_term, search_term, search_term))

    @staticmethod
    def get_airport_by_id(airport_id):
        """Get airport by ID"""
        sql = "SELECT * FROM airports WHERE airport_id = ?"
        results = DatabaseConnection.execute_query(sql, (airport_id,))
        return results[0] if results else None

    @staticmethod
    def get_airport_by_iata(iata):
        """Get airport by IATA code"""
        sql = "SELECT * FROM airports WHERE iata = ?"
        results = DatabaseConnection.execute_query(sql, (iata,))
        return results[0] if results else None

    @staticmethod
    def get_nearby_airports(latitude, longitude, radius_km=100):
        """Get nearby airports using Haversine formula"""
        sql = """
            SELECT *,
                (6371 * acos(cos(radians(?)) * cos(radians(latitude)) *
                cos(radians(longitude) - radians(?)) + sin(radians(?)) *
                sin(radians(latitude)))) AS distance
            FROM airports
            HAVING distance < ?
            ORDER BY distance
            LIMIT 10
        """
        return DatabaseConnection.execute_query(sql, (latitude, longitude, latitude, radius_km))

    @staticmethod
    def get_airports_by_country(country):
        """Get all airports in a country"""
        sql = "SELECT * FROM airports WHERE country = ? ORDER BY name"
        return DatabaseConnection.execute_query(sql, (country,))

    @staticmethod
    def get_hub_airports(min_routes=50):
        """Get major hub airports based on route count"""
        sql = """
            SELECT a.*, COUNT(DISTINCT r.route_id) as route_count
            FROM airports a
            JOIN routes r ON a.airport_id = r.source_airport_id
            GROUP BY a.airport_id
            HAVING route_count >= ?
            ORDER BY route_count DESC
            LIMIT 20
        """
        return DatabaseConnection.execute_query(sql, (min_routes,))
