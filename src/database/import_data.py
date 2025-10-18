import os
import sys
import csv
from pathlib import Path

# Add parent directories to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.database.connection import DatabaseConnection
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

def get_data_file(filename):
    """Get path to data file"""
    data_dir = Path(__file__).parent.parent.parent / 'data'
    filepath = data_dir / filename

    if not filepath.exists():
        print(f"❌ Error: {filename} not found at {filepath}")
        print("Please ensure the data files are downloaded first")
        sys.exit(1)

    return str(filepath)

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
    """Import all OpenFlights data from local files"""
    print("🚀 SkyChat Data Import Starting...")
    print("=" * 60)

    try:
        # Get data files
        airports_file = get_data_file('airports.dat')
        airlines_file = get_data_file('airlines.dat')
        routes_file = get_data_file('routes.dat')

        # Import airports first (foreign key dependency)
        print("\n📍 Importing airports...")
        airports_count = import_csv(airports_file, 'airports', AIRPORT_FIELDS)

        # Import airlines
        print("\n✈️  Importing airlines...")
        airlines_count = import_csv(airlines_file, 'airlines', AIRLINE_FIELDS)

        # Import routes
        print("\n🌍 Importing routes...")
        routes_count = import_csv(routes_file, 'routes', ROUTE_FIELDS)

        print("\n" + "=" * 60)
        print("🎉 Import Complete!")
        print(f"   Airports: {airports_count:,}")
        print(f"   Airlines: {airlines_count:,}")
        print(f"   Routes:   {routes_count:,}")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ Error importing data: {e}")
        raise

if __name__ == "__main__":
    import_all_data()
