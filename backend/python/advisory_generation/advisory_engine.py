import json
import re
import time
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Any, Tuple

# Weather condition types
class WeatherCondition(Enum):
    VFR = "VFR"
    MVFR = "MVFR"
    IFR = "IFR"
    LIFR = "LIFR"

# Alert types
class AlertType(Enum):
    RUNWAY_INCURSION = "RUNWAY_INCURSION"
    PATTERN_CONFLICT = "PATTERN_CONFLICT"
    APPROACH_CONFLICT = "APPROACH_CONFLICT"
    DEPARTURE_CONFLICT = "DEPARTURE_CONFLICT"
    LOW_ALTITUDE = "LOW_ALTITUDE"
    TERRAIN_PROXIMITY = "TERRAIN_PROXIMITY"
    TRAFFIC_CONGESTION = "TRAFFIC_CONGESTION"

# Severity levels
class AlertSeverity(Enum):
    INFORMATION = 1
    CAUTION = 2
    WARNING = 3
    URGENT = 4
    CRITICAL = 5

@dataclass
class Aircraft:
    """Simplified aircraft representation for advisory generation"""
    icao24: str
    callsign: str
    altitude: float  # feet MSL
    ground_speed: float  # knots
    vertical_rate: float  # feet per minute
    heading: float  # degrees
    on_ground: bool
    position: Tuple[float, float]  # lat, lon
    last_update: datetime

@dataclass
class Weather:
    """Weather data for an airport"""
    airport_icao: str
    time: datetime
    wind_direction: int  # degrees
    wind_speed: int  # knots
    wind_gust: Optional[int]  # knots
    visibility: float  # statute miles
    ceiling: Optional[int]  # feet AGL
    temperature: float  # Celsius
    dewpoint: float  # Celsius
    altimeter: float  # inHg
    flight_category: WeatherCondition
    raw_metar: str

@dataclass
class Alert:
    """Safety alert representing a potential conflict or hazard"""
    id: str
    type: AlertType
    severity: AlertSeverity
    description: str
    timestamp: datetime
    affected_aircraft: List[str]  # ICAO24 identifiers
    location: Tuple[float, float]  # lat, lon
    time_to_impact: Optional[float] = None  # seconds
    recommended_action: Optional[str] = None

@dataclass
class Advisory:
    """Generated safety advisory"""
    id: str
    airport_icao: str
    timestamp: datetime
    message: str
    severity: AlertSeverity
    category: str
    expires: datetime
    source_alerts: List[str] = field(default_factory=list)  # Alert IDs

class AdvisoryTemplate:
    """Template for generating advisories based on alert conditions"""
    
    # Template patterns
    RUNWAY_INCURSION_TEMPLATES = [
        "CAUTION: Multiple aircraft in vicinity of runway {runway}.",
        "RUNWAY CONFLICT ALERT: {count} aircraft operating near runway {runway}.",
        "SAFETY ALERT: Possible runway incursion on {runway}. Aircraft {callsigns} in close proximity.",
    ]
    
    PATTERN_CONFLICT_TEMPLATES = [
        "TRAFFIC ALERT: Pattern separation issue between {callsign1} and {callsign2}.",
        "CAUTION: Aircraft {callsign1} and {callsign2} with insufficient separation in the pattern.",
        "TRAFFIC ADVISORY: Maintain separation with {callsign2} in your vicinity.",
    ]
    
    APPROACH_CONFLICT_TEMPLATES = [
        "APPROACH SEQUENCE ALERT: Aircraft {callsign1} and {callsign2} on approach to runway {runway}.",
        "CAUTION: Multiple aircraft on final approach to runway {runway}.",
        "SEQUENCE ADVISORY: Aircraft on short final has priority for runway {runway}.",
    ]
    
    WEATHER_ADVISORY_TEMPLATES = {
        WeatherCondition.VFR: "Weather conditions VFR. Ceiling {ceiling} feet, visibility {visibility} miles.",
        WeatherCondition.MVFR: "MARGINAL VFR conditions. Ceiling {ceiling} feet, visibility {visibility} miles. Exercise caution.",
        WeatherCondition.IFR: "IFR conditions prevail. Ceiling {ceiling} feet, visibility {visibility} miles. IFR-equipped aircraft only.",
        WeatherCondition.LIFR: "LOW IFR conditions. Ceiling {ceiling} feet, visibility {visibility} miles. IFR operations not recommended.",
    }
    
    WIND_ADVISORY_TEMPLATES = [
        "Wind {direction} at {speed} knots.",
        "Wind {direction} at {speed} knots, gusting {gust} knots.",
        "CROSSWIND ADVISORY: Wind {direction} at {speed} knots for runway {runway}.",
    ]
    
    @staticmethod
    def format_wind_direction(degrees: int) -> str:
        """Format wind direction as cardinal direction"""
        directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", 
                      "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
        index = round(degrees / 22.5) % 16
        return f"{degrees}° ({directions[index]})"

    @staticmethod
    def format_callsigns(callsigns: List[str]) -> str:
        """Format a list of callsigns for inclusion in an advisory"""
        if not callsigns:
            return "unknown"
        elif len(callsigns) == 1:
            return callsigns[0]
        elif len(callsigns) == 2:
            return f"{callsigns[0]} and {callsigns[1]}"
        else:
            return ", ".join(callsigns[:-1]) + f", and {callsigns[-1]}"
    
    @staticmethod
    def get_runway_from_alert(alert: Alert) -> str:
        """Extract runway information from alert description"""
        runway_match = re.search(r"runway (\w+)", alert.description, re.IGNORECASE)
        if runway_match:
            return runway_match.group(1)
        return "active runway"

