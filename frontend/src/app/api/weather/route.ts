import { NextResponse } from 'next/server';

// Define our weather data interface
interface Weather {
  airport_icao: string;
  time: string;
  wind_direction: number;  // degrees
  wind_speed: number;      // knots
  wind_gust?: number;      // knots
  visibility: number;      // statute miles
  ceiling?: number;        // feet AGL
  temperature: number;     // Celsius
  dewpoint: number;        // Celsius
  altimeter: number;       // inHg
  flight_category: 'VFR' | 'MVFR' | 'IFR' | 'LIFR';
  raw_metar: string;
}

// Mock weather data for demonstration
const MOCK_WEATHER: Record<string, Weather> = {
  'KRHV': {
    airport_icao: 'KRHV',
    time: new Date().toISOString(),
    wind_direction: 240,
    wind_speed: 12,
    wind_gust: 18,
    visibility: 10,
    ceiling: 5000,
    temperature: 25,
    dewpoint: 15,
    altimeter: 29.92,
    flight_category: 'VFR',
    raw_metar: 'KRHV 121853Z 24012G18KT 10SM FEW050 25/15 A2992'
  },
  'KPAO': {
    airport_icao: 'KPAO',
    time: new Date().toISOString(),
    wind_direction: 290,
    wind_speed: 8,
    visibility: 10,
    temperature: 23,
    dewpoint: 14,
    altimeter: 29.93,
    flight_category: 'VFR',
    raw_metar: 'KPAO 121853Z 29008KT 10SM CLR 23/14 A2993'
  },
  'KSJC': {
    airport_icao: 'KSJC',
    time: new Date().toISOString(),
    wind_direction: 310,
    wind_speed: 15,
    wind_gust: 22,
    visibility: 10,
    ceiling: 12000,
    temperature: 24,
    dewpoint: 13,
    altimeter: 29.92,
    flight_category: 'VFR',
    raw_metar: 'KSJC 121853Z 31015G22KT 10SM FEW120 24/13 A2992'
  }
};

export async function GET(
  request: Request
) {
  const { searchParams } = new URL(request.url);
  const airport = searchParams.get('airport');
  
  // Update timestamps to current time
  Object.values(MOCK_WEATHER).forEach(weather => {
    weather.time = new Date().toISOString();
  });
  
  // If airport is provided, return weather for that airport
  if (airport) {
    const weather = MOCK_WEATHER[airport.toUpperCase()];
    if (!weather) {
      return NextResponse.json(
        { error: 'Weather for specified airport not found', code: 'WEATHER_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ weather });
  }
  
  // Return weather for all airports
  return NextResponse.json({ 
    weather: Object.values(MOCK_WEATHER),
    total: Object.values(MOCK_WEATHER).length
  });
} 