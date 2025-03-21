'use client';

import React, { useState, useEffect } from 'react';
import { 
  FaExclamationTriangle, 
  FaExclamationCircle, 
  FaInfoCircle, 
  FaFilter, 
  FaSyncAlt 
} from 'react-icons/fa';
import { format, formatDistanceToNow } from 'date-fns';

interface Advisory {
  id: string;
  timestamp: string;
  message: string;
  severity: number; // 1=Info, 2=Caution, 3=Warning, 4=Urgent, 5=Critical
  category: string;
  expires: string;
}

interface Airport {
  id: string;
  name: string;
}

export default function AdvisoriesPage() {
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAirport, setSelectedAirport] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  
  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch airports first
        const airportsResponse = await fetch('/api/airports');
        if (!airportsResponse.ok) {
          throw new Error('Failed to fetch airports');
        }
        
        const airportsData = await airportsResponse.json();
        setAirports(airportsData.airports || []);
        
        // Then fetch advisories
        const advisoriesUrl = selectedAirport 
          ? `/api/advisories?airport=${selectedAirport}` 
          : '/api/advisories';
          
        const advisoriesResponse = await fetch(advisoriesUrl);
        if (!advisoriesResponse.ok) {
          throw new Error('Failed to fetch advisories');
        }
        
        const advisoriesData = await advisoriesResponse.json();
        setAdvisories(advisoriesData.advisories || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Set up polling
    const intervalId = setInterval(fetchData, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [selectedAirport]);
  
  // Handle airport selection change
  const handleAirportChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAirport(e.target.value);
  };
  
  // Handle category filter change
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterCategory(e.target.value);
  };
  
  // Manual refresh function
  const handleRefresh = () => {
    setLoading(true);
    const fetchUrl = selectedAirport 
      ? `/api/advisories?airport=${selectedAirport}` 
      : '/api/advisories';
      
    fetch(fetchUrl)
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch advisories');
        return response.json();
      })
      .then(data => {
        setAdvisories(data.advisories || []);
        setError(null);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'An error occurred');
      })
      .finally(() => {
        setLoading(false);
      });
  };
  
  // Filter advisories by category if selected
  const filteredAdvisories = filterCategory 
    ? advisories.filter(adv => adv.category === filterCategory)
    : advisories;
    
  // Sort advisories by severity (highest first), then by timestamp (newest first)
  const sortedAdvisories = [...filteredAdvisories].sort((a, b) => {
    if (a.severity !== b.severity) {
      return b.severity - a.severity;
    }
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
  
  // Get unique categories for the filter
  const categories = Array.from(new Set(advisories.map(adv => adv.category)));
  
  // Helper to get the appropriate icon based on severity
  const getAdvisoryIcon = (severity: number) => {
    switch (severity) {
      case 5: // Critical
      case 4: // Urgent
        return <FaExclamationTriangle className="text-safety-red text-lg flex-shrink-0" />;
      case 3: // Warning
        return <FaExclamationTriangle className="text-safety-orange text-lg flex-shrink-0" />;
      case 2: // Caution
        return <FaExclamationCircle className="text-safety-yellow text-lg flex-shrink-0" />;
      case 1: // Information
      default:
        return <FaInfoCircle className="text-safety-blue text-lg flex-shrink-0" />;
    }
  };
  
  // Helper to get the appropriate CSS class based on severity
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
      case 1: // Information
      default:
        return 'alert-info';
    }
  };
  
  // Format timestamp for display
  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    return `${formatDistanceToNow(date, { addSuffix: true })}`;
  };
  
  // Format expiration for display
  const formatExpires = (isoString: string) => {
    const date = new Date(isoString);
    return `Expires ${formatDistanceToNow(date, { addSuffix: true })}`;
  };
  
  if (loading && advisories.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading advisories...</p>
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
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <h1 className="text-2xl font-bold">Safety Advisories</h1>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          {/* Airport filter */}
          <div className="flex items-center space-x-2">
            <label htmlFor="airport-select" className="text-sm font-medium">Airport:</label>
            <select
              id="airport-select"
              value={selectedAirport}
              onChange={handleAirportChange}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md py-1 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Airports</option>
              {airports.map((airport) => (
                <option key={airport.id} value={airport.id}>
                  {airport.id} - {airport.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Category filter */}
          <div className="flex items-center space-x-2">
            <label htmlFor="category-select" className="text-sm font-medium">Category:</label>
            <select
              id="category-select"
              value={filterCategory}
              onChange={handleCategoryChange}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md py-1 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          
          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700 transition ease-in-out duration-150"
            disabled={loading}
          >
            <FaSyncAlt className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>
      
      {/* Advisories count */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Showing </span>
            <span className="font-semibold">{sortedAdvisories.length}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400"> of </span>
            <span className="font-semibold">{advisories.length}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400"> advisories</span>
          </div>
          
          {filterCategory && (
            <div className="flex items-center space-x-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-md text-sm">
              <FaFilter className="text-xs" />
              <span>Filtered by: {filterCategory}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Advisories list */}
      {sortedAdvisories.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <FaInfoCircle className="text-4xl text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No advisories found</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {selectedAirport 
              ? `There are currently no active advisories for ${selectedAirport}`
              : 'There are currently no active advisories for any airports'}
            {filterCategory && ` in the ${filterCategory} category`}.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedAdvisories.map((advisory) => (
            <div 
              key={advisory.id} 
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 ${getAlertClass(advisory.severity)}`}
            >
              <div className="flex">
                {getAdvisoryIcon(advisory.severity)}
                <div className="ml-3 flex-grow">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 mr-2">
                        {advisory.id.split('-')[1]} {/* Display airport code */}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        {advisory.category}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimestamp(advisory.timestamp)}
                    </div>
                  </div>
                  <p className="text-gray-900 dark:text-gray-100 mt-1">{advisory.message}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {formatExpires(advisory.expires)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 