class AdvisoryEngine:
    """Generates context-aware safety advisories based on alerts and conditions"""
    
    def __init__(self):
        self.active_alerts: Dict[str, Alert] = {}
        self.active_advisories: Dict[str, Advisory] = {}
        self.weather_data: Dict[str, Weather] = {}
        self.aircraft_data: Dict[str, Aircraft] = {}
        
        # Advisory counter for ID generation
        self.advisory_counter = 0
    
    def update_weather(self, weather: Weather):
        """Update weather data for an airport"""
        self.weather_data[weather.airport_icao] = weather
    
    def update_aircraft(self, aircraft: Aircraft):
        """Update aircraft data"""
        self.aircraft_data[aircraft.icao24] = aircraft
    
    def process_alert(self, alert: Alert):
        """Process a new alert and generate/update advisories as needed"""
        # Store the alert
        self.active_alerts[alert.id] = alert
        
        # Generate appropriate advisories based on alert type
        if alert.type == AlertType.RUNWAY_INCURSION:
            self._generate_runway_incursion_advisory(alert)
        elif alert.type == AlertType.PATTERN_CONFLICT:
            self._generate_pattern_conflict_advisory(alert)
        elif alert.type == AlertType.APPROACH_CONFLICT:
            self._generate_approach_conflict_advisory(alert)
        
        # Cleanup stale advisories
        self._cleanup_expired_advisories()
    
    def _generate_runway_incursion_advisory(self, alert: Alert):
        """Generate advisory for runway incursion alert"""
        # Extract affected runway
        runway = AdvisoryTemplate.get_runway_from_alert(alert)
        
        # Get callsigns of affected aircraft
        callsigns = []
        for icao in alert.affected_aircraft:
            if icao in self.aircraft_data:
                callsigns.append(self.aircraft_data[icao].callsign)
        
        # Format advisory message using template
        template = AdvisoryTemplate.RUNWAY_INCURSION_TEMPLATES[0]
        if alert.severity.value >= AlertSeverity.URGENT.value:
            template = AdvisoryTemplate.RUNWAY_INCURSION_TEMPLATES[2]
        
        message = template.format(
            runway=runway,
            count=len(alert.affected_aircraft),
            callsigns=AdvisoryTemplate.format_callsigns(callsigns)
        )
        
        # Add recommended action if available
        if alert.recommended_action:
            message += f" {alert.recommended_action}"
        
        # Create advisory
        self._create_or_update_advisory(
            airport_icao=self._get_airport_for_location(alert.location),
            message=message,
            severity=alert.severity,
            category="RUNWAY",
            source_alerts=[alert.id]
        )
    
    def _generate_pattern_conflict_advisory(self, alert: Alert):
        """Generate advisory for traffic pattern conflict"""
        # Get callsigns of affected aircraft
        callsigns = []
        for icao in alert.affected_aircraft:
            if icao in self.aircraft_data:
                callsigns.append(self.aircraft_data[icao].callsign)
        
        # Format advisory message
        template = AdvisoryTemplate.PATTERN_CONFLICT_TEMPLATES[0]
        if alert.severity.value >= AlertSeverity.URGENT.value:
            template = AdvisoryTemplate.PATTERN_CONFLICT_TEMPLATES[1]
        
        message = template.format(
            callsign1=callsigns[0] if len(callsigns) > 0 else "Aircraft 1",
            callsign2=callsigns[1] if len(callsigns) > 1 else "Aircraft 2"
        )
        
        # Add time to impact if available
        if alert.time_to_impact and alert.time_to_impact < 60:
            message += f" Estimated closest approach in {int(alert.time_to_impact)} seconds."
        
        # Create advisory
        self._create_or_update_advisory(
            airport_icao=self._get_airport_for_location(alert.location),
            message=message,
            severity=alert.severity,
            category="PATTERN",
            source_alerts=[alert.id]
        )
    
    def _generate_approach_conflict_advisory(self, alert: Alert):
        """Generate advisory for approach conflict"""
        # Extract affected runway
        runway = AdvisoryTemplate.get_runway_from_alert(alert)
        
        # Get callsigns of affected aircraft
        callsigns = []
        for icao in alert.affected_aircraft:
            if icao in self.aircraft_data:
                callsigns.append(self.aircraft_data[icao].callsign)
        
        # Format advisory message
        template = AdvisoryTemplate.APPROACH_CONFLICT_TEMPLATES[0]
        if alert.severity.value >= AlertSeverity.URGENT.value:
            template = AdvisoryTemplate.APPROACH_CONFLICT_TEMPLATES[1]
        
        message = template.format(
            callsign1=callsigns[0] if len(callsigns) > 0 else "Aircraft 1",
            callsign2=callsigns[1] if len(callsigns) > 1 else "Aircraft 2",
            runway=runway
        )
        
        # Create advisory
        self._create_or_update_advisory(
            airport_icao=self._get_airport_for_location(alert.location),
            message=message,
            severity=alert.severity,
            category="APPROACH",
            source_alerts=[alert.id]
        )
    
    def generate_weather_advisory(self, airport_icao: str) -> Optional[Advisory]:
        """Generate weather advisory based on current conditions"""
        if airport_icao not in self.weather_data:
            return None
        
        weather = self.weather_data[airport_icao]
        
        # Create basic weather information advisory
        template = AdvisoryTemplate.WEATHER_ADVISORY_TEMPLATES.get(
            weather.flight_category, 
            AdvisoryTemplate.WEATHER_ADVISORY_TEMPLATES[WeatherCondition.VFR]
        )
        
        ceiling_text = f"{weather.ceiling}" if weather.ceiling else "unlimited"
        
        message = template.format(
            ceiling=ceiling_text,
            visibility=weather.visibility
        )
        
        # Add wind information
        wind_template = AdvisoryTemplate.WIND_ADVISORY_TEMPLATES[0]
        if weather.wind_gust and weather.wind_gust > weather.wind_speed + 5:
            wind_template = AdvisoryTemplate.WIND_ADVISORY_TEMPLATES[1]
        
        wind_message = wind_template.format(
            direction=AdvisoryTemplate.format_wind_direction(weather.wind_direction),
            speed=weather.wind_speed,
            gust=weather.wind_gust
        )
        
        message = f"{message} {wind_message}"
        
        # Determine severity based on conditions
        severity = AlertSeverity.INFORMATION
        if weather.flight_category == WeatherCondition.MVFR:
            severity = AlertSeverity.CAUTION
        elif weather.flight_category == WeatherCondition.IFR:
            severity = AlertSeverity.WARNING
        elif weather.flight_category == WeatherCondition.LIFR:
            severity = AlertSeverity.URGENT
        
        # Create advisory
        self._create_or_update_advisory(
            airport_icao=airport_icao,
            message=message,
            severity=severity,
            category="WEATHER",
            source_alerts=[]
        )
        
        # Get the created advisory
        for adv_id, advisory in self.active_advisories.items():
            if advisory.airport_icao == airport_icao and advisory.category == "WEATHER":
                return advisory
        
        return None
    
    def _create_or_update_advisory(self, airport_icao: str, message: str, 
                                  severity: AlertSeverity, category: str,
                                  source_alerts: List[str]):
        """Create a new advisory or update an existing one"""
        # Look for existing advisory of the same category for this airport
        existing_id = None
        for adv_id, advisory in self.active_advisories.items():
            if (advisory.airport_icao == airport_icao and 
                advisory.category == category and
                set(advisory.source_alerts) == set(source_alerts)):
                existing_id = adv_id
                break
        
        # Current time
        now = datetime.now()
        
        # Default expiration time (5 minutes)
        expires = datetime.fromtimestamp(now.timestamp() + 300)
        
        if existing_id:
            # Update existing advisory
            self.active_advisories[existing_id].message = message
            self.active_advisories[existing_id].severity = severity
            self.active_advisories[existing_id].timestamp = now
            self.active_advisories[existing_id].expires = expires
        else:
            # Create new advisory
            self.advisory_counter += 1
            advisory_id = f"ADV-{airport_icao}-{category}-{self.advisory_counter}"
            
            advisory = Advisory(
                id=advisory_id,
                airport_icao=airport_icao,
                timestamp=now,
                message=message,
                severity=severity,
                category=category,
                expires=expires,
                source_alerts=source_alerts
            )
            
            self.active_advisories[advisory_id] = advisory
    
    def _cleanup_expired_advisories(self):
        """Remove expired advisories"""
        now = datetime.now()
        expired_ids = []
        
        for adv_id, advisory in self.active_advisories.items():
            if advisory.expires < now:
                expired_ids.append(adv_id)
        
        for adv_id in expired_ids:
            del self.active_advisories[adv_id]
    
    def _get_airport_for_location(self, location: Tuple[float, float]) -> str:
        """Determine which airport a location is associated with (simplified)"""
        # In a real implementation, this would use spatial queries
        # Here we'll just use the first one we find or default to "KUNK" (unknown)
        if self.weather_data:
            return list(self.weather_data.keys())[0]
        return "KUNK"
    
    def get_advisories_for_airport(self, airport_icao: str) -> List[Advisory]:
        """Get all active advisories for a specific airport"""
        return [adv for adv in self.active_advisories.values() 
                if adv.airport_icao == airport_icao]
    
    def get_all_advisories(self) -> List[Advisory]:
        """Get all active advisories"""
        return list(self.active_advisories.values())
    
    def to_json(self) -> str:
        """Convert all active advisories to JSON format"""
        advisories_dict = []
        
        for advisory in self.active_advisories.values():
            advisories_dict.append({
                "id": advisory.id,
                "airport": advisory.airport_icao,
                "timestamp": advisory.timestamp.isoformat(),
                "message": advisory.message,
                "severity": advisory.severity.value,
                "category": advisory.category,
                "expires": advisory.expires.isoformat()
            })
        
        return json.dumps({"advisories": advisories_dict})

