import mariadb
import time
from config import Config

class DatabaseConnection:
    _pool = None

    @classmethod
    def get_pool(cls):
        if cls._pool is None:
            try:
                pool_config = dict(
                    host=Config.DB_HOST,
                    port=Config.DB_PORT,
                    user=Config.DB_USER,
                    password=Config.DB_PASSWORD,
                    database=Config.DB_NAME,
                    pool_name='skychat_pool',
                    pool_size=10,
                )

                if Config.DB_SSL:
                    pool_config["ssl"] = True

                    if Config.DB_SSL_VERIFY_CERT:
                        pool_config["ssl_verify_cert"] = True
                    if Config.DB_SSL_CA_PATH:
                        pool_config["ssl_ca"] = Config.DB_SSL_CA_PATH
                    if Config.DB_SSL_CERT_PATH:
                        pool_config["ssl_cert"] = Config.DB_SSL_CERT_PATH
                    if Config.DB_SSL_KEY_PATH:
                        pool_config["ssl_key"] = Config.DB_SSL_KEY_PATH
                else:
                    pool_config["ssl"] = False

                cls._pool = mariadb.ConnectionPool(**pool_config)
                print(f"Connected to MariaDB at {Config.DB_HOST}:{Config.DB_PORT}")
            except mariadb.Error as e:
                print(f"Error connecting to MariaDB: {e}")
                raise
        return cls._pool

    @classmethod
    def get_connection(cls):
        pool = cls.get_pool()
        try:
            conn = pool.get_connection()
            return conn
        except mariadb.Error as e:
            print(f"Error getting connection from pool: {e}")
            raise

    @classmethod
    def execute_query(cls, query, params=None, fetch=True, track_time=False):
        conn = None
        cursor = None
        start_time = time.perf_counter() if track_time else None

        try:
            conn = cls.get_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute(query, params or ())

            if fetch:
                result = cursor.fetchall()
                if track_time:
                    end_time = time.perf_counter()
                    execution_time = round((end_time - start_time) * 1000, 2)  # ms
                    return result, execution_time
                return result
            else:
                conn.commit()
                if track_time:
                    end_time = time.perf_counter()
                    execution_time = round((end_time - start_time) * 1000, 2)  # ms
                    return cursor.lastrowid, execution_time
                return cursor.lastrowid
        except mariadb.Error as e:
            print(f"Error executing query: {e}")
            if conn:
                conn.rollback()
            raise
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    @classmethod
    def execute_many(cls, query, data):
        conn = None
        cursor = None
        try:
            conn = cls.get_connection()
            cursor = conn.cursor()
            cursor.executemany(query, data)
            conn.commit()
            return cursor.rowcount
        except mariadb.Error as e:
            print(f"Error executing batch query: {e}")
            if conn:
                conn.rollback()
            raise
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()


# Helper function for backward compatibility
def get_connection():
    """Get a database connection from the pool."""
    return DatabaseConnection.get_connection()
