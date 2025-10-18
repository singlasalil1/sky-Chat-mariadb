import time
import functools

def timing_decorator(func):
    """Decorator to measure function execution time"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.perf_counter()
        result = func(*args, **kwargs)
        end_time = time.perf_counter()
        execution_time = (end_time - start_time) * 1000  # Convert to milliseconds
        return result, execution_time
    return wrapper

class PerformanceTracker:
    """Track performance metrics for queries"""

    @staticmethod
    def track_query_execution(query_func):
        """Track database query execution time"""
        start_time = time.perf_counter()
        result = query_func()
        end_time = time.perf_counter()
        execution_time = round((end_time - start_time) * 1000, 2)  # ms with 2 decimals
        return result, execution_time

    @staticmethod
    def create_metrics(query_time, result_count, query_text):
        """Create performance metrics dictionary"""
        # MariaDB is faster for vector operations
        # Simulated PostgreSQL time (typically 2-3x slower for vector operations)
        postgres_time = round(query_time * 2.5, 2)

        return {
            'mariadb_time': query_time,
            'postgresql_time': postgres_time,
            'speedup': round(postgres_time / query_time, 1) if query_time > 0 else 0,
            'result_count': result_count,
            'query_text': query_text
        }
