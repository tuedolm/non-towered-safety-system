import csv
import math
import os
import urllib.request
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

@dataclass
class RunwayEnd:
    id: str
    latitude: float
    longitude: float
    elevation: float  # feet
    threshold_displaced: float = 0  # feet
    
@dataclass
class Runway:
    id: str
    length: float  # feet
    width: float  # feet
    surface: str
    lighted: bool
    closed: bool
    ends: List[RunwayEnd] = field(default_factory=list)
    
    @property
    def heading1(self) -> float:
        """Calculate the heading from end 1 to end 2."""
        if len(self.ends) < 2:
            return 0.0
        return self._calculate_heading(
            self.ends[0].latitude, self.ends[0].longitude,
            self.ends[1].latitude, self.ends[1].longitude
        )
    
    @property
    def heading2(self) -> float:
        """Calculate the heading from end 2 to end 1."""
        if len(self.ends) < 2:
            return 0.0
        return self._calculate_heading(
            self.ends[1].latitude, self.ends[1].longitude,
            self.ends[0].latitude, self.ends[0].longitude
        )
    
    @staticmethod
    def _calculate_heading(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate the bearing between two points."""
        lat1_rad = math.radians(lat1)
        lon1_rad = math.radians(lon1)
        lat2_rad = math.radians(lat2)
        lon2_rad = math.radians(lon2)
        
        y = math.sin(lon2_rad - lon1_rad) * math.cos(lat2_rad)
        x = math.cos(lat1_rad) * math.sin(lat2_rad) - math.sin(lat1_rad) * math.cos(lat2_rad) * math.cos(lon2_rad - lon1_rad)
        
        bearing = math.degrees(math.atan2(y, x))
        return (bearing + 360) % 360

@dataclass
class SafetyZone:
    name: str
    center_lat: float
    center_lon: float
    radius: float  # nautical miles
    min_altitude: float = 0  # feet AGL
    max_altitude: float = float('inf')  # feet AGL
    
@dataclass
class Airport:
    id: str
    ident: str
    name: str
    latitude: float
    longitude: float
    elevation: float  # feet
    runways: List[Runway] = field(default_factory=list)
    safety_zones: List[SafetyZone] = field(default_factory=list)
    
    def calculate_safety_zones(self):
        """Calculate safety zones around the airport."""
        # Airport Traffic Area (typically 5nm radius, 0-3000ft AGL)
        self.safety_zones.append(SafetyZone(
            name="Traffic Area",
            center_lat=self.latitude,
            center_lon=self.longitude,
            radius=5.0,
            max_altitude=3000,
        ))
        
        # Add runway approach corridors
        for runway in self.runways:
            if len(runway.ends) < 2:
                continue
                
            for i, end in enumerate(runway.ends):
                # Calculate the bearing to use for the approach corridor
                heading = runway.heading1 if i == 0 else runway.heading2
                
                # Create an approach corridor extending 5nm from runway end
                # at the runway heading
                approach_lat, approach_lon = self._project_point(
                    end.latitude, end.longitude, heading, 5.0)
                
                self.safety_zones.append(SafetyZone(
                    name=f"Approach {end.id}",
                    center_lat=(end.latitude + approach_lat) / 2,
                    center_lon=(end.longitude + approach_lon) / 2,
                    radius=1.0,  # 1nm wide corridor
                    max_altitude=3000,
                ))
        
    @staticmethod
    def _project_point(lat: float, lon: float, bearing: float, distance: float) -> Tuple[float, float]:
        """Project a point at a given bearing and distance from origin.
        
        Args:
            lat: Origin latitude in degrees
            lon: Origin longitude in degrees
            bearing: Bearing in degrees
            distance: Distance in nautical miles
        
        Returns:
            Tuple of (latitude, longitude) of the projected point
        """
        # Convert to radians
        lat_rad = math.radians(lat)
        lon_rad = math.radians(lon)
        bearing_rad = math.radians(bearing)
        
        # Earth radius in nautical miles
        R = 3440.0
        
        # Calculate new latitude
        new_lat_rad = math.asin(
            math.sin(lat_rad) * math.cos(distance/R) + 
            math.cos(lat_rad) * math.sin(distance/R) * math.cos(bearing_rad)
        )
        
        # Calculate new longitude
        new_lon_rad = lon_rad + math.atan2(
            math.sin(bearing_rad) * math.sin(distance/R) * math.cos(lat_rad),
            math.cos(distance/R) - math.sin(lat_rad) * math.sin(new_lat_rad)
        )
        
        # Convert back to degrees
        new_lat = math.degrees(new_lat_rad)
        new_lon = math.degrees(new_lon_rad)
        
        return new_lat, new_lon

class AirportDatabase:
    def __init__(self):
        self.airports: Dict[str, Airport] = {}
        
    def download_airport_data(self, data_dir: str = 'data'):
        """Download airport data from OurAirports if not already present."""
        os.makedirs(data_dir, exist_ok=True)
        
        # URLs for the data files
        urls = {
            'airports.csv': 'https://ourairports.com/data/airports.csv',
            'runways.csv': 'https://ourairports.com/data/runways.csv',
        }
        
        # Download files if they don't exist
        for filename, url in urls.items():
            filepath = os.path.join(data_dir, filename)
            if not os.path.exists(filepath):
                print(f"Downloading {filename}...")
                urllib.request.urlretrieve(url, filepath)
                print(f"Downloaded {filename}")
        
        return os.path.join(data_dir, 'airports.csv'), os.path.join(data_dir, 'runways.csv')
        
    def load_airports(self, airports_file: str, runways_file: str, 
                     country_code: Optional[str] = None, 
                     max_airports: Optional[int] = None):
        """Load airport data from CSV files with filtering options."""
        # Load airports
        print("Loading airports...")
        airports_temp = {}
        with open(airports_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            count = 0
            
            for row in reader:
                # Filter by country if specified
                if country_code and row['iso_country'] != country_code:
                    continue
                    
                # Only include airports with ICAO codes (generally excludes tiny airfields)
                if not row['ident'].startswith('K'):  # For US airports
                    continue
                
                # Exclude heliports, seaplane bases, and closed airports
                if row['type'] in ['heliport', 'seaplane_base', 'closed']:
                    continue
                
                try:
                    airport = Airport(
                        id=row['id'],
                        ident=row['ident'],
                        name=row['name'],
                        latitude=float(row['latitude_deg']),
                        longitude=float(row['longitude_deg']),
                        elevation=float(row['elevation_ft']) if row['elevation_ft'] else 0,
                    )
                    airports_temp[row['id']] = airport
                    count += 1
                    
                    if max_airports and count >= max_airports:
                        break
                except (ValueError, KeyError) as e:
                    print(f"Error processing airport {row.get('ident', 'unknown')}: {e}")
        
        print(f"Loaded {len(airports_temp)} airports")
        
        # Load runways
        print("Loading runways...")
        runway_count = 0
        with open(runways_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                airport_id = row['airport_ref']
                if airport_id not in airports_temp:
                    continue
                
                try:
                    # Create runway
                    runway = Runway(
                        id=row['id'],
                        length=float(row['length_ft']) if row['length_ft'] else 0,
                        width=float(row['width_ft']) if row['width_ft'] else 0,
                        surface=row['surface'],
                        lighted=row['lighted'] == '1',
                        closed=row['closed'] == '1',
                    )
                    
                    # Add the primary end
                    if row['le_ident']:
                        le_end = RunwayEnd(
                            id=row['le_ident'],
                            latitude=float(row['le_latitude_deg']) if row['le_latitude_deg'] else airports_temp[airport_id].latitude,
                            longitude=float(row['le_longitude_deg']) if row['le_longitude_deg'] else airports_temp[airport_id].longitude,
                            elevation=float(row['le_elevation_ft']) if row['le_elevation_ft'] else airports_temp[airport_id].elevation,
                            threshold_displaced=float(row['le_displaced_threshold_ft']) if row['le_displaced_threshold_ft'] else 0,
                        )
                        runway.ends.append(le_end)
                    
                    # Add the secondary end
                    if row['he_ident']:
                        he_end = RunwayEnd(
                            id=row['he_ident'],
                            latitude=float(row['he_latitude_deg']) if row['he_latitude_deg'] else airports_temp[airport_id].latitude,
                            longitude=float(row['he_longitude_deg']) if row['he_longitude_deg'] else airports_temp[airport_id].longitude,
                            elevation=float(row['he_elevation_ft']) if row['he_elevation_ft'] else airports_temp[airport_id].elevation,
                            threshold_displaced=float(row['he_displaced_threshold_ft']) if row['he_displaced_threshold_ft'] else 0,
                        )
                        runway.ends.append(he_end)
                    
                    # Add runway to airport
                    airports_temp[airport_id].runways.append(runway)
                    runway_count += 1
                    
                except (ValueError, KeyError) as e:
                    print(f"Error processing runway {row.get('id', 'unknown')} for airport {airport_id}: {e}")
        
        print(f"Loaded {runway_count} runways")
        
        # Only keep airports with runways
        self.airports = {k: v for k, v in airports_temp.items() if v.runways}
        print(f"Final airport count: {len(self.airports)}")
        
        # Calculate safety zones for each airport
        for airport in self.airports.values():
            airport.calculate_safety_zones()
            
    def get_airport_by_icao(self, icao: str) -> Optional[Airport]:
        """Get an airport by its ICAO code."""
        for airport in self.airports.values():
            if airport.ident == icao:
                return airport
        return None
    
    def find_airports_in_range(self, lat: float, lon: float, range_nm: float) -> List[Airport]:
        """Find airports within a specified range of a point."""
        airports_in_range = []
        
        for airport in self.airports.values():
            distance = self._calculate_distance(lat, lon, airport.latitude, airport.longitude)
            if distance <= range_nm:
                airports_in_range.append(airport)
                
        return airports_in_range
    
    @staticmethod
    def _calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate the great circle distance between two points in nautical miles."""
        # Convert to radians
        lat1_rad = math.radians(lat1)
        lon1_rad = math.radians(lon1)
        lat2_rad = math.radians(lat2)
        lon2_rad = math.radians(lon2)
        
        # Haversine formula
        dlon = lon2_rad - lon1_rad
        dlat = lat2_rad - lat1_rad
        a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        # Earth radius in nautical miles
        R = 3440.0
        
        return R * c

# Example usage
if __name__ == "__main__":
    db = AirportDatabase()
    airports_file, runways_file = db.download_airport_data()
    db.load_airports(airports_file, runways_file, country_code='US', max_airports=100)
    
    # Print some stats
    print("\nAirport Statistics:")
    print(f"Total airports: {len(db.airports)}")
    
    total_runways = sum(len(airport.runways) for airport in db.airports.values())
    print(f"Total runways: {total_runways}")
    
    total_safety_zones = sum(len(airport.safety_zones) for airport in db.airports.values())
    print(f"Total safety zones: {total_safety_zones}")
    
    # Example: Find and print details for a specific airport
    example_airport = db.get_airport_by_icao("KRHV")  # Reid-Hillview
    if example_airport:
        print(f"\nExample Airport: {example_airport.name} ({example_airport.ident})")
        print(f"Location: {example_airport.latitude}, {example_airport.longitude}")
        print(f"Elevation: {example_airport.elevation} ft")
        print(f"Runways: {len(example_airport.runways)}")
        
        for runway in example_airport.runways:
            print(f"  Runway {runway.id}: {runway.length} x {runway.width} ft, {runway.surface}")
            if len(runway.ends) >= 2:
                print(f"    End 1: {runway.ends[0].id} - Heading: {runway.heading1:.1f}°")
                print(f"    End 2: {runway.ends[1].id} - Heading: {runway.heading2:.1f}°")
        
        print(f"Safety Zones: {len(example_airport.safety_zones)}")
        for zone in example_airport.safety_zones:
            print(f"  {zone.name}: {zone.radius} nm radius, {zone.min_altitude}-{zone.max_altitude} ft AGL") 