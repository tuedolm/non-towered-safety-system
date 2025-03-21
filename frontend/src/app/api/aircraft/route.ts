import { NextResponse } from 'next/server';

// Define our aircraft data interface
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

// Mock data for demonstration - same as in TrafficMap component
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

export async function GET(
  request: Request
) {
  const { searchParams } = new URL(request.url);
  const airportId = searchParams.get('airport');
  
  // If no airport specified, return all aircraft
  if (!airportId) {
    return NextResponse.json({ 
      aircraft: Object.values(MOCK_AIRCRAFT).flat(),
      total: Object.values(MOCK_AIRCRAFT).flat().length
    });
  }
  
  // Return aircraft for the specified airport
  const aircraft = MOCK_AIRCRAFT[airportId] || [];
  
  // Simulate small position updates
  const updatedAircraft = aircraft.map(a => ({
    ...a,
    position: [
      a.position[0] + (Math.random() * 0.0002 - 0.0001),
      a.position[1] + (Math.random() * 0.0002 - 0.0001),
    ] as [number, number],
    altitude: a.onGround ? 0 : a.altitude + a.verticalRate / 60, // Adjust altitude based on vertical rate (per second)
    speed: a.onGround ? 0 : a.speed + (Math.random() * 2 - 1), // Small random speed changes
  }));
  
  return NextResponse.json({ 
    aircraft: updatedAircraft,
    total: updatedAircraft.length,
    airport: airportId
  });
} 