// frontend/components/MapView.tsx
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
        timeFilter: number; // in minutes
    };
    viewMode: 'live' | 'heatmap';
    selectedVehicleId: string | null;
    onVehicleSelect: (vehicleId: string) => void;
}

// --- PRODUCTION READY: Mapbox Configuration ---
const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
// Mapbox Dark Theme (Monochrome)
const MAPBOX_STYLE_URL = `https://api.mapbox.com/styles/v1/mapbox/dark-v10/tiles/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`;
const ATTRIBUTION = 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>';

// Central KL coordinates
const INITIAL_CENTER: [number, number] = [3.139, 101.686];
const INITIAL_ZOOM = 12;

const parseUTCTimestamp = (timestampStr: string | null | undefined): Date | null => {
    if (!timestampStr) return null;
    if (timestampStr.includes('T') || timestampStr.includes('Z')) {
        return new Date(timestampStr);
    } else {
        return new Date(parseInt(timestampStr) * 1000);
    }
};

const getCurrentUTCTime = (): Date => {
    return new Date(Date.now());
};

// Filter vehicles based on the current state
const filterVehicles = (vehicles: CurrentVehicle[], filters: MapViewProps['filters']): CurrentVehicle[] => {
    const nowUTC = getCurrentUTCTime();
    
    return vehicles.filter(v => {
        // Route filter
        if (filters.routeId && v.route?.id !== filters.routeId) {
            return false;
        }
        
        // Time filter - check if vehicle was updated within the specified timeframe
        if (filters.timeFilter > 0 && v.feed_timestamp) {
            const timestamp = parseUTCTimestamp(v.feed_timestamp);
            if (!timestamp) return false;
            const cutoffTime = new Date(nowUTC.getTime() - filters.timeFilter * 60000);
            return timestamp >= cutoffTime;
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
