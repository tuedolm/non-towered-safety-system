'use client';

import React, { useState, useEffect } from 'react';
import { FaPlane, FaExclamationTriangle, FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';

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
    {
      id: 'a4',
      callsign: 'N76543',
      position: [37.3325, -121.8185],
      altitude: 0,
      heading: 0,
      speed: 0,
      verticalRate: 0,
      onGround: true,
      type: 'C172',
      alertLevel: 'none',
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

// Sorting options for the traffic list
type SortField = 'callsign' | 'altitude' | 'speed';
type SortDirection = 'asc' | 'desc';

export default function TrafficList({ airportId }: { airportId: string }) {
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [sortField, setSortField] = useState<SortField>('altitude');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Mock data fetching and real-time updates
  useEffect(() => {
    // Initial load
    setAircraft(MOCK_AIRCRAFT[airportId] || []);
    
    // Simulate updates
    const intervalId = setInterval(() => {
      setAircraft(prev => 
        prev.map(a => ({
          ...a,
          altitude: a.onGround ? 0 : a.altitude + a.verticalRate / 60, // Adjust altitude based on vertical rate (per second)
          speed: a.onGround ? 0 : a.speed + (Math.random() * 2 - 1), // Small random speed changes
        }))
      );
    }, 3000);
    
    return () => clearInterval(intervalId);
  }, [airportId]);
  
  // Handle sort change
  const handleSortChange = (field: SortField) => {
    if (field === sortField) {
      // Toggle direction if same field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default direction
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Sort aircraft based on current sort settings
  const sortedAircraft = [...aircraft].sort((a, b) => {
    let comparison = 0;
    
    // First sort by alert level (critical first)
    const alertOrder = { critical: 3, warning: 2, caution: 1, none: 0 };
    const aAlert = a.alertLevel || 'none';
    const bAlert = b.alertLevel || 'none';
    comparison = alertOrder[bAlert] - alertOrder[aAlert];
    
    if (comparison !== 0) return comparison;
    
    // Then sort by selected field
    switch (sortField) {
      case 'callsign':
        comparison = a.callsign.localeCompare(b.callsign);
        break;
      case 'altitude':
        comparison = a.altitude - b.altitude;
        break;
      case 'speed':
        comparison = a.speed - b.speed;
        break;
    }
    
    // Apply sort direction
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  
  // Get CSS class for alert levels
  const getAlertClass = (alertLevel: string = 'none') => {
    switch (alertLevel) {
      case 'critical':
        return 'text-safety-red';
      case 'warning':
        return 'text-safety-orange';
      case 'caution':
        return 'text-safety-yellow';
      default:
        return '';
    }
  };
  
  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (field !== sortField) return null;
    
    return sortDirection === 'asc' 
      ? <FaSortAmountUp className="inline ml-1" /> 
      : <FaSortAmountDown className="inline ml-1" />;
  };
  
  if (sortedAircraft.length === 0) {
    return (
      <div className="text-gray-500 italic text-center py-8">
        No aircraft in vicinity
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="py-2 text-left">
              <button 
                className="font-medium flex items-center"
                onClick={() => handleSortChange('callsign')}
              >
                Callsign {getSortIcon('callsign')}
              </button>
            </th>
            <th className="py-2 text-right">
              <button 
                className="font-medium flex items-center justify-end"
                onClick={() => handleSortChange('altitude')}
              >
                Altitude {getSortIcon('altitude')}
              </button>
            </th>
            <th className="py-2 text-right">
              <button 
                className="font-medium flex items-center justify-end"
                onClick={() => handleSortChange('speed')}
              >
                Speed {getSortIcon('speed')}
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedAircraft.map((a) => (
            <tr 
              key={a.id} 
              className={`border-b border-gray-100 dark:border-gray-800 ${getAlertClass(a.alertLevel)}`}
            >
              <td className="py-2 flex items-center">
                {a.alertLevel !== 'none' && (
                  <FaExclamationTriangle className="mr-1 flex-shrink-0" />
                )}
                <div className="flex items-center">
                  <FaPlane 
                    className="mr-2 flex-shrink-0" 
                    style={{ transform: `rotate(${a.heading}deg)` }} 
                  />
                  <span>{a.callsign}</span>
                  <span className="text-gray-500 ml-1">({a.type})</span>
                </div>
              </td>
              <td className="py-2 text-right">
                {a.onGround 
                  ? <span className="text-gray-500">Ground</span> 
                  : `${Math.round(a.altitude).toLocaleString()} ft`
                }
              </td>
              <td className="py-2 text-right">
                {a.onGround 
                  ? <span className="text-gray-500">0</span> 
                  : `${Math.round(a.speed)} kts`
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 