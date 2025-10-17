import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Database Configuration
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = int(os.getenv('DB_PORT', 3306))
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')
    DB_NAME = os.getenv('DB_NAME', 'skychat')

    # Flask Configuration
    PORT = int(os.getenv('PORT', 5000))
    DEBUG = os.getenv('FLASK_ENV', 'development') == 'development'

    # OpenFlights URLs
    AIRPORTS_URL = os.getenv('AIRPORTS_URL', 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat')
    AIRLINES_URL = os.getenv('AIRLINES_URL', 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat')
    ROUTES_URL = os.getenv('ROUTES_URL', 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/routes.dat')
