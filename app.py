from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os
import sys

# Add project root to path
sys.path.append(os.path.dirname(__file__))

from config import Config
from src.services.airport_service import AirportService
from src.services.airline_service import AirlineService
from src.services.route_service import RouteService
from src.services.chat_service import ChatService

app = Flask(__name__, static_folder='public')
CORS(app)

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'service': 'SkyChat'})

# Chat endpoint
@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        query = data.get('query')
        session_id = data.get('sessionId', 'default')

        if not query:
            return jsonify({'error': 'Query is required'}), 400

        result = ChatService.process_query(query)

        # Log query (optional)
        try:
            ChatService.log_query(session_id, query, result.get('type', 'unknown'), result)
        except Exception as e:
            print(f"Error logging query: {e}")

        # Extract metrics if available
        metrics = result.get('metrics', {})

        return jsonify({
            'query': query,
            'result': result,
            'metrics': metrics
        })

    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

# Airport endpoints
@app.route('/api/airports/search', methods=['GET'])
def search_airports():
    try:
        query = request.args.get('q', '')
        results = AirportService.search_airports(query)
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/airports/<int:airport_id>', methods=['GET'])
def get_airport_by_id(airport_id):
    try:
        airport = AirportService.get_airport_by_id(airport_id)
        if airport:
            return jsonify(airport)
        return jsonify({'error': 'Airport not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/airports/iata/<string:iata>', methods=['GET'])
def get_airport_by_iata(iata):
    try:
        airport = AirportService.get_airport_by_iata(iata)
        if airport:
            return jsonify(airport)
        return jsonify({'error': 'Airport not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/airports/nearby', methods=['GET'])
def get_nearby_airports():
    try:
        lat = float(request.args.get('lat'))
        lon = float(request.args.get('lon'))
        radius = int(request.args.get('radius', 100))
        results = AirportService.get_nearby_airports(lat, lon, radius)
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/airports/country/<string:country>', methods=['GET'])
def get_airports_by_country(country):
    try:
        results = AirportService.get_airports_by_country(country)
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/airports/hubs', methods=['GET'])
def get_hub_airports():
    try:
        min_routes = int(request.args.get('min_routes', 50))
        results = AirportService.get_hub_airports(min_routes)
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Airline endpoints
@app.route('/api/airlines/search', methods=['GET'])
def search_airlines():
    try:
        query = request.args.get('q', '')
        results = AirlineService.search_airlines(query)
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/airlines/<int:airline_id>', methods=['GET'])
def get_airline_by_id(airline_id):
    try:
        airline = AirlineService.get_airline_by_id(airline_id)
        if airline:
            return jsonify(airline)
        return jsonify({'error': 'Airline not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/airlines/iata/<string:iata>', methods=['GET'])
def get_airline_by_iata(iata):
    try:
        airline = AirlineService.get_airline_by_iata(iata)
        if airline:
            return jsonify(airline)
        return jsonify({'error': 'Airline not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/airlines/country/<string:country>', methods=['GET'])
def get_airlines_by_country(country):
    try:
        results = AirlineService.get_airlines_by_country(country)
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/airlines/active', methods=['GET'])
def get_active_airlines():
    try:
        results = AirlineService.get_active_airlines()
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/airlines/<int:airline_id>/stats', methods=['GET'])
def get_airline_stats(airline_id):
    try:
        stats = AirlineService.get_airline_stats(airline_id)
        if stats:
            return jsonify(stats)
        return jsonify({'error': 'Airline not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Route endpoints
@app.route('/api/routes/direct', methods=['GET'])
def find_direct_routes():
    try:
        source = request.args.get('from', '').upper()
        dest = request.args.get('to', '').upper()

        if not source or not dest:
            return jsonify({'error': 'Both "from" and "to" parameters are required'}), 400

        results = RouteService.find_direct_routes(source, dest)
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/routes/with-stop', methods=['GET'])
def find_routes_with_stop():
    try:
        source = request.args.get('from', '').upper()
        dest = request.args.get('to', '').upper()

        if not source or not dest:
            return jsonify({'error': 'Both "from" and "to" parameters are required'}), 400

        results = RouteService.find_routes_with_one_stop(source, dest)
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/routes/busiest', methods=['GET'])
def get_busiest_routes():
    try:
        limit = int(request.args.get('limit', 10))
        results = RouteService.get_busiest_routes(limit)
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/routes/longest', methods=['GET'])
def get_longest_routes():
    try:
        limit = int(request.args.get('limit', 10))
        results = RouteService.get_longest_routes(limit)
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/routes/airline/<string:iata>', methods=['GET'])
def get_routes_by_airline(iata):
    try:
        results = RouteService.get_routes_by_airline(iata)
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/routes/from/<string:airport_iata>', methods=['GET'])
def get_routes_from_airport(airport_iata):
    try:
        results = RouteService.get_routes_from_airport(airport_iata)
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Serve frontend
@app.route('/')
def index():
    return send_from_directory('public', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('public', path)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=Config.PORT, debug=Config.DEBUG)
