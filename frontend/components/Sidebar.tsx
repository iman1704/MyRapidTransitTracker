import useSWR from 'swr';
import { API_BASE_URL, POLL_INTERVAL_MS } from '../lib/constants';
import { formatTimestampToLocal } from '../lib/formatDate'
import { CurrentVehicle, Route, StatsResponse } from '../types/api';
import { useState } from 'react';

interface SidebarProps {
    vehicles: CurrentVehicle[];
    routes: Route[];
    filters: {
        routeId: string | null;
        timeFilter: number; // in minutes
    };
    setFilters: React.Dispatch<React.SetStateAction<{ 
        routeId: string | null;
        timeFilter: number;
    }>>;
    viewMode: 'live' | 'heatmap';
    setViewMode: React.Dispatch<React.SetStateAction<'live' | 'heatmap'>>;
    selectedVehicleId: string | null;
    onVehicleSelect: (vehicleId: string | null) => void;
}

// Add these preset options
const TIME_FILTER_OPTIONS = [
    { label: '5 min', value: 5 },
    { label: '10 min', value: 10 },
    { label: '30 min', value: 30 },
    { label: '1 hour', value: 60 },
    { label: '3 hours', value: 180 },
    { label: '12 hours', value: 720 },
];

const fetcher = (url: string) => fetch(url).then(res => res.json());

const parseUTCTimestamp = (timestampStr: string | null | undefined): Date | null => {
    if (!timestampStr) return null;

    // Append 'Z' to ensure the timestamp is parsed as UTC
    if (timestampStr.includes('T') && !timestampStr.endsWith('Z')) {
        timestampStr += 'Z';
    }
    
    if (timestampStr.includes('T') || timestampStr.includes('Z')) {
        return new Date(timestampStr);
    } else {
        // This branch might still be needed if some timestamps are unix epoch
        return new Date(parseInt(timestampStr) * 1000);
    }
};

const getCurrentUTCTime = (): Date => {
    return new Date(Date.now());
};

