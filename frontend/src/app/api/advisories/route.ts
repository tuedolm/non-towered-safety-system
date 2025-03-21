import { NextResponse } from 'next/server';

// Define our advisory data interface
interface Advisory {
  id: string;
  timestamp: string;
  message: string;
  severity: number; // 1=Info, 2=Caution, 3=Warning, 4=Urgent, 5=Critical
  category: string;
  expires: string;
}

// Mock advisory data for demonstration
const MOCK_ADVISORIES: Record<string, Advisory[]> = {
  'KRHV': [
    {
      id: 'ADV-KRHV-PATTERN-1',
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(), // 5 minutes ago
      message: 'TRAFFIC ALERT: Pattern separation issue between N12345 and N54321.',
      severity: 3,
      category: 'PATTERN',
      expires: new Date(Date.now() + 10 * 60000).toISOString(), // 10 minutes from now
    },
    {
      id: 'ADV-KRHV-RUNWAY-1',
      timestamp: new Date(Date.now() - 2 * 60000).toISOString(), // 2 minutes ago
      message: 'CAUTION: Multiple aircraft in vicinity of runway 13L.',
      severity: 2,
      category: 'RUNWAY',
      expires: new Date(Date.now() + 15 * 60000).toISOString(), // 15 minutes from now
    },
    {
      id: 'ADV-KRHV-WEATHER-1',
      timestamp: new Date(Date.now() - 30 * 60000).toISOString(), // 30 minutes ago
      message: 'Weather conditions VFR. Ceiling 5000 feet, visibility 10 miles. Wind 240° at 12 knots, gusting 18 knots.',
      severity: 1,
      category: 'WEATHER',
      expires: new Date(Date.now() + 60 * 60000).toISOString(), // 60 minutes from now
    },
  ],
  'KPAO': [
    {
      id: 'ADV-KPAO-WEATHER-1',
      timestamp: new Date(Date.now() - 45 * 60000).toISOString(), // 45 minutes ago
      message: 'Weather conditions VFR. Ceiling unlimited, visibility 10 miles. Wind 290° at 8 knots.',
      severity: 1,
      category: 'WEATHER',
      expires: new Date(Date.now() + 60 * 60000).toISOString(), // 60 minutes from now
    },
  ],
};

export async function GET(
  request: Request
) {
  const { searchParams } = new URL(request.url);
  const airportId = searchParams.get('airport');
  
  // If no airport specified, return all advisories
  if (!airportId) {
    return NextResponse.json({ 
      advisories: Object.values(MOCK_ADVISORIES).flat(),
      total: Object.values(MOCK_ADVISORIES).flat().length
    });
  }
  
  // Return advisories for the specified airport
  const advisories = MOCK_ADVISORIES[airportId] || [];
  
  // Remove expired advisories
  const now = new Date();
  const activeAdvisories = advisories.filter(adv => 
    new Date(adv.expires) > now
  );
  
  // Randomly generate new advisories (10% chance)
  if (Math.random() < 0.1) {
    const categories = ['TRAFFIC', 'PATTERN', 'APPROACH', 'DEPARTURE'];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const randomSeverity = Math.floor(Math.random() * 3) + 2; // 2-4
    
    const newAdvisory: Advisory = {
      id: `ADV-${airportId}-${randomCategory}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      message: `NEW ${randomCategory} ADVISORY: Generated for demonstration purposes.`,
      severity: randomSeverity,
      category: randomCategory,
      expires: new Date(Date.now() + 10 * 60000).toISOString(), // 10 minutes from now
    };
    
    activeAdvisories.push(newAdvisory);
  }
  
  return NextResponse.json({ 
    advisories: activeAdvisories,
    total: activeAdvisories.length,
    airport: airportId
  });
} 