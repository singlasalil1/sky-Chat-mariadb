import os
import csv
import requests
from connection import DatabaseConnection
from config import Config

# OpenFlights data field mappings
AIRPORT_FIELDS = ['airport_id', 'name', 'city', 'country', 'iata', 'icao',
                  'latitude', 'longitude', 'altitude', 'timezone_offset',
                  'dst', 'tz_database', 'type', 'source']

AIRLINE_FIELDS = ['airline_id', 'name', 'alias', 'iata', 'icao',
                  'callsign', 'country', 'active']

ROUTE_FIELDS = ['airline_code', 'airline_id', 'source_airport',
                'source_airport_id', 'dest_airport', 'dest_airport_id',
                'codeshare', 'stops', 'equipment']

def download_data(url, filename):
    """Download data file from URL"""
    print(f"Downloading {filename} from {url}...")
    response = requests.get(url)

    data_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'data')
    os.makedirs(data_dir, exist_ok=True)

    filepath = os.path.join(data_dir, filename)
    with open(filepath, 'wb') as f:
        f.write(response.content)

    print(f"Downloaded {filename} successfully!")
    return filepath

def import_csv(filepath, table_name, fields):
    """Import CSV data into database table"""
    print(f"Importing {table_name} from {filepath}...")

    data = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        for row in reader:
            # Replace \N with None for NULL values
            processed_row = [None if val == '\\N' or val == '' else val for val in row]
            # Ensure we have the right number of fields
            if len(processed_row) >= len(fields):
                data.append(tuple(processed_row[:len(fields)]))

    # Batch insert
    placeholders = ','.join(['?' for _ in fields])
    query = f"INSERT IGNORE INTO {table_name} ({','.join(fields)}) VALUES ({placeholders})"

    batch_size = 1000
    total = 0
    for i in range(0, len(data), batch_size):
        batch = data[i:i + batch_size]
        rows = DatabaseConnection.execute_many(query, batch)
        total += rows
        print(f"Imported {i + len(batch)}/{len(data)} records...")

    print(f"Successfully imported {total} records into {table_name}")
    return total

def import_all_data():
    """Download and import all OpenFlights data"""
    try:
        # Download and import airports
        airports_file = download_data(Config.AIRPORTS_URL, 'airports.dat')
        import_csv(airports_file, 'airports', AIRPORT_FIELDS)

        # Download and import airlines
        airlines_file = download_data(Config.AIRLINES_URL, 'airlines.dat')
        import_csv(airlines_file, 'airlines', AIRLINE_FIELDS)

        # Download and import routes
        routes_file = download_data(Config.ROUTES_URL, 'routes.dat')
        import_csv(routes_file, 'routes', ROUTE_FIELDS)

        print("All data imported successfully!")
    except Exception as e:
        print(f"Error importing data: {e}")
        raise

if __name__ == "__main__":
    import_all_data()
