'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Polyline, 
  Circle, 
  useMap 
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue in Next.js
// This is needed because Next.js handles static assets differently
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Define our mock aircraft data interface
interface Aircraft {
  id: string;
  callsign: string;
  position: [number, number]; // [lat, lng]
  altitude: number; // feet
  heading: number; // degrees
  speed: number; // knots
  verticalRate: number; // feet per minute
  onGround: boolean;
  type: string;
  alertLevel?: 'none' | 'caution' | 'warning' | 'critical';
}

// Define our mock runway data interface
interface Runway {
  id: string;
  heading: number;
  length: number; // feet
  width: number; // feet
  threshold1: [number, number]; // [lat, lng]
  threshold2: [number, number]; // [lat, lng]
  active: boolean;
}

// Define our mock airport data interface
interface Airport {
  id: string;
  name: string;
  position: [number, number]; // [lat, lng]
  elevation: number; // feet
  runways: Runway[];
}

// Mock data for demonstration
const MOCK_AIRCRAFT: Record<string, Aircraft[]> = {
  'KRHV': [
    {
      id: 'a1',
      callsign: 'N12345',
      position: [37.3339, -121.8205],
      altitude: 1500,
      heading: 130,
      speed: 90,
      verticalRate: -500,
      onGround: false,
      type: 'C172',
      alertLevel: 'none',
    },
    {
      id: 'a2',
      callsign: 'N54321',
      position: [37.3318, -121.8175],
      altitude: 1200,
      heading: 310,
      speed: 70,
      verticalRate: 0,
      onGround: false,
      type: 'PA28',
      alertLevel: 'caution',
    },
    {
      id: 'a3',
      callsign: 'N98765',
      position: [37.3305, -121.8155],
      altitude: 800,
      heading: 130,
      speed: 60,
      verticalRate: -300,
      onGround: false,
      type: 'C152',
      alertLevel: 'warning',
    },
  ],
  'KPAO': [
    {
      id: 'b1',
      callsign: 'N24680',
      position: [37.4623, -122.1156],
      altitude: 1000,
      heading: 134,
      speed: 85,
      verticalRate: -400,
      onGround: false,
      type: 'C172',
      alertLevel: 'none',
    },
    {
      id: 'b2',
      callsign: 'N13579',
      position: [37.4603, -122.1136],
      altitude: 1300,
      heading: 314,
      speed: 75,
      verticalRate: 200,
      onGround: false,
      type: 'SR22',
      alertLevel: 'none',
    },
  ],
};

const MOCK_AIRPORTS: Record<string, Airport> = {
  'KRHV': {
    id: 'KRHV',
    name: 'Reid-Hillview Airport',
    position: [37.3329, -121.8195],
    elevation: 133,
    runways: [
      {
        id: '13L/31R',
        heading: 130,
        length: 3100,
        width: 75,
        threshold1: [37.3329, -121.8195], // 13L threshold
        threshold2: [37.3280, -121.8132], // 31R threshold
        active: true,
      },
      {
        id: '13R/31L',
        heading: 130,
        length: 3100,
        width: 75,
        threshold1: [37.3326, -121.8202], // 13R threshold
        threshold2: [37.3277, -121.8139], // 31L threshold
        active: false,
      },
    ],
  },
  'KPAO': {
    id: 'KPAO',
    name: 'Palo Alto Airport',
    position: [37.4613, -122.1146],
    elevation: 7,
    runways: [
      {
        id: '13/31',
        heading: 134,
        length: 2500,
        width: 70,
        threshold1: [37.4613, -122.1146], // 13 threshold
        threshold2: [37.4575, -122.1098], // 31 threshold
        active: true,
      },
    ],
  },
};

