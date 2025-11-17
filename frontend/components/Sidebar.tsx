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
        timeFilter: number;
    };
    setFilters: React.Dispatch<React.SetStateAction<{
        routeId: string | null;
        timeFilter: number;
    }>>;
    viewMode: 'live' | 'heatmap';
    setViewMode: React.Dispatch<React.SetStateAction<'live' | 'heatmap'>>;
    selectedVehicleId: string | null;
    onVehicleSelect: (vehicleId: string | null) => void;
    heatmapTimeFilter: number;
    setHeatmapTimeFilter: React.Dispatch<React.SetStateAction<number>>;
}

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
    
    try {
        const date = new Date(timestampStr);
        if (isNaN(date.getTime())) return null;
        return date;
    } catch {
        return null;
    }
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
    heatmapTimeFilter,
    setHeatmapTimeFilter,
}: SidebarProps) {
    const { data: statsData } = useSWR<StatsResponse>(
        `${API_BASE_URL}/stats`,
        fetcher,
        { refreshInterval: POLL_INTERVAL_MS }
    );

    const [isCollapsed, setIsCollapsed] = useState(false);
    const activeVehicleCount = vehicles.length;

    const filteredCount = vehicles.filter(v => {
        if (filters.routeId && v.route?.id !== filters.routeId) {
            return false;
        }
        
        if (filters.timeFilter > 0 && v.feed_timestamp) {
            const timestamp = parseUTCTimestamp(v.feed_timestamp);
            if (!timestamp) return false;

            const now = new Date();
            const cutoffTime = new Date(now.getTime() - filters.timeFilter * 60000);
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

    const handleHeatmapTimeFilterChange = (value: number) => {
        setHeatmapTimeFilter(value);
    };

    const handleCustomHeatmapTimeFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value) || 0;
        if (value >= 0) {
            setHeatmapTimeFilter(value);
        }
    };

    const handleViewModeChange = (mode: 'live' | 'heatmap') => {
        setViewMode(mode);
        onVehicleSelect(null);
    };

    return (
        <div className={`flex flex-col h-full backdrop-blur-2xl bg-white/5 border-r border-white/10 text-gray-100 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-96'} shadow-glass overflow-hidden`}>
            {!isCollapsed && (
                <div className="flex flex-col h-full overflow-y-auto p-6">
                    <button 
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-3 self-end text-primary-accent hover:text-white rounded-xl glass-button hover:shadow-glow mb-4"
                    >
                        ◀
                    </button>
                    
                    <h1 className="text-2xl font-bold mb-6 text-primary-accent glow-text">
                        Rapid Bus KL Live Tracking
                    </h1>
                    
                    {/* Stats Panel */}
                    <div className="glass-card glass-card-hover p-5 rounded-2xl mb-5 flex-shrink-0">
                        <h2 className="text-lg font-semibold mb-4 text-white/90">System Status</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-white/70">Active Vehicles</span>
                                <span className="font-mono text-xl text-primary-accent glow-text">
                                    {stats?.active_vehicles || '...'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-white/70">Total Routes</span>
                                <span className="font-mono text-lg text-white/90">
                                    {stats?.total_routes || '...'}
                                </span>
                            </div>
                            <div className="pt-3 border-t border-white/10">
                                <p className="text-xs text-white/50">
                                    Last Update: {formatTimestampToLocal(stats?.last_updated)}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    {/* View Mode Switch */}
                    <div className="glass-card p-5 rounded-2xl mb-5 flex-shrink-0">
                        <h2 className="font-semibold mb-4 text-white/90">View Mode</h2>
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleViewModeChange('live')}
                                className={`flex-1 p-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                                    viewMode === 'live' 
                                        ? 'bg-primary-accent/20 text-primary-accent border-2 border-primary-accent shadow-glow' 
                                        : 'glass-button hover:bg-white/10 text-white/70'
                                }`}
                            >
                                Live Tracking
                            </button>
                            <button
                                onClick={() => handleViewModeChange('heatmap')}
                                className={`flex-1 p-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                                    viewMode === 'heatmap' 
                                        ? 'bg-primary-accent/20 text-primary-accent border-2 border-primary-accent shadow-glow' 
                                        : 'glass-button hover:bg-white/10 text-white/70'
                                }`}
                            >
                                Heatmap
                            </button>
                        </div>
                    </div>
                    
                    {/* Heatmap Time Filter */}
                    {viewMode === 'heatmap' && (
                        <div className="glass-card p-5 rounded-2xl mb-5 flex-shrink-0">
                            <h2 className="font-semibold mb-4 text-white/90">Heatmap Time Range</h2>
                            
                            <div>
                                <label className="block text-sm mb-3 text-white/70">
                                    Show data from the last
                                </label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {TIME_FILTER_OPTIONS.map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => handleHeatmapTimeFilterChange(option.value)}
                                            className={`px-4 py-2 text-xs rounded-full font-medium transition-all duration-300 ${
                                                heatmapTimeFilter === option.value 
                                                    ? 'bg-primary-accent/20 text-primary-accent border border-primary-accent shadow-glow' 
                                                    : 'glass-button hover:bg-white/10 text-white/70'
                                            }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                                
                                <div className="flex items-center gap-3 mt-3">
                                    <input
                                        type="number"
                                        min="0"
                                        value={heatmapTimeFilter}
                                        onChange={handleCustomHeatmapTimeFilter}
                                        className="w-24 p-2 glass-input rounded-xl text-white text-sm focus:outline-none"
                                        placeholder="Custom"
                                    />
                                    <span className="text-sm text-white/50">minutes</span>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Filters & Controls */}
                    {viewMode === 'live' && (
                        <div className="glass-card p-5 rounded-2xl mb-5 flex-shrink-0">
                            <h2 className="font-semibold mb-4 text-white/90">Filters</h2>
                            
                            {/* Route Filter */}
                            <div className="mb-5">
                                <label htmlFor="route-filter" className="block text-sm mb-2 text-white/70">
                                    Filter by Route
                                </label>
                                <select 
                                    id="route-filter"
                                    onChange={handleRouteFilterChange}
                                    value={filters.routeId || 'all'}
                                    className="w-full p-3 glass-input rounded-xl text-white text-sm focus:outline-none"
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
                            <div className="mt-5">
                                <label className="block text-sm mb-3 text-white/70">
                                    Last Updated Within
                                </label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {TIME_FILTER_OPTIONS.map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => handleTimeFilterChange(option.value)}
                                            className={`px-4 py-2 text-xs rounded-full font-medium transition-all duration-300 ${
                                                filters.timeFilter === option.value 
                                                    ? 'bg-primary-accent/20 text-primary-accent border border-primary-accent shadow-glow' 
                                                    : 'glass-button hover:bg-white/10 text-white/70'
                                            }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                                
                                <div className="flex items-center gap-3 mt-3">
                                    <input
                                        type="number"
                                        min="0"
                                        value={filters.timeFilter}
                                        onChange={handleCustomTimeFilter}
                                        className="w-24 p-2 glass-input rounded-xl text-white text-sm focus:outline-none"
                                        placeholder="Custom"
                                    />
                                    <span className="text-sm text-white/50">minutes</span>
                                </div>
                            </div>
                            
                            <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10">
                                <p className="text-xs text-white/70">
                                    Showing <span className="text-primary-accent font-semibold">{filteredCount}</span> / {activeVehicleCount} vehicles
                                </p>
                            </div>
                        </div>
                    )}
                    
                    {/* Selected Vehicle Info */}
                    <div className="glass-card p-5 rounded-2xl flex-shrink-0">
                        <h2 className="font-semibold mb-3 text-white/90">
                            {selectedVehicleId ? `Vehicle ${selectedVehicleId}` : "Click a vehicle"}
                        </h2>
                        {selectedVehicleId ? (
                            <>
                                <p className="text-sm text-primary-accent mb-4">
                                    Showing historical trace on map
                                </p>
                                <button
                                    onClick={() => onVehicleSelect(null)}
                                    className="w-full p-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-xl text-sm text-red-300 font-medium transition-all duration-300 hover:shadow-glow"
                                >
                                    Clear Selection
                                </button>
                            </>
                        ) : (
                            <p className="text-sm text-white/50">
                                Select a vehicle on the map to view its historical trace
                            </p>
                        )}
                    </div>
                </div>
            )}
            
            {isCollapsed && (
                <div className="flex flex-col items-center h-full p-4">
                    <button 
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-3 text-primary-accent hover:text-white rounded-xl glass-button hover:shadow-glow mb-8"
                    >
                        ▶
                    </button>
                    <div className="flex flex-col items-center mt-8 space-y-6">
                        <span className="text-xs transform rotate-90 whitespace-nowrap text-white/70">
                            Transit
                        </span>
                        <div className="glass-card p-3 rounded-xl">
                            <span className="text-lg font-mono text-primary-accent glow-text">
                                {activeVehicleCount}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
