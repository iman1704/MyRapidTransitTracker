
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
    };
    setFilters: React.Dispatch<React.SetStateAction<{ routeId: string | null }>>;
    viewMode: 'live' | 'heatmap';
    setViewMode: React.Dispatch<React.SetStateAction<'live' | 'heatmap'>>;
    selectedVehicleId: string | null;
    onVehicleSelect: (vehicleId: string | null) => void;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

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
    const filteredCount = vehicles.filter(v => 
        filters.routeId ? v.route?.id === filters.routeId : true
    ).length;

    const stats = statsData?.stats;

    const handleRouteFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const routeId = e.target.value === 'all' ? null : e.target.value;
        setFilters({ routeId });
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
                    <h1 className="text-xl font-bold mb-4 text-primary-accent">Rapid Bus Visualizer</h1>

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
                            <p className="text-xs mt-2 text-gray-400">
                                Showing {filteredCount} / {activeVehicleCount} vehicles.
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