# Example usage
if __name__ == "__main__":
    # Create the advisory engine
    engine = AdvisoryEngine()
    
    # Add a sample weather observation
    weather = Weather(
        airport_icao="KRHV",
        time=datetime.now(),
        wind_direction=240,
        wind_speed=12,
        wind_gust=18,
        visibility=10.0,
        ceiling=5000,
        temperature=25.0,
        dewpoint=15.0,
        altimeter=29.92,
        flight_category=WeatherCondition.VFR,
        raw_metar="KRHV 121853Z 24012G18KT 10SM FEW050 25/15 A2992"
    )
    engine.update_weather(weather)
    
    # Create sample aircraft
    ac1 = Aircraft(
        icao24="a0b1c2",
        callsign="N12345",
        altitude=1200,
        ground_speed=90,
        vertical_rate=-500,
        heading=130,
        on_ground=False,
        position=(37.333, -121.819),
        last_update=datetime.now()
    )
    
    ac2 = Aircraft(
        icao24="d3e4f5",
        callsign="N54321",
        altitude=1000,
        ground_speed=70,
        vertical_rate=-300,
        heading=310,
        on_ground=False,
        position=(37.329, -121.815),
        last_update=datetime.now()
    )
    
    engine.update_aircraft(ac1)
    engine.update_aircraft(ac2)
    
    # Create a sample alert
    alert = Alert(
        id="ALERT-001",
        type=AlertType.PATTERN_CONFLICT,
        severity=AlertSeverity.WARNING,
        description="Pattern separation violation between N12345 and N54321",
        timestamp=datetime.now(),
        affected_aircraft=["a0b1c2", "d3e4f5"],
        location=(37.331, -121.817),
        time_to_impact=45.0
    )
    
    # Process the alert
    engine.process_alert(alert)
    
    # Generate a weather advisory
    engine.generate_weather_advisory("KRHV")
    
    # Display all advisories
    for advisory in engine.get_all_advisories():
        print(f"[{advisory.severity.name}] {advisory.message}")
    
    # Output as JSON
    print("\nJSON output:")
    print(engine.to_json()) 