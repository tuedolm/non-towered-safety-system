'use client';

import React, { useState } from 'react';
import { FaSave, FaCog, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    refreshInterval: 30,
    darkMode: 'system',
    soundAlerts: true,
    dataSource: 'demo',
    apiKey: '',
    trafficLimit: 50,
    alertThreshold: 'medium'
  });
  
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate saving settings
    try {
      // In a real app, this would save to localStorage, cookies, or an API
      localStorage.setItem('safetySystemSettings', JSON.stringify(settings));
      
      setSaved(true);
      setError(null);
      
      // Reset the saved status after a delay
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError('Failed to save settings. Please try again.');
      setSaved(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setSettings({
      ...settings,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : type === 'number' 
          ? parseInt(value, 10) 
          : value
    });
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">System Settings</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* UI Settings */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FaCog className="mr-2 text-blue-500" />
              User Interface
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="refresh-interval" className="block text-sm font-medium mb-1">
                  Refresh Interval (seconds)
                </label>
                <input
                  id="refresh-interval"
                  name="refreshInterval"
                  type="number"
                  min="5"
                  max="120"
                  value={settings.refreshInterval}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                />
              </div>
              
              <div>
                <label htmlFor="dark-mode" className="block text-sm font-medium mb-1">
                  Dark Mode
                </label>
                <select
                  id="dark-mode"
                  name="darkMode"
                  value={settings.darkMode}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                >
                  <option value="system">Follow System</option>
                  <option value="light">Light Mode</option>
                  <option value="dark">Dark Mode</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  id="sound-alerts"
                  name="soundAlerts"
                  type="checkbox"
                  checked={settings.soundAlerts}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="sound-alerts" className="ml-2 block text-sm">
                  Enable Sound Alerts
                </label>
              </div>
            </div>
          </div>
          
          {/* Data Source Settings */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FaCog className="mr-2 text-blue-500" />
              Data Source
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="data-source" className="block text-sm font-medium mb-1">
                  Source Type
                </label>
                <select
                  id="data-source"
                  name="dataSource"
                  value={settings.dataSource}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                >
                  <option value="demo">Demo Data</option>
                  <option value="api">Live API</option>
                  <option value="local">Local Backend</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="api-key" className="block text-sm font-medium mb-1">
                  API Key (if using Live API)
                </label>
                <input
                  id="api-key"
                  name="apiKey"
                  type="password"
                  value={settings.apiKey}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                  placeholder="Enter your API key"
                />
              </div>
              
              <div>
                <label htmlFor="traffic-limit" className="block text-sm font-medium mb-1">
                  Traffic Display Limit
                </label>
                <input
                  id="traffic-limit"
                  name="trafficLimit"
                  type="number"
                  min="10"
                  max="500"
                  value={settings.trafficLimit}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                />
              </div>
              
              <div>
                <label htmlFor="alert-threshold" className="block text-sm font-medium mb-1">
                  Alert Sensitivity
                </label>
                <select
                  id="alert-threshold"
                  name="alertThreshold"
                  value={settings.alertThreshold}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                >
                  <option value="low">Low (Fewer Alerts)</option>
                  <option value="medium">Medium (Balanced)</option>
                  <option value="high">High (More Alerts)</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Status and Submit */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              {saved && (
                <div className="flex items-center text-green-600 dark:text-green-400">
                  <FaCheckCircle className="mr-1" />
                  <span className="text-sm">Settings saved successfully</span>
                </div>
              )}
              
              {error && (
                <div className="flex items-center text-red-600 dark:text-red-400">
                  <FaExclamationCircle className="mr-1" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
            </div>
            
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaSave className="mr-2" />
              Save Settings
            </button>
          </div>
        </form>
      </div>
      
      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300">
        <p className="font-medium">About Settings</p>
        <p className="mt-1">
          These settings are stored locally in your browser. Clearing your browser cache will reset them to defaults.
        </p>
      </div>
    </div>
  );
} 