export function Sidebar({
    vehicles,
    routes,
    filters,
    setFilters,
    viewMode,
    setViewMode,
    selectedVehicleId,
    onVehicleSelect,
}: SidebarProps) {
    // Fetch system stats continuously
    const { data: statsData } = useSWR<StatsResponse>(
        `${API_BASE_URL}/stats`, 
        fetcher, 
        { refreshInterval: POLL_INTERVAL_MS }
    );
    
    const [isCollapsed, setIsCollapsed] = useState(false);
    const activeVehicleCount = vehicles.length;
    
    // Filter vehicles for display count
    const nowUTC = getCurrentUTCTime();
    const filteredCount = vehicles.filter(v => {
        if (filters.routeId && v.route?.id !== filters.routeId) {
            return false;
        }
        
        // Time filter check
        if (filters.timeFilter > 0 && v.feed_timestamp) {
            const timestamp = parseUTCTimestamp(v.feed_timestamp);

            if (!timestamp) {
                return false;
            }
            const cutoffTime = new Date(nowUTC.getTime() - filters.timeFilter * 60000);
            
            return timestamp >= cutoffTime;
        }
        
        return true;
    }).length;
    
    const stats = statsData?.stats;

    const handleRouteFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const routeId = e.target.value === 'all' ? null : e.target.value;
        setFilters(prev => ({ ...prev, routeId }));
    };
    
    const handleTimeFilterChange = (value: number) => {
        setFilters(prev => ({ ...prev, timeFilter: value }));
    };
    
    const handleCustomTimeFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value) || 0;
        if (value >= 0) {
            setFilters(prev => ({ ...prev, timeFilter: value }));
        }
    };

    const handleViewModeChange = (mode: 'live' | 'heatmap') => {
        setViewMode(mode);
        // Clear selection when switching modes
        onVehicleSelect(null);
    };
    
    return (
        <div className={`flex flex-col h-full bg-dark-bg text-gray-100 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-80 p-4'}`}>
            <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2 self-end text-primary-accent hover:text-white"
            >
                {isCollapsed ? '▶' : '◀'}
            </button>
            
            {!isCollapsed && (
                <>
                    <h1 className="text-xl font-bold mb-4 text-primary-accent">Rapid Bus KL Tracking</h1>
                    
                    {/* Stats Panel */}
                    <div className="bg-dark-card p-3 rounded-lg mb-4">
                        <h2 className="text-lg font-semibold mb-2">System Status</h2>
                        <p className="text-sm">Active Vehicles: <span className="font-mono text-primary-accent">{stats?.active_vehicles || '...'}</span></p>
                        <p className="text-sm">Total Routes: <span className="font-mono">{stats?.total_routes || '...'}</span></p>
                        <p className="text-xs text-gray-400 mt-2">Last Update: {formatTimestampToLocal(stats?.last_updated)}</p>
                    </div>
                    
                    {/* View Mode Switch */}
                    <div className="bg-dark-card p-3 rounded-lg mb-4">
                        <h2 className="font-semibold mb-2">View Mode</h2>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => handleViewModeChange('live')}
                                className={`flex-1 p-2 rounded text-sm ${viewMode === 'live' ? 'bg-primary-accent text-dark-bg' : 'bg-gray-600 hover:bg-gray-500'}`}
                            >
                                Live Tracking
                            </button>
                            <button
                                onClick={() => handleViewModeChange('heatmap')}
                                className={`flex-1 p-2 rounded text-sm ${viewMode === 'heatmap' ? 'bg-primary-accent text-dark-bg' : 'bg-gray-600 hover:bg-gray-500'}`}
                            >
                                Heatmap (1hr)
                            </button>
                        </div>
                    </div>
                    
                    {/* Filters & Controls */}
                    {viewMode === 'live' && (
                        <div className="bg-dark-card p-3 rounded-lg mb-4">
                            <h2 className="font-semibold mb-2">Filters</h2>
                            
                            {/* Route Filter */}
                            <div className="mb-3">
                                <label htmlFor="route-filter" className="block text-sm mb-1">Filter by Route:</label>
                                <select 
                                    id="route-filter"
                                    onChange={handleRouteFilterChange}
                                    value={filters.routeId || 'all'}
                                    className="w-full p-2 bg-gray-700 text-white rounded text-sm border border-gray-600"
                                >
                                    <option value="all">All Routes ({activeVehicleCount})</option>
                                    {routes.map(route => (
                                        <option key={route.id} value={route.id}>
                                            {route.id}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* Time Filter */}
                            <div className="mt-3">
                                <label className="block text-sm mb-1">Last Updated Within:</label>
                                <div className="flex flex-wrap gap-1 mb-2">
                                    {TIME_FILTER_OPTIONS.map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => handleTimeFilterChange(option.value)}
                                            className={`px-2 py-1 text-xs rounded ${
                                                filters.timeFilter === option.value 
                                                    ? 'bg-primary-accent text-dark-bg' 
                                                    : 'bg-gray-600 hover:bg-gray-500'
                                            }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                                
                                <div className="flex items-center mt-1">
                                    <input
                                        type="number"
                                        min="0"
                                        value={filters.timeFilter}
                                        onChange={handleCustomTimeFilter}
                                        className="w-20 p-1 bg-gray-700 text-white rounded text-sm border border-gray-600 mr-2"
                                        placeholder="Custom"
                                    />
                                    <span className="text-xs text-gray-400">minutes</span>
                                </div>
                            </div>
                            
                            <p className="text-xs mt-2 text-gray-400">
                                Showing {filteredCount} / {activeVehicleCount} vehicles updated in the last {filters.timeFilter} minutes.
                            </p>
                        </div>
                    )}
                    
                    {/* Selected Vehicle Info */}
                    <div className="bg-dark-card p-3 rounded-lg flex-1 overflow-y-auto">
                        <h2 className="font-semibold mb-2">
                            {selectedVehicleId ? `Selected Vehicle: ${selectedVehicleId}` : "Click a vehicle to trace"}
                        </h2>
                        {selectedVehicleId && (
                            <>
                                <p className="text-sm text-primary-accent mb-2">Showing historical trace on map.</p>
                                <button
                                    onClick={() => onVehicleSelect(null)}
                                    className="w-full p-1 mt-2 bg-red-600 hover:bg-red-700 rounded text-sm"
                                >
                                    Clear Selection
                                </button>
                            </>
                        )}
                    </div>
                </>
            )}
            
            {isCollapsed && (
                <div className="flex flex-col items-center mt-8 space-y-4">
                    <span className="text-sm transform rotate-90 whitespace-nowrap">Visualizer</span>
                    <span className="text-sm font-mono text-primary-accent">{activeVehicleCount}</span>
                </div>
            )}
        </div>
    );
}
