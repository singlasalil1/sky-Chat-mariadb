"""
Knowledge Base Builder Module
Generates rich text documents from structured flight data for RAG.
Converts airports, airlines, and routes into searchable knowledge documents.
"""

import json
from decimal import Decimal
from typing import List, Dict, Optional
from src.database.connection import DatabaseConnection

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)



class KnowledgeBaseBuilder:
    """
    Service for building a knowledge base from structured flight data.
    """

    def __init__(self):
        """Initialize knowledge base builder."""
        pass

    def build_airport_documents(self, limit: Optional[int] = None) -> List[Dict]:
        """
        Generate rich text documents from airport data.

        Args:
            limit: Optional limit on number of airports to process

        Returns:
            List of document dictionaries ready for insertion
        """
        conn = None
        cursor = None
        try:
            # Initialize connection pool first
            DatabaseConnection.get_pool()
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor(dictionary=True)

            # Use minimal set of columns that are guaranteed to exist
            query = """
                SELECT
                    airport_id,
                    name,
                    city,
                    country,
                    iata,
                    icao,
                    latitude,
                    longitude,
                    altitude,
                    type,
                    source
                FROM airports
                WHERE iata IS NOT NULL AND iata != ''
                ORDER BY name
            """

            if limit:
                query += f" LIMIT {int(limit)}"

            cursor.execute(query)
            airports = cursor.fetchall()

            documents = []
            for airport in airports:
                doc_id = f"airport_{airport['iata']}"
                title = f"{airport['name']} Airport ({airport['iata']})"

                # Generate rich text content
                content = self._generate_airport_content(airport)

                documents.append({
                    'doc_id': doc_id,
                    'title': title,
                    'content': content,
                    'doc_type': 'airport',
                    'metadata': {
                        'iata': airport['iata'],
                        'city': airport['city'],
                        'country': airport['country'],
                        'latitude': airport['latitude'],
                        'longitude': airport['longitude']
                    }
                })

            print(f"✓ Generated {len(documents)} airport documents")
            return documents

        finally:
            cursor.close()
            conn.close()

    def _generate_airport_content(self, airport: Dict) -> str:
        """Generate rich text content for an airport."""
        parts = []
        
        # List of island nations for context
        island_nations = [
            'Iceland', 'New Zealand', 'Japan', 'Philippines', 'Indonesia',
            'United Kingdom', 'Ireland', 'Cuba', 'Jamaica', 'Haiti',
            'Dominican Republic', 'Bahamas', 'Fiji', 'Maldives', 'Malta',
            'Cyprus', 'Sri Lanka', 'Madagascar', 'Singapore', 'Taiwan',
            'Mauritius', 'Seychelles', 'Cape Verde', 'Comoros', 'Vanuatu',
            'Samoa', 'Tonga', 'Kiribati', 'Marshall Islands', 'Micronesia',
            'Palau', 'Antigua and Barbuda', 'Saint Lucia', 'Grenada',
            'Saint Vincent and the Grenadines', 'Barbados', 'Trinidad and Tobago'
        ]

        # Basic info
        parts.append(f"{airport['name']} is an airport with IATA code {airport['iata']}")

        if airport['icao']:
            parts[-1] += f" and ICAO code {airport['icao']}"
        parts[-1] += "."

        # Location with island nation context
        location = f"{airport['city']}, {airport['country']}"
        if airport['country'] in island_nations:
            parts.append(f"It is located in {location}, which is an island nation.")
        else:
            parts.append(f"It is located in {location}.")

        # Geographic coordinates
        if airport['latitude'] and airport['longitude']:
            parts.append(
                f"The airport is positioned at coordinates "
                f"{airport['latitude']:.4f}°, {airport['longitude']:.4f}°."
            )

        # Altitude
        if airport['altitude']:
            altitude_ft = airport['altitude']
            altitude_m = altitude_ft * 0.3048
            parts.append(f"It sits at an altitude of {altitude_ft} feet ({altitude_m:.0f} meters).")

        # Additional context (could be expanded with route data)
        parts.append(
            f"Travelers can identify this airport by its {airport['iata']} code "
            f"when booking flights or checking flight information."
        )

        return " ".join(parts)

    def build_airline_documents(self, limit: Optional[int] = None) -> List[Dict]:
        """
        Generate rich text documents from airline data.

        Args:
            limit: Optional limit on number of airlines to process

        Returns:
            List of document dictionaries
        """
        conn = None
        cursor = None
        try:
            # Initialize connection pool first
            DatabaseConnection.get_pool()
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor(dictionary=True)

            query = """
                SELECT
                    airline_id,
                    name,
                    alias,
                    iata,
                    icao,
                    callsign,
                    country,
                    active
                FROM airlines
                WHERE active = 'Y' AND iata IS NOT NULL AND iata != ''
            """

            if limit:
                query += f" LIMIT {limit}"

            cursor.execute(query)
            airlines = cursor.fetchall()

            documents = []
            for airline in airlines:
                content = self._generate_airline_content(airline)

                metadata = {
                    'airline_id': airline['airline_id'],
                    'iata': airline['iata'],
                    'icao': airline['icao'],
                    'country': airline['country'],
                    'active': airline['active'] == 'Y'
                }

                documents.append({
                    'doc_type': 'airline_info',
                    'title': f"{airline['name']} ({airline['iata']})",
                    'content': content,
                    'metadata': json.dumps(metadata)
                })

            print(f"✓ Generated {len(documents)} airline documents")
            return documents

        finally:
            cursor.close()
            conn.close()

    def _generate_airline_content(self, airline: Dict) -> str:
        """Generate rich text content for an airline."""
        parts = []

        # Basic info
        parts.append(
            f"{airline['name']} is an airline operating under IATA code {airline['iata']}"
        )

        if airline['icao']:
            parts[-1] += f" and ICAO code {airline['icao']}"
        parts[-1] += "."

        # Alias
        if airline['alias'] and airline['alias'] != '\\N':
            parts.append(f"Also known as {airline['alias']}.")

        # Country
        parts.append(f"This airline is based in {airline['country']}.")

        # Callsign
        if airline['callsign'] and airline['callsign'] != '\\N':
            parts.append(f"Its radio callsign is {airline['callsign']}.")

        # Status
        if airline['active'] == 'Y':
            parts.append("The airline is currently active and operating flights.")

        return " ".join(parts)

    def build_route_documents(self, limit: Optional[int] = None) -> List[Dict]:
        """
        Generate documents for popular routes and connections.

        Args:
            limit: Optional limit on number of routes to process

        Returns:
            List of document dictionaries
        """
        conn = None
        cursor = None
        try:
            # Initialize connection pool first
            DatabaseConnection.get_pool()
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor(dictionary=True)

            # Get popular routes (by frequency)
            query = """
                SELECT
                    r.source_airport_id,
                    r.dest_airport_id,
                    sa.name as source_name,
                    sa.iata as source_iata,
                    sa.city as source_city,
                    sa.country as source_country,
                    da.name as dest_name,
                    da.iata as dest_iata,
                    da.city as dest_city,
                    da.country as dest_country,
                    COUNT(*) as airline_count,
                    GROUP_CONCAT(DISTINCT al.name SEPARATOR ', ') as airlines
                FROM routes r
                JOIN airports sa ON r.source_airport_id = sa.airport_id
                JOIN airports da ON r.dest_airport_id = da.airport_id
                LEFT JOIN airlines al ON r.airline_id = al.airline_id
                WHERE sa.iata IS NOT NULL AND da.iata IS NOT NULL
                GROUP BY r.source_airport_id, r.dest_airport_id,
                         sa.name, sa.iata, sa.city, sa.country,
                         da.name, da.iata, da.city, da.country
                HAVING airline_count >= 2
                ORDER BY airline_count DESC
            """

            if limit:
                query += f" LIMIT {limit}"

            cursor.execute(query)
            routes = cursor.fetchall()

            documents = []
            for route in routes:
                content = self._generate_route_content(route)

                metadata = {
                    'source_airport_id': route['source_airport_id'],
                    'dest_airport_id': route['dest_airport_id'],
                    'source_iata': route['source_iata'],
                    'dest_iata': route['dest_iata'],
                    'source_city': route['source_city'],
                    'dest_city': route['dest_city'],
                    'airline_count': route['airline_count']
                }

                title = f"Route: {route['source_iata']} to {route['dest_iata']}"

                documents.append({
                    'doc_type': 'route_info',
                    'title': title,
                    'content': content,
                    'metadata': json.dumps(metadata)
                })

            print(f"✓ Generated {len(documents)} route documents")
            return documents

        finally:
            cursor.close()
            conn.close()

    def _generate_route_content(self, route: Dict) -> str:
        """Generate rich text content for a route."""
        parts = []

        # Route description
        parts.append(
            f"There is a flight route from {route['source_name']} ({route['source_iata']}) "
            f"in {route['source_city']}, {route['source_country']} "
            f"to {route['dest_name']} ({route['dest_iata']}) "
            f"in {route['dest_city']}, {route['dest_country']}."
        )

        # Airline count
        parts.append(
            f"This route is served by {route['airline_count']} different airline(s)."
        )

        # Airlines (if available)
        if route['airlines']:
            airlines_list = route['airlines']
            if len(airlines_list) < 200:  # Reasonable length
                parts.append(f"Airlines operating this route include: {airlines_list}.")

        # Travel info
        parts.append(
            f"Passengers can book flights on this route using the airport codes "
            f"{route['source_iata']} to {route['dest_iata']}."
        )

        return " ".join(parts)

    def build_hub_documents(self) -> List[Dict]:
        """
        Generate documents about major airport hubs.

        Returns:
            List of hub airport documents
        """
        conn = None
        cursor = None
        try:
            # Initialize connection pool first
            DatabaseConnection.get_pool()
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor(dictionary=True)

            # Find hub airports (those with many outgoing routes)
            cursor.execute("""
                SELECT
                    a.airport_id,
                    a.name,
                    a.iata,
                    a.city,
                    a.country,
                    COUNT(DISTINCT r.dest_airport_id) as destination_count,
                    COUNT(DISTINCT r.airline_id) as airline_count
                FROM airports a
                JOIN routes r ON a.airport_id = r.source_airport_id
                WHERE a.iata IS NOT NULL
                GROUP BY a.airport_id, a.name, a.iata, a.city, a.country
                HAVING destination_count >= 50
                ORDER BY destination_count DESC
                LIMIT 100
            """)

            hubs = cursor.fetchall()

            documents = []
            for hub in hubs:
                content = self._generate_hub_content(hub)

                metadata = {
                    'airport_id': hub['airport_id'],
                    'iata': hub['iata'],
                    'city': hub['city'],
                    'country': hub['country'],
                    'destination_count': hub['destination_count'],
                    'airline_count': hub['airline_count'],
                    'is_hub': True
                }

                documents.append({
                    'doc_type': 'airport_info',
                    'title': f"Major Hub: {hub['name']} ({hub['iata']})",
                    'content': content,
                    'metadata': json.dumps(metadata)
                })

            print(f"✓ Generated {len(documents)} hub airport documents")
            return documents

        finally:
            cursor.close()
            conn.close()

    def _generate_hub_content(self, hub: Dict) -> str:
        """Generate content for hub airports."""
        parts = []

        parts.append(
            f"{hub['name']} ({hub['iata']}) is a major airport hub "
            f"located in {hub['city']}, {hub['country']}."
        )

        parts.append(
            f"As a hub airport, it connects passengers to {hub['destination_count']} "
            f"different destinations worldwide."
        )

        parts.append(
            f"The airport serves as a base or connection point for "
            f"{hub['airline_count']} airlines."
        )

        parts.append(
            "Hub airports typically offer numerous connecting flight options, "
            "making them important transit points for international travel."
        )

        return " ".join(parts)

    def build_alliance_documents(self) -> List[Dict]:
        """
        Create detailed airline alliance knowledge documents.

        Returns:
            List of alliance documents
        """
        documents = []

        # Star Alliance
        documents.append({
            'doc_type': 'alliance_info',
            'title': 'Star Alliance - World\'s Largest Airline Alliance',
            'content': """Star Alliance is the world's largest global airline alliance, founded in 1997. It connects passengers to over 1,300 destinations in more than 190 countries. Star Alliance member airlines include United Airlines, Lufthansa, Air Canada, ANA (All Nippon Airways), Singapore Airlines, Turkish Airlines, Swiss International Air Lines, Austrian Airlines, Brussels Airlines, LOT Polish Airlines, Scandinavian Airlines (SAS), TAP Air Portugal, Avianca, Copa Airlines, Air China, Asiana Airlines, EVA Air, Shenzhen Airlines, Thai Airways, Air India, Aegean Airlines, Ethiopian Airlines, South African Airways, and EgyptAir. Alliance members coordinate their route networks to provide seamless connections through major hub airports. Passengers benefit from unified frequent flyer programs, lounge access, and coordinated schedules. Star Alliance hubs include Frankfurt (Lufthansa), Chicago and Houston (United), Toronto (Air Canada), Tokyo (ANA), Singapore (Singapore Airlines), and Istanbul (Turkish Airlines). The alliance enables member airlines to offer extensive global connectivity without operating all routes themselves, significantly expanding route networks through codeshare agreements and interline connections.""",
            'metadata': json.dumps({
                'alliance_name': 'Star Alliance',
                'founded': 1997,
                'member_count': 26,
                'destinations': 1300,
                'countries': 190,
                'category': 'airline_alliance'
            })
        })

        # OneWorld
        documents.append({
            'doc_type': 'alliance_info',
            'title': 'OneWorld Alliance - Premium Global Network',
            'content': """OneWorld is a global airline alliance founded in 1999, serving over 900 destinations in more than 170 countries. OneWorld member airlines include American Airlines, British Airways, Cathay Pacific, Qantas, Qatar Airways, Iberia, Finnair, Japan Airlines (JAL), Malaysia Airlines, Royal Jordanian, SriLankan Airlines, and Alaska Airlines. The alliance is known for its focus on premium service and strong presence in key business markets. OneWorld members coordinate their route networks to provide comprehensive global coverage, with major hubs at London Heathrow (British Airways), Hong Kong (Cathay Pacific), Dallas and Miami (American Airlines), Sydney (Qantas), Doha (Qatar Airways), Madrid (Iberia), Tokyo (JAL), and Helsinki (Finnair). Passengers enjoy reciprocal benefits including priority boarding, lounge access, and frequent flyer mile accumulation across all member airlines. The alliance structure allows airlines to expand their route networks significantly through partnerships rather than operating all routes independently. OneWorld focuses on connecting major business centers and premium destinations worldwide.""",
            'metadata': json.dumps({
                'alliance_name': 'OneWorld',
                'founded': 1999,
                'member_count': 13,
                'destinations': 900,
                'countries': 170,
                'category': 'airline_alliance'
            })
        })

        # SkyTeam
        documents.append({
            'doc_type': 'alliance_info',
            'title': 'SkyTeam Alliance - Global Airline Partnership',
            'content': """SkyTeam is a global airline alliance founded in 2000, connecting passengers to over 1,000 destinations in more than 170 countries. SkyTeam member airlines include Delta Air Lines, Air France, KLM Royal Dutch Airlines, Korean Air, China Eastern Airlines, China Airlines, Aeroméxico, Aerolíneas Argentinas, Air Europa, Alitalia (ITA Airways), Czech Airlines, Garuda Indonesia, Kenya Airways, Middle East Airlines, Saudia, Tarom, Vietnam Airlines, and XiamenAir. The alliance emphasizes seamless travel through coordinated schedules and shared facilities at major airports. Key SkyTeam hubs include Atlanta and Minneapolis (Delta), Paris (Air France), Amsterdam (KLM), Seoul (Korean Air), Shanghai (China Eastern), Mexico City (Aeroméxico), and Rome (ITA Airways). Alliance members share airport lounges, coordinate flight schedules for convenient connections, and offer reciprocal frequent flyer benefits. SkyTeam's network design allows passengers to connect efficiently between continents through strategically positioned hub airports. The alliance structure enables member airlines to offer extensive route coverage across North America, Europe, Asia, Latin America, Africa, and the Middle East without each airline needing to operate all routes independently.""",
            'metadata': json.dumps({
                'alliance_name': 'SkyTeam',
                'founded': 2000,
                'member_count': 19,
                'destinations': 1000,
                'countries': 170,
                'category': 'airline_alliance'
            })
        })

        # General alliance impact document
        documents.append({
            'doc_type': 'alliance_info',
            'title': 'How Airline Alliances Affect Route Networks',
            'content': """Airline alliances fundamentally transform how route networks operate by enabling cooperation between competing airlines. Alliances expand route coverage dramatically - a single airline might operate 200 destinations, but through alliance partnerships can offer connections to over 1,000 destinations worldwide. This is achieved through codeshare agreements, where airlines sell tickets on each other's flights, and interline agreements that allow seamless baggage transfer and coordinated schedules. Hub coordination is a key benefit: alliance members schedule flights to arrive and depart in coordinated waves at major hubs, minimizing connection times for passengers. For example, Star Alliance coordinates schedules at Frankfurt, allowing efficient connections between European, Asian, and American flights. Route networks become more efficient as alliance members avoid duplicating routes and instead focus on feeding passengers to partner airlines. Smaller airlines gain access to global networks they couldn't build independently, while large carriers expand their reach without the cost of operating additional aircraft. Passengers benefit from unified frequent flyer programs, shared airport lounges, and consistent service standards across member airlines. Alliances also enable airlines to maintain virtual presence in markets they don't serve directly - American Airlines can sell tickets to Bangkok via partner Japan Airlines without flying there themselves. This alliance structure has reshaped global aviation from isolated airline networks into three major alliance ecosystems (Star Alliance, OneWorld, SkyTeam) plus independent carriers.""",
            'metadata': json.dumps({
                'topic': 'alliance_impact',
                'category': 'airline_alliance',
                'keywords': ['route networks', 'codeshare', 'hub coordination', 'connectivity']
            })
        })

        # Codeshare and partnerships document
        documents.append({
            'doc_type': 'alliance_info',
            'title': 'Codeshare Agreements and Airline Partnerships',
            'content': """Codeshare agreements are the foundation of modern airline alliances and route network expansion. In a codeshare arrangement, one airline operates the flight while partner airlines sell seats using their own flight numbers. For example, a flight from New York to Frankfurt operated by Lufthansa (LH400) might also be sold as United UA8840, Air Canada AC9040, and other Star Alliance partners. This allows airlines to offer more destinations without operating additional aircraft. There are several types of partnerships: Codeshare agreements (shared flight numbers), interline agreements (coordinated ticketing and baggage), joint ventures (revenue sharing on specific routes), and full alliance membership (comprehensive cooperation). Alliances coordinate beyond just codeshares - they align schedules so connecting flights arrive and depart efficiently, share airport facilities like lounges and check-in counters, and integrate frequent flyer programs. Metal-neutral joint ventures go further, with airlines sharing revenues on entire route networks, essentially operating as a single carrier on those routes. Examples include the transatlantic joint venture between Air France-KLM, Delta, and Virgin Atlantic. These partnerships dramatically expand each airline's effective network size while allowing them to focus aircraft and resources on routes they operate most efficiently.""",
            'metadata': json.dumps({
                'topic': 'codeshare_partnerships',
                'category': 'airline_alliance',
                'keywords': ['codeshare', 'partnerships', 'joint ventures', 'cooperation']
            })
        })

        # Hub-and-spoke impact
        documents.append({
            'doc_type': 'alliance_info',
            'title': 'Alliance Hub-and-Spoke Networks and Connectivity',
            'content': """Airline alliances optimize global connectivity through coordinated hub-and-spoke networks. Each alliance member operates focused hubs in their region, and alliances coordinate schedules across these hubs to create seamless worldwide connectivity. Star Alliance exemplifies this with major hubs including Frankfurt and Munich (Lufthansa), Chicago and Houston (United), Toronto (Air Canada), Tokyo (ANA), Singapore (Singapore Airlines), and Istanbul (Turkish Airlines). A passenger traveling from Denver to Bangkok might fly United to San Francisco, then connect to ANA to Tokyo, and finally Thai Airways to Bangkok - all on a single ticket with coordinated schedules and checked baggage. Hub coordination involves banking - airlines schedule multiple arrivals during a short window, allow connection time, then schedule coordinated departures. This creates waves of connectivity throughout the day. Alliance partners time their long-haul flights to align with these waves. Without alliances, airlines would need to operate point-to-point routes between hundreds of city pairs. Hub-and-spoke alliance networks reduce this to each airline operating efficiently within their region and feeding passengers to alliance partners. This is why passengers flying internationally often connect through multiple hubs operated by different alliance member airlines. The system maximizes route coverage while minimizing the number of aircraft and routes each individual airline must operate.""",
            'metadata': json.dumps({
                'topic': 'hub_spoke_alliances',
                'category': 'airline_alliance',
                'keywords': ['hub airports', 'connectivity', 'network design', 'connections']
            })
        })

        print(f"✓ Generated {len(documents)} alliance documents")
        return documents

    def build_general_knowledge_documents(self) -> List[Dict]:
        """
        Create general aviation knowledge documents.

        Returns:
            List of general knowledge documents
        """
        documents = []

        # Airport codes
        documents.append({
            'doc_type': 'general_knowledge',
            'title': 'Understanding Airport Codes (IATA and ICAO)',
            'content': """Airports are identified by standardized codes. The IATA (International Air Transport Association) code is a three-letter code used for passenger bookings and baggage tags, like JFK for John F. Kennedy International Airport or LAX for Los Angeles International Airport. The ICAO (International Civil Aviation Organization) code is a four-letter code used for air traffic control and flight planning, like KJFK or KLAX. When booking flights, passengers typically use IATA codes.""",
            'metadata': json.dumps({'topic': 'airport_codes', 'category': 'basics'})
        })

        # Flight routes
        documents.append({
            'doc_type': 'general_knowledge',
            'title': 'Direct Flights vs. Connecting Flights',
            'content': """A direct flight travels from the origin airport to the destination airport without any stops, offering the fastest travel time. Connecting flights require at least one stop at an intermediate airport where passengers may need to change planes. While direct flights are more convenient, connecting flights often offer more scheduling flexibility and can sometimes be more economical. When searching for flights, the number of stops is an important consideration for travel planning.""",
            'metadata': json.dumps({'topic': 'flight_types', 'category': 'travel_planning'})
        })

        # Hub airports
        documents.append({
            'doc_type': 'general_knowledge',
            'title': 'What is a Hub Airport?',
            'content': """A hub airport is a major airport that serves as a central connection point for an airline or multiple airlines. Hub airports typically have a high volume of connecting flights, allowing passengers to transfer between flights to reach their final destinations. Major hubs often serve hundreds of destinations and are operated by one or more dominant airlines. Examples include major international airports that connect flights from multiple regions.""",
            'metadata': json.dumps({'topic': 'hub_airports', 'category': 'infrastructure'})
        })

        # Airline operations
        documents.append({
            'doc_type': 'general_knowledge',
            'title': 'How Airlines Operate Routes',
            'content': """Airlines operate routes based on demand, profitability, and strategic network planning. Popular routes between major cities often have multiple daily flights from competing airlines. Some routes are operated as codeshare agreements, where multiple airlines sell seats on the same flight. Airlines use hub-and-spoke models to efficiently connect passengers through central airports, or point-to-point models for direct connections between cities.""",
            'metadata': json.dumps({'topic': 'airline_operations', 'category': 'industry'})
        })

        print(f"✓ Generated {len(documents)} general knowledge documents")
        return documents

    def insert_documents(self, documents: List[Dict]) -> List[str]:
        """
        Insert documents into the database.

        Args:
            documents: List of document dictionaries

        Returns:
            List of inserted document IDs
        """
        if not documents:
            return []

        conn = None
        cursor = None
        try:
            # Initialize connection pool first
            DatabaseConnection.get_pool()
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor(dictionary=True)

            doc_ids = []

            for doc in documents:
                # Ensure metadata is a properly formatted JSON string
                metadata = doc.get('metadata')
                if isinstance(metadata, dict):
                    metadata = json.dumps(metadata, cls=DecimalEncoder)
                elif metadata is None:
                    metadata = '{}'
                elif not isinstance(metadata, str):
                    # If it's not a string, try to convert it to JSON
                    metadata = json.dumps(metadata, cls=DecimalEncoder)

                try:
                    cursor.execute("""
                        INSERT INTO documents (doc_type, title, content, metadata)
                        VALUES (%s, %s, %s, %s)
                    """, (doc['doc_type'], doc['title'], doc['content'], metadata))

                    doc_ids.append(cursor.lastrowid)
                except Exception as e:
                    print(f"Error inserting document '{doc.get('title', 'Untitled')}': {str(e)}")
                    print(f"Document content: {doc}")
                    raise

            conn.commit()
            print(f"✓ Inserted {len(doc_ids)} documents into database")
            return doc_ids

        except Exception as e:
            if conn:
                conn.rollback()
            print(f"Error details: {str(e)}")
            print(f"Document count: {len(documents)}")
            if documents:
                print(f"First document keys: {list(documents[0].keys())}")
            raise Exception(f"Failed to insert documents: {str(e)}")
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    def build_complete_knowledge_base(
        self,
        airport_limit: int = 500,
        airline_limit: int = 300,
        route_limit: int = 1000
    ) -> Dict:
        """
        Build the complete knowledge base from all sources.

        Args:
            airport_limit: Max airports to process
            airline_limit: Max airlines to process
            route_limit: Max routes to process

        Returns:
            Statistics about the knowledge base build
        """
        print("Building knowledge base...")
        print("=" * 50)

        stats = {
            'airports': 0,
            'airlines': 0,
            'routes': 0,
            'hubs': 0,
            'alliances': 0,
            'general': 0,
            'total': 0
        }

        # Build and insert airport documents
        print("\n1. Building airport documents...")
        airport_docs = self.build_airport_documents(limit=airport_limit)
        self.insert_documents(airport_docs)
        stats['airports'] = len(airport_docs)

        # Build and insert airline documents
        print("\n2. Building airline documents...")
        airline_docs = self.build_airline_documents(limit=airline_limit)
        self.insert_documents(airline_docs)
        stats['airlines'] = len(airline_docs)

        # Build and insert route documents
        print("\n3. Building route documents...")
        route_docs = self.build_route_documents(limit=route_limit)
        self.insert_documents(route_docs)
        stats['routes'] = len(route_docs)

        # Build and insert hub documents
        print("\n4. Building hub airport documents...")
        hub_docs = self.build_hub_documents()
        self.insert_documents(hub_docs)
        stats['hubs'] = len(hub_docs)

        # Build and insert alliance documents
        print("\n5. Building airline alliance documents...")
        alliance_docs = self.build_alliance_documents()
        self.insert_documents(alliance_docs)
        stats['alliances'] = len(alliance_docs)

        # Build and insert general knowledge
        print("\n6. Building general knowledge documents...")
        general_docs = self.build_general_knowledge_documents()
        self.insert_documents(general_docs)
        stats['general'] = len(general_docs)

        stats['total'] = sum(stats.values())

        print("\n" + "=" * 50)
        print(f"✓ Knowledge base build complete!")
        print(f"  Total documents: {stats['total']}")
        print(f"  - Airports: {stats['airports']}")
        print(f"  - Airlines: {stats['airlines']}")
        print(f"  - Routes: {stats['routes']}")
        print(f"  - Hubs: {stats['hubs']}")
        print(f"  - Alliances: {stats['alliances']}")
        print(f"  - General: {stats['general']}")

        return stats