// Define custom aircraft icon
const createAircraftIcon = (heading: number, alertLevel: string = 'none') => {
  // SVG airplane icon with rotation based on heading
  return L.divIcon({
    html: `
      <svg 
        style="transform: rotate(${heading}deg);" 
        class="aircraft-marker ${alertLevel !== 'none' ? `aircraft-marker-${alertLevel}` : ''}"
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="${alertLevel === 'critical' ? '#ef4444' : alertLevel === 'warning' ? '#f59e0b' : '#3b82f6'}" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12,2L4,12H7V20H17V12H20L12,2Z" />
      </svg>
    `,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Component to handle map view updates
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  
  return null;
}

// Main Traffic Map component
export default function TrafficMap({ 
  center, 
  airportId 
}: { 
  center: [number, number];
  airportId: string;
}) {
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [airport, setAirport] = useState<Airport | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simulated real-time data fetching
  useEffect(() => {
    // Initial load
    setAircraft(MOCK_AIRCRAFT[airportId] || []);
    setAirport(MOCK_AIRPORTS[airportId] || null);
    
    // Set up polling interval (every 5 seconds)
    intervalRef.current = setInterval(() => {
      // In a real app, this would fetch from an API
      // Here we'll just simulate small position changes
      setAircraft(prev => 
        prev.map(aircraft => ({
          ...aircraft,
          position: [
            aircraft.position[0] + (Math.random() * 0.0002 - 0.0001),
            aircraft.position[1] + (Math.random() * 0.0002 - 0.0001),
          ] as [number, number],
        }))
      );
    }, 5000);
    
    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [airportId]);

  // Custom approach path polylines
  const renderApproachPaths = () => {
    if (!airport) return null;
    
    return airport.runways.map(runway => {
      // Only show approach paths for active runways
      if (!runway.active) return null;
      
      // Calculate approach path (5nm from threshold)
      const heading = runway.heading;
      const headingRad = (heading - 180) * Math.PI / 180; // Opposite direction for approach
      
      // Start at threshold and go 5nm in the opposite direction
      const lat1 = runway.threshold1[0];
      const lon1 = runway.threshold1[1];
      
      // Convert nm to degrees (very approximate)
      // 1 nm = about 1 minute of latitude = 1/60 degree
      const latDiff = Math.cos(headingRad) * (5 / 60);
      const lonDiff = Math.sin(headingRad) * (5 / 60) / Math.cos(lat1 * Math.PI / 180);
      
      const approachStart: [number, number] = [lat1 + latDiff, lon1 + lonDiff];
      
      // Check if there are any aircraft on this approach path
      const aircraftOnApproach = aircraft.filter(a => {
        // Simple check - in a real system this would be more sophisticated
        if (a.onGround) return false;
        
        // Check if within 1nm of approach path and descending
        const positions: [number, number][] = [approachStart, runway.threshold1];
        let minDist = Number.POSITIVE_INFINITY;
        
        // Find minimum distance to approach path
        for (let i = 0; i < positions.length - 1; i++) {
          const start = positions[i];
          const end = positions[i + 1];
          
          // Simple distance calc - in a real system this would use proper geo calculation
          const dist = Math.sqrt(
            Math.pow(a.position[0] - (start[0] + end[0]) / 2, 2) +
            Math.pow(a.position[1] - (start[1] + end[1]) / 2, 2)
          );
          
          minDist = Math.min(minDist, dist);
        }
        
        return minDist < 0.01 && a.verticalRate < 0; // 0.01 degrees ≈ 1nm
      });
      
      // Determine path color based on traffic
      let pathColor = 'green';
      if (aircraftOnApproach.length === 1) {
        pathColor = 'green';
      } else if (aircraftOnApproach.length === 2) {
        pathColor = 'orange';
      } else if (aircraftOnApproach.length > 2) {
        pathColor = 'red';
      }
      
      return (
        <Polyline
          key={`approach-${runway.id}`}
          positions={[approachStart, runway.threshold1]}
          pathOptions={{ 
            color: pathColor, 
            weight: 2, 
            dashArray: '10, 5'
          }}
        />
      );
    });
  };

  // Custom runway visualization
  const renderRunways = () => {
    if (!airport) return null;
    
    return airport.runways.map(runway => (
      <Polyline
        key={`runway-${runway.id}`}
        positions={[runway.threshold1, runway.threshold2]}
        pathOptions={{ 
          color: runway.active ? 'yellow' : 'white',
          weight: runway.active ? 8 : 5
        }}
      >
        <Popup>
          <div>
            <h3 className="font-bold">{runway.id}</h3>
            <p>Length: {runway.length} ft</p>
            <p>Heading: {runway.heading}°</p>
            <p>Status: {runway.active ? 'Active' : 'Inactive'}</p>
          </div>
        </Popup>
      </Polyline>
    ));
  };

  if (!airport) {
    return <div className="h-full flex items-center justify-center">Loading airport data...</div>;
  }

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      attributionControl={false}
    >
      <MapController center={center} />
      
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      
      {/* Airport boundary */}
      <Circle
        center={airport.position}
        radius={5000} // 5km ≈ 3nm
        pathOptions={{ color: 'blue', weight: 1, fillOpacity: 0.05 }}
      />
      
      {/* Runways */}
      {renderRunways()}
      
      {/* Approach paths */}
      {renderApproachPaths()}
      
      {/* Aircraft markers */}
      {aircraft.map((a) => (
        <Marker
          key={a.id}
          position={a.position}
          icon={createAircraftIcon(a.heading, a.alertLevel)}
        >
          <Popup>
            <div className="space-y-1">
              <h3 className="font-bold">{a.callsign} ({a.type})</h3>
              <p>Altitude: {a.onGround ? 'Ground' : `${a.altitude.toLocaleString()} ft`}</p>
              <p>Speed: {a.speed} knots</p>
              <p>Heading: {a.heading}°</p>
              <p>Vertical: {a.verticalRate > 0 ? '+' : ''}{a.verticalRate} fpm</p>
              {(a.alertLevel && a.alertLevel !== 'none') && (
                <p className="font-bold text-safety-orange">
                  Alert: {a.alertLevel.toUpperCase()}
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
} 