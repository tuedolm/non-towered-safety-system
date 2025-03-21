'use client';

import React from 'react';
import { FaPlane } from 'react-icons/fa';

interface Airport {
  id: string;
  name: string;
  position: [number, number];
}

interface AirportSelectorProps {
  airports: Airport[];
  selectedAirport: string;
  onAirportChange: (airportId: string) => void;
}

export default function AirportSelector({ 
  airports, 
  selectedAirport, 
  onAirportChange 
}: AirportSelectorProps) {
  return (
    <div className="flex items-center">
      <FaPlane className="mr-2 text-blue-500" />
      <select
        value={selectedAirport}
        onChange={(e) => onAirportChange(e.target.value)}
        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {airports.map((airport) => (
          <option key={airport.id} value={airport.id}>
            {airport.name} ({airport.id})
          </option>
        ))}
      </select>
    </div>
  );
} 