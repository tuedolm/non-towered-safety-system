import { NextResponse } from 'next/server';

// Define our airport data interface
interface Airport {
  id: string;
  name: string;
  position: [number, number]; // [lat, lng]
  elevation: number; // feet
  runways: Runway[];
}

interface Runway {
  id: string;
  heading: number;
  length: number; // feet
  width: number; // feet
  threshold1: [number, number]; // [lat, lng]
  threshold2: [number, number]; // [lat, lng]
  active: boolean;
}

// Mock airport data for demonstration
const MOCK_AIRPORTS: Record<string, Airport> = {
  'KRHV': {
    id: 'KRHV',
    name: 'Reid-Hillview Airport',
    position: [37.3329, -121.8989],
    elevation: 133,
    runways: [
      {
        id: '13L/31R',
        heading: 130,
        length: 3100,
        width: 75,
        threshold1: [37.3376, -121.9034],
        threshold2: [37.3281, -121.8944],
        active: true
      },
      {
        id: '13R/31L',
        heading: 130,
        length: 3100,
        width: 75,
        threshold1: [37.3373, -121.9037],
        threshold2: [37.3278, -121.8947],
        active: false
      }
    ]
  },
  'KPAO': {
    id: 'KPAO',
    name: 'Palo Alto Airport',
    position: [37.4580, -122.1150],
    elevation: 4,
    runways: [
      {
        id: '13/31',
        heading: 130,
        length: 2443,
        width: 60,
        threshold1: [37.4617, -122.1184],
        threshold2: [37.4543, -122.1116],
        active: true
      }
    ]
  },
  'KSJC': {
    id: 'KSJC',
    name: 'San Jose International Airport',
    position: [37.3639, -121.9289],
    elevation: 62,
    runways: [
      {
        id: '12L/30R',
        heading: 120,
        length: 11000,
        width: 150,
        threshold1: [37.3689, -121.9386],
        threshold2: [37.3590, -121.9192],
        active: true
      },
      {
        id: '12R/30L',
        heading: 120,
        length: 10200,
        width: 150,
        threshold1: [37.3669, -121.9408],
        threshold2: [37.3570, -121.9214],
        active: false
      }
    ]
  }
};

export async function GET(
  request: Request
) {
  const { searchParams } = new URL(request.url);
  const icao = searchParams.get('icao');
  
  // If ICAO is provided, return specific airport
  if (icao) {
    const airport = MOCK_AIRPORTS[icao.toUpperCase()];
    if (!airport) {
      return NextResponse.json(
        { error: 'Airport not found', code: 'AIRPORT_NOT_FOUND' },
        { status: 404 }
      );
    }
    return NextResponse.json({ airport });
  }
  
  // Return all airports
  return NextResponse.json({ 
    airports: Object.values(MOCK_AIRPORTS),
    total: Object.values(MOCK_AIRPORTS).length
  });
} 