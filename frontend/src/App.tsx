import React, { useState, useEffect, useCallback } from 'react';
import VehicleMap from './components/VehicleMap';
import ControlPanel from './components/ControlPanel';
import { apiService } from './services/api';
import { Vehicle, Route, TimeRange, FilterOptions, VehiclePosition } from './types';
import { convertToKualaLumpurTime, isWithinTimeLimitInKualaLumpur } from './utils/time';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

const App: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [heatmapData, setHeatmapData] = useState<VehiclePosition[]>([]);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showRealTime, setShowRealTime] = useState(true);
  const [currentTimeRange, setCurrentTimeRange] = useState<TimeRange>('1h');
  const [filters, setFilters] = useState<FilterOptions>({
    vehicleTypes: [],
    routes: [],
    lastUpdated: 'all',
    customLastUpdatedMinutes: 60
  });
  const [stats, setStats] = useState({
    total_vehicles: 0,
    active_vehicles: 0,
    total_routes: 0,
    last_updated: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterVehicles = useCallback((allVehicles: Vehicle[], currentFilters: FilterOptions) => {
    return allVehicles.filter(vehicle => {
      // Route filter
      if (currentFilters.routes.length > 0 && (!vehicle.route || !currentFilters.routes.includes(vehicle.route.id))) {
        return false;
      }

      // Last updated filter - using Kuala Lumpur timezone for consistency
      if (currentFilters.lastUpdated !== 'all') {
        if (!vehicle.last_update) {
          // If the vehicle doesn't have a last_update timestamp, exclude it
          return false;
        }
        
        // Use the new utility function that handles timezone conversion properly
        let timeLimitMinutes = 0;
        switch (currentFilters.lastUpdated) {
          case '5m':
            timeLimitMinutes = 5;
            break;
          case '30m':
            timeLimitMinutes = 30;
            break;
          case '1h':
            timeLimitMinutes = 60;
            break;
          case '3h':
            timeLimitMinutes = 3 * 60;
            break;
          case '6h':
            timeLimitMinutes = 6 * 60;
            break;
          case '12h':
            timeLimitMinutes = 12 * 60;
            break;
          case '24h':
            timeLimitMinutes = 24 * 60;
            break;
          case 'custom':
            // For custom, use the custom duration in minutes if available, otherwise default to 1 hour
            timeLimitMinutes = currentFilters.customLastUpdatedMinutes || 60;
            break;
          default:
            timeLimitMinutes = 0; // Default to 0 minutes (should include all vehicles)
            break;
        }
        
        // Check if the vehicle's last update is within the time limit in KL timezone
        if (!isWithinTimeLimitInKualaLumpur(vehicle.last_update, timeLimitMinutes)) {
          return false;
        }
      }
      return true;
    });
  }, []);

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [vehiclesResponse, routesResponse, statsResponse] = await Promise.all([
        apiService.getCurrentVehicles(),
        apiService.getRoutes(),
        apiService.getStats()
      ]);

      if (vehiclesResponse.success) {
        setVehicles(filterVehicles(vehiclesResponse.vehicles, filters));
      }

      if (routesResponse.success) {
        setRoutes(routesResponse.routes);
      }

      if (statsResponse.success) {
        setStats(statsResponse.stats);
      }
    } catch (err) {
      setError('Failed to fetch initial data');
      console.error('Error fetching initial data:', err);
    } finally {
      setLoading(false);
    }
  }, [filterVehicles, filters]);

  // Fetch heatmap data
  const fetchHeatmapData = useCallback(async (timeRange: TimeRange) => {
    try {
      const { start, end } = apiService.getTimeRangeDates(timeRange);
      const response = await apiService.getHistoricalVehicles(start, end);
      
      if (response.success) {
        setHeatmapData(response.positions);
      }
    } catch (err) {
      console.error('Error fetching heatmap data:', err);
      setHeatmapData([]);
    }
  }, []);

  // Real-time data update
  const updateRealTimeData = useCallback(async () => {
    if (!showRealTime) return;

    try {
      const response = await apiService.getCurrentVehicles();
      if (response.success) {
        setVehicles(filterVehicles(response.vehicles, filters));
        
        // Update stats
        const statsResponse = await apiService.getStats();
        if (statsResponse.success) {
          setStats(statsResponse.stats);
        }
      }
    } catch (err) {
      console.error('Error updating real-time data:', err);
    }
  }, [showRealTime, filterVehicles, filters]);

  // Handle time range change
  const handleTimeRangeChange = useCallback((timeRange: TimeRange) => {
    setCurrentTimeRange(timeRange);
    if (showHeatmap) {
      fetchHeatmapData(timeRange);
    }
  }, [showHeatmap, fetchHeatmapData]);

  // Handle filter change
  const handleFilterChange = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
  }, []);

  // Handle view toggles
  const handleToggleHeatmap = useCallback((show: boolean) => {
    setShowHeatmap(show);
    if (show) {
      fetchHeatmapData(currentTimeRange);
    }
  }, [currentTimeRange, fetchHeatmapData]);

  const handleToggleRealTime = useCallback((show: boolean) => {
    setShowRealTime(show);
  }, []);

  // Handle vehicle selection
  const handleVehicleSelect = useCallback((vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
  }, []);

  // Initialize data on mount
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Set up real-time updates
  useEffect(() => {
    if (!showRealTime) return;

    const interval = setInterval(updateRealTimeData, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [showRealTime, updateRealTimeData]);

  // Handle connection status
  useEffect(() => {
    const handleOnline = () => setError(null);
    const handleOffline = () => setError('Connection lost. Please check your internet connection.');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const filteredVehicles = filterVehicles(vehicles, filters);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-white">Loading vehicle tracking data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">
            🚌 Real-time Vehicle Tracking
          </h1>
          <div className="header-info">
            <span className="data-source">Data Source: GTFS Real-time Feed</span>
            {error && (
              <div className="error-indicator">
                ⚠️ {error}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        <VehicleMap
          vehicles={filteredVehicles}
          selectedVehicle={selectedVehicle}
          onVehicleSelect={handleVehicleSelect}
          filters={filters}
          showHeatmap={showHeatmap}
          heatmapData={heatmapData}
        />
        
        <ControlPanel
          onTimeRangeChange={handleTimeRangeChange}
          onFilterChange={handleFilterChange}
          onToggleHeatmap={handleToggleHeatmap}
          onToggleRealTime={handleToggleRealTime}
          showHeatmap={showHeatmap}
          showRealTime={showRealTime}
          currentTimeRange={currentTimeRange}
          routes={routes}
          stats={stats}
        />
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <span>© 2025 Vehicle Tracking System</span>
          <span className="separator">|</span>
          <span>Powered by FastAPI & React</span>
          <span className="separator">|</span>
          <span>
            Last Update: {convertToKualaLumpurTime(stats.last_updated)}
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;