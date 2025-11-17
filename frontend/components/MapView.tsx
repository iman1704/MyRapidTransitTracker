// frontend/components/MapView.tsx
import { MapContainer, TileLayer } from 'react-leaflet';
import { CurrentVehicle } from '../types/api';
import { HistoricalTraceLayer } from './layers/HistoricalTraceLayer';
import { LiveVehicleLayer } from './layers/LiveVehicleLayer';
import { HeatmapLayer } from './layers/HeatmapLayer';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
    vehicles: CurrentVehicle[];
    filters: {
        routeId: string | null;
        timeFilter: number;
    };
    viewMode: 'live' | 'heatmap';
    selectedVehicleId: string | null;
    onVehicleSelect: (vehicleId: string) => void;
    heatmapTimeFilter: number;
}

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const MAPBOX_STYLE_URL = `https://api.mapbox.com/styles/v1/mapbox/dark-v10/tiles/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`;
const ATTRIBUTION = 'Map data © <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>';

const INITIAL_CENTER: [number, number] = [3.139, 101.686];
const INITIAL_ZOOM = 12;

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

const filterVehicles = (vehicles: CurrentVehicle[], filters: MapViewProps['filters']): CurrentVehicle[] => {
    const now = new Date();
    
    return vehicles.filter(v => {
        if (filters.routeId && v.route?.id !== filters.routeId) {
            return false;
        }
        
        if (filters.timeFilter > 0 && v.feed_timestamp) {
            const timestamp = parseUTCTimestamp(v.feed_timestamp);
            if (!timestamp) return false;

            const cutoffTime = new Date(now.getTime() - filters.timeFilter * 60000);
            return timestamp >= cutoffTime;
        }
        
        return true;
    });
}

export default function MapView({ vehicles, filters, viewMode, selectedVehicleId, onVehicleSelect, heatmapTimeFilter }: MapViewProps) {
    if (!MAPBOX_ACCESS_TOKEN) {
        return (
            <div className="flex items-center justify-center h-full w-full backdrop-blur-2xl bg-white/5">
                <div className="glass-card p-8 rounded-2xl border-2 border-red-500/50">
                    <p className="text-red-400 font-semibold">
                        ERROR: Mapbox Access Token not configured
                    </p>
                </div>
            </div>
        );
    }

    const filteredVehicles = filterVehicles(vehicles, filters);

    return (
        <div className="flex-grow h-full relative">
            <div className="absolute inset-0 pointer-events-none z-10">
                <div className="absolute top-6 left-6 right-6 h-1 bg-gradient-to-r from-transparent via-primary-accent/30 to-transparent rounded-full"></div>
                <div className="absolute bottom-6 left-6 right-6 h-1 bg-gradient-to-r from-transparent via-primary-accent/30 to-transparent rounded-full"></div>
            </div>
            
            <MapContainer 
                center={INITIAL_CENTER} 
                zoom={INITIAL_ZOOM} 
                scrollWheelZoom={true}
                className="h-full w-full z-0 rounded-l-3xl"
                maxZoom={18}
                minZoom={10}
            >
                <TileLayer
                    attribution={ATTRIBUTION}
                    url={MAPBOX_STYLE_URL}
                />
                
                {viewMode === 'live' && (
                    <LiveVehicleLayer 
                        vehicles={filteredVehicles} 
                        onVehicleSelect={onVehicleSelect} 
                    />
                )}
                
                <HeatmapLayer isActive={viewMode === 'heatmap'} timeFilter={heatmapTimeFilter} />
                
                <HistoricalTraceLayer selectedVehicleId={selectedVehicleId} />
            </MapContainer>
        </div>
    );
}
