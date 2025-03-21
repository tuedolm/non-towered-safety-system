'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { FaExclamationTriangle, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';

// Define our mock advisory data interface
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

export default function AdvisoryPanel({ airportId }: { airportId: string }) {
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  
  useEffect(() => {
    // In a real app, this would fetch from an API
    // Here we'll just use mock data
    setAdvisories(MOCK_ADVISORIES[airportId] || []);
    
    // Simulate a real-time system that occasionally adds advisories
    const timerId = setInterval(() => {
      // 20% chance of a new advisory every 30 seconds
      if (Math.random() < 0.2) {
        const newAdvisory: Advisory = {
          id: `ADV-${airportId}-TRAFFIC-${Date.now()}`,
          timestamp: new Date().toISOString(),
          message: `NEW TRAFFIC ADVISORY: Aircraft reported ${Math.floor(Math.random() * 5) + 1} miles ${['north', 'south', 'east', 'west'][Math.floor(Math.random() * 4)]} of the field.`,
          severity: Math.floor(Math.random() * 3) + 2, // Random severity 2-4
          category: 'TRAFFIC',
          expires: new Date(Date.now() + 10 * 60000).toISOString(), // 10 minutes from now
        };
        
        setAdvisories(prev => [newAdvisory, ...prev]);
      }
    }, 30000);
    
    return () => clearInterval(timerId);
  }, [airportId]);
  
  // Sort advisories by severity (highest first), then by timestamp (newest first)
  const sortedAdvisories = [...advisories].sort((a, b) => {
    if (a.severity !== b.severity) {
      return b.severity - a.severity;
    }
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
  
  // Get appropriate icon based on severity
  const getAdvisoryIcon = (severity: number) => {
    switch (severity) {
      case 5: // Critical
      case 4: // Urgent
        return <FaExclamationTriangle className="text-safety-red flex-shrink-0" />;
      case 3: // Warning
        return <FaExclamationTriangle className="text-safety-orange flex-shrink-0" />;
      case 2: // Caution
        return <FaExclamationCircle className="text-safety-yellow flex-shrink-0" />;
      default: // Info
        return <FaInfoCircle className="text-safety-blue flex-shrink-0" />;
    }
  };
  
  // Get CSS class for alert based on severity
  const getAlertClass = (severity: number) => {
    switch (severity) {
      case 5: // Critical
        return 'alert-critical';
      case 4: // Urgent
        return 'alert-urgent';
      case 3: // Warning
        return 'alert-warning';
      case 2: // Caution
        return 'alert-caution';
      default: // Info
        return 'alert-info';
    }
  };
  
  // Format timestamp to a readable format
  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    return format(date, 'HH:mm:ss');
  };
  
  if (sortedAdvisories.length === 0) {
    return (
      <div className="text-gray-500 italic text-center py-8">
        No active advisories for this airport
      </div>
    );
  }
  
  return (
    <div className="alert-panel">
      <ul className="space-y-2">
        {sortedAdvisories.map((advisory) => (
          <li 
            key={advisory.id} 
            className={`bg-white dark:bg-gray-700 rounded p-3 shadow-sm ${getAlertClass(advisory.severity)}`}
          >
            <div className="flex items-start space-x-2">
              {getAdvisoryIcon(advisory.severity)}
              <div className="flex-grow min-w-0">
                <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                  <span>{advisory.category}</span>
                  <span>{formatTimestamp(advisory.timestamp)}</span>
                </div>
                <p className="text-sm mt-1">{advisory.message}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
} 