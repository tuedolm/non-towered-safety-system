'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { FaPlane, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

// Import components with client-side rendering (no SSR)
// This is necessary for Leaflet which requires browser APIs
const TrafficMap = dynamic(() => import('@/components/TrafficMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center">
      <p>Loading map...</p>
    </div>
  )
});

const AirportSelector = dynamic(() => import('@/components/AirportSelector'), { ssr: false });
const AdvisoryPanel = dynamic(() => import('@/components/AdvisoryPanel'), { ssr: false });
const TrafficList = dynamic(() => import('@/components/TrafficList'), { ssr: false });

export default function Home() {
  const [selectedAirport, setSelectedAirport] = useState('KRHV'); // Default to Reid-Hillview
  
  // These would be fetched from API in a real implementation
  const airports = [
    { id: 'KRHV', name: 'Reid-Hillview Airport', position: [37.3329, -121.8195] as [number, number] },
    { id: 'KPAO', name: 'Palo Alto Airport', position: [37.4613, -122.1146] as [number, number] },
    { id: 'KSJC', name: 'San Jose International Airport', position: [37.3626, -121.9292] as [number, number] },
  ];
  
  const handleAirportChange = (airportId: string) => {
    setSelectedAirport(airportId);
  };
  
  const selectedAirportData = airports.find(airport => airport.id === selectedAirport);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Airport Traffic Dashboard</h2>
        <AirportSelector 
          airports={airports} 
          selectedAirport={selectedAirport} 
          onAirportChange={handleAirportChange} 
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main map - takes 2/3 of the width on large screens */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-3">Live Traffic Map</h3>
            <div className="h-[500px]">
              {selectedAirportData && (
                <TrafficMap 
                  center={selectedAirportData.position} 
                  airportId={selectedAirport}
                />
              )}
            </div>
          </div>
        </div>
        
        {/* Sidebar - takes 1/3 of the width on large screens */}
        <div className="space-y-6">
          {/* Advisories panel */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Active Advisories</h3>
              <div className="flex items-center space-x-2">
                <FaExclamationTriangle className="text-safety-orange" />
                <span className="text-sm font-medium">3 Active</span>
              </div>
            </div>
            <AdvisoryPanel airportId={selectedAirport} />
          </div>
          
          {/* Aircraft list */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Aircraft in Vicinity</h3>
              <div className="flex items-center space-x-2">
                <FaPlane className="text-safety-blue" />
                <span className="text-sm font-medium">12 Aircraft</span>
              </div>
            </div>
            <TrafficList airportId={selectedAirport} />
          </div>
          
          {/* Weather information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Current Weather</h3>
              <div className="flex items-center space-x-2">
                <FaInfoCircle className="text-safety-blue" />
                <span className="text-sm font-medium">VFR</span>
              </div>
            </div>
            <div className="text-sm space-y-2">
              <p><strong>METAR:</strong> KRHV 121853Z 24012G18KT 10SM FEW050 25/15 A2992</p>
              <p><strong>Wind:</strong> 240° at 12 knots, gusting to 18 knots</p>
              <p><strong>Visibility:</strong> 10 statute miles</p>
              <p><strong>Ceiling:</strong> Few clouds at 5,000 feet</p>
              <p><strong>Temperature:</strong> 25°C / 77°F</p>
              <p><strong>Dewpoint:</strong> 15°C / 59°F</p>
              <p><strong>Altimeter:</strong> 29.92 inHg</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Statistics section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-3">Pattern Activity</h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            Chart placeholder - Pattern traffic over time
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-3">Runway Utilization</h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            Chart placeholder - Runway usage statistics
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-3">Safety Metrics</h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            Chart placeholder - Safety metrics and trends
          </div>
        </div>
      </div>
    </div>
  );
} 