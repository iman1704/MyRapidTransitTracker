// frontend/components/MapView.tsx

// import dynamic from 'next/dynamic';
import { MapContainer, TileLayer } from 'react-leaflet';
import { CurrentVehicle } from '../types/api';
import { HistoricalTraceLayer } from './layers/HistoricalTraceLayer';
import { LiveVehicleLayer } from './layers/LiveVehicleLayer';
import { HeatmapLayer } from './layers/HeatmapLayer';

// Ensure CSS is loaded (or include link tags in _app.tsx)
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
    vehicles: CurrentVehicle[];
    filters: {
        routeId: string | null;
    };
    viewMode: 'live' | 'heatmap';
    selectedVehicleId: string | null;
    onVehicleSelect: (vehicleId: string) => void;
}

// --- PRODUCTION READY: Mapbox Configuration ---
const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

// Mapbox Dark Theme (Monochrome)
// Use your preferred style URL (e.g., mapbox/dark-v10 or mapbox/navigation-night-v1)
const MAPBOX_STYLE_URL = `https://api.mapbox.com/styles/v1/mapbox/dark-v10/tiles/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`;
const ATTRIBUTION = 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>';
// ---------------------------------------------


// Central KL coordinates
const INITIAL_CENTER: [number, number] = [3.139, 101.686];
const INITIAL_ZOOM = 12;

// Filter vehicles based on the current state
const filterVehicles = (vehicles: CurrentVehicle[], filters: MapViewProps['filters']): CurrentVehicle[] => {
    return vehicles.filter(v => {
        if (filters.routeId && v.route?.id !== filters.routeId) {
            return false;
        }
        return true;
    });
}

export default function MapView({ vehicles, filters, viewMode, selectedVehicleId, onVehicleSelect }: MapViewProps) {
    
    if (!MAPBOX_ACCESS_TOKEN) {
        return <div className="flex items-center justify-center h-full w-full bg-dark-bg text-red-400">
            ERROR: Mapbox Access Token not configured in .env.local
        </div>;
    }

    const filteredVehicles = filterVehicles(vehicles, filters);

    return (
        <div className="flex-grow h-full">
            <MapContainer 
                center={INITIAL_CENTER} 
                zoom={INITIAL_ZOOM} 
                scrollWheelZoom={true}
                className="h-full w-full bg-dark-bg z-0"
                maxZoom={18}
                minZoom={10}
            >
                {/* Mapbox Tile Layer */}
                <TileLayer
                    attribution={ATTRIBUTION}
                    url={MAPBOX_STYLE_URL}
                />

                {/* Live Vehicle Layer (uses PixiOverlay simulation) */}
                {viewMode === 'live' && (
                    <LiveVehicleLayer 
                        vehicles={filteredVehicles} 
                        onVehicleSelect={onVehicleSelect} 
                    />
                )}

                {/* Heatmap Layer (fetches historical data) */}
                <HeatmapLayer isActive={viewMode === 'heatmap'} />


                {/* Individual Vehicle Trace */}
                <HistoricalTraceLayer selectedVehicleId={selectedVehicleId} />

            </MapContainer>
        </div>
    );
}

// Dynamic import for client-side rendering protection
// export default dynamic(() => Promise.resolve(MapView), {
//     ssr: false,
// });
