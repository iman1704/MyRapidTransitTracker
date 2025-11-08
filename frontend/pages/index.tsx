// frontend/pages/index.tsx
import { useState } from 'react';
import useSWR from 'swr';
import { Sidebar } from '../components/Sidebar';
// Import 'dynamic' from Next.js
import dynamic from 'next/dynamic';
import { API_BASE_URL, POLL_INTERVAL_MS } from '../lib/constants';
import { CurrentVehicle, CurrentVehiclesResponse, Route, RoutesResponse } from '../types/api';

// Dynamically import the MapView component and disable SSR
const MapView = dynamic(() => import('../components/MapView'), {
  ssr: false,
  // Optional: Add a loading component while the map is loading
  loading: () => <div className="flex-grow h-full bg-dark-bg flex items-center justify-center"><p className="text-white">Loading Map...</p></div>,
});

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Home() {
    const [viewMode, setViewMode] = useState<'live' | 'heatmap'>('live');
    const [filters, setFilters] = useState<{ 
        routeId: string | null;
        timeFilter: number; // in minutes
    }>({ 
        routeId: null,
        timeFilter: 30 // Default to 30 minutes
    });
    
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
    
    // 1. Fetch live vehicle data (polling)
    const { data: vehicleData } = useSWR<CurrentVehiclesResponse>(
        `${API_BASE_URL}/vehicles/current`, 
        fetcher, 
        { refreshInterval: POLL_INTERVAL_MS }
    );
    
    const vehicles: CurrentVehicle[] = vehicleData?.vehicles || [];
    
    // 2. Fetch routes list (less frequent)
    const { data: routesData } = useSWR<RoutesResponse>(
        `${API_BASE_URL}/routes`, 
        fetcher,
        { refreshInterval: 60000 } // Poll routes every minute
    );
    
    const routes: Route[] = routesData?.routes || [];
    
    const handleVehicleSelect = (vehicleId: string | null) => {
        setSelectedVehicleId(vehicleId);
        if (vehicleId) {
            setViewMode('live');
        }
    };
    
    return (
        <div className="flex h-screen w-screen overflow-hidden bg-dark-bg">
            <Sidebar 
                vehicles={vehicles}
                routes={routes}
                filters={filters}
                setFilters={setFilters}
                viewMode={viewMode}
                setViewMode={setViewMode}
                selectedVehicleId={selectedVehicleId}
                onVehicleSelect={handleVehicleSelect}
            />
            
            {/* This will now only render on the client side */}
            <MapView 
                vehicles={vehicles}
                filters={filters}
                viewMode={viewMode}
                selectedVehicleId={selectedVehicleId}
                onVehicleSelect={handleVehicleSelect}
            />
        </div>
    );
}
