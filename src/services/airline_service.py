import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from src.database.connection import DatabaseConnection

class AirlineService:
    @staticmethod
    def search_airlines(query):
        """Search airlines by name, IATA, ICAO, or country"""
        sql = """
            SELECT * FROM airlines
            WHERE name LIKE ? OR iata LIKE ? OR icao LIKE ? OR country LIKE ?
            ORDER BY active DESC, name
            LIMIT 20
        """
        search_term = f"%{query}%"
        return DatabaseConnection.execute_query(sql, (search_term, search_term, search_term, search_term))

    @staticmethod
    def get_airline_by_id(airline_id):
        """Get airline by ID"""
        sql = "SELECT * FROM airlines WHERE airline_id = ?"
        results = DatabaseConnection.execute_query(sql, (airline_id,))
        return results[0] if results else None

    @staticmethod
    def get_airline_by_iata(iata):
        """Get airline by IATA code"""
        sql = "SELECT * FROM airlines WHERE iata = ?"
        results = DatabaseConnection.execute_query(sql, (iata,))
        return results[0] if results else None

    @staticmethod
    def get_airlines_by_country(country):
        """Get all airlines from a country"""
        sql = "SELECT * FROM airlines WHERE country = ? ORDER BY name"
        return DatabaseConnection.execute_query(sql, (country,))

    @staticmethod
    def get_active_airlines():
        """Get all active airlines"""
        sql = 'SELECT * FROM airlines WHERE active = "Y" ORDER BY name'
        return DatabaseConnection.execute_query(sql)

    @staticmethod
    def get_airline_stats(airline_id):
        """Get statistics for an airline"""
        sql = """
            SELECT
                a.*,
                COUNT(DISTINCT r.route_id) as route_count,
                COUNT(DISTINCT r.source_airport_id) as airports_served,
                COUNT(DISTINCT r.dest_airport_id) as destinations
            FROM airlines a
            LEFT JOIN routes r ON a.airline_id = r.airline_id
            WHERE a.airline_id = ?
            GROUP BY a.airline_id
        """
        results = DatabaseConnection.execute_query(sql, (airline_id,))
        return results[0] if results else None
