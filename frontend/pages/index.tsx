// frontend/pages/index.tsx
import { useState } from 'react';
import useSWR from 'swr';
import { Sidebar } from '../components/Sidebar';
import dynamic from 'next/dynamic';
import { API_BASE_URL, POLL_INTERVAL_MS } from '../lib/constants';
import { CurrentVehicle, CurrentVehiclesResponse, Route, RoutesResponse } from '../types/api';

const MapView = dynamic(() => import('../components/MapView'), {
    ssr: false,
    loading: () => (
        <div className="flex-grow h-full backdrop-blur-2xl bg-white/5 flex items-center justify-center">
            <div className="glass-card p-8 rounded-2xl">
                <p className="text-white text-lg">Loading Map...</p>
            </div>
        </div>
    ),
});

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Home() {
    const [viewMode, setViewMode] = useState<'live' | 'heatmap'>('live');
    const [filters, setFilters] = useState<{
        routeId: string | null;
        timeFilter: number;
    }>({
        routeId: null,
        timeFilter: 30
    });
    const [heatmapTimeFilter, setHeatmapTimeFilter] = useState<number>(60);

    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

    const { data: vehicleData } = useSWR<CurrentVehiclesResponse>(
        `${API_BASE_URL}/vehicles/current`, 
        fetcher, 
        { refreshInterval: POLL_INTERVAL_MS }
    );

    const vehicles: CurrentVehicle[] = vehicleData?.vehicles || [];

    const { data: routesData } = useSWR<RoutesResponse>(
        `${API_BASE_URL}/routes`, 
        fetcher,
        { refreshInterval: 60000 }
    );

    const routes: Route[] = routesData?.routes || [];

    const handleVehicleSelect = (vehicleId: string | null) => {
        setSelectedVehicleId(vehicleId);
        if (vehicleId) {
            setViewMode('live');
        }
    };

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-gradient-to-br from-[#0a0e1a] via-[#1a1f3a] to-[#0a0e1a]">
            <Sidebar 
                vehicles={vehicles}
                routes={routes}
                filters={filters}
                setFilters={setFilters}
                viewMode={viewMode}
                setViewMode={setViewMode}
                selectedVehicleId={selectedVehicleId}
                onVehicleSelect={handleVehicleSelect}
                heatmapTimeFilter={heatmapTimeFilter}
                setHeatmapTimeFilter={setHeatmapTimeFilter}
            />
            
            <MapView 
                vehicles={vehicles}
                filters={filters}
                viewMode={viewMode}
                selectedVehicleId={selectedVehicleId}
                onVehicleSelect={handleVehicleSelect}
                heatmapTimeFilter={heatmapTimeFilter}
            />
        </div>
    );
}
