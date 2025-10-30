import os
import sys
import mariadb

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(CURRENT_DIR))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from config import Config

def setup_database():
    """Create database tables from schema file"""
    try:
        # Connect without specifying database first
        conn = mariadb.connect(
            host=Config.DB_HOST,
            port=Config.DB_PORT,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD
        )
        cursor = conn.cursor()

        # Create database if it doesn't exist
        print(f"Creating database {Config.DB_NAME} if not exists...")
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {Config.DB_NAME}")
        cursor.execute(f"USE {Config.DB_NAME}")

        # Read schema file
        schema_path = os.path.join(os.path.dirname(__file__), 'schema', '01_create_tables.sql')
        print(f"Reading schema from {schema_path}...")

        with open(schema_path, 'r') as f:
            schema_sql = f.read()

        # Split and execute each statement
        statements = [stmt.strip() for stmt in schema_sql.split(';') if stmt.strip()]

        print("Creating tables...")
        for statement in statements:
            if statement:
                cursor.execute(statement)

        conn.commit()
        print("Database setup completed successfully!")

    except mariadb.Error as e:
        print(f"Error setting up database: {e}")
        raise
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    setup_database()
