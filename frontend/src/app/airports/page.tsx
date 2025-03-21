'use client';

import React, { useState, useEffect } from 'react';
import { FaPlane, FaRuler, FaCompass, FaArrowUp } from 'react-icons/fa';

interface Runway {
  id: string;
  heading: number;
  length: number; // feet
  width: number; // feet
  threshold1: [number, number]; // [lat, lng]
  threshold2: [number, number]; // [lat, lng]
  active: boolean;
}

interface Airport {
  id: string;
  name: string;
  position: [number, number]; // [lat, lng]
  elevation: number; // feet
  runways: Runway[];
}

export default function AirportsPage() {
  const [airports, setAirports] = useState<Airport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchAirports = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/airports');
        if (!response.ok) {
          throw new Error('Failed to fetch airports');
        }
        
        const data = await response.json();
        setAirports(data.airports || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAirports();
  }, []);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading airports...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded relative my-4">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Monitored Airports</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {airports.map((airport) => (
          <div 
            key={airport.id} 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
          >
            <div className="bg-blue-600 dark:bg-blue-800 text-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{airport.id}</h2>
                <FaPlane className="text-2xl" />
              </div>
              <p className="text-sm">{airport.name}</p>
            </div>
            
            <div className="p-4">
              <div className="flex justify-between text-sm mb-4">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Position</p>
                  <p>{airport.position[0].toFixed(4)}, {airport.position[1].toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Elevation</p>
                  <p>{airport.elevation} ft</p>
                </div>
              </div>
              
              <p className="font-semibold mb-2">Runways</p>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {airport.runways.map((runway) => (
                  <div 
                    key={`${airport.id}-${runway.id}`}
                    className={`border rounded-md p-3 ${
                      runway.active 
                        ? 'border-green-500 dark:border-green-700 bg-green-50 dark:bg-green-900/20' 
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{runway.id}</span>
                      {runway.active && (
                        <span className="text-xs text-white bg-green-500 px-2 py-1 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                      <div className="flex items-center">
                        <FaCompass className="mr-1 text-blue-500" />
                        <span>{runway.heading}°</span>
                      </div>
                      <div className="flex items-center">
                        <FaRuler className="mr-1 text-blue-500" />
                        <span>{runway.length} ft</span>
                      </div>
                      <div className="flex items-center">
                        <FaArrowUp className="mr-1 text-blue-500" />
                        <span>{runway.width} ft</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700">
              <a 
                href={`/?airport=${airport.id}`}
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
              >
                View Live Traffic
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 