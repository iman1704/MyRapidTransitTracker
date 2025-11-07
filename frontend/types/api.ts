
/**
 * TypeScript interfaces matching the FastAPI backend responses.
 */

// --- Base Data Structures ---

export interface Route {
    id: string;
}

export interface VehiclePosition {
    latitude: number;
    longitude: number;
    bearing: number;
    speed: number;
    feed_timestamp: string; // ISO format
    route_id?: string;
    trip_id?: string;
    updated_at?: string; // ISO format
}

export interface CurrentVehicle extends VehiclePosition {
    vehicle_id: string;
    route: Route | null;
}

export interface HistoricalPosition {
    latitude: number;
    longitude: number;
    recorded_at: string; // ISO format
    vehicle_id: string;
}


// --- API Response Interfaces ---

export interface StatsResponse {
    success: boolean;
    stats: {
        total_vehicles: number;
        active_vehicles: number;
        total_routes: number;
        last_updated: string; // ISO format
    };
}

export interface CurrentVehiclesResponse {
    success: boolean;
    count: number;
    vehicles: CurrentVehicle[];
    timestamp: string; // ISO format
}

export interface RoutesResponse {
    success: boolean;
    routes: Route[];
}

export interface VehicleHistoryResponse {
    success: boolean;
    vehicle_id: string;
    history: {
        latitude: number;
        longitude: number;
        bearing: number;
        speed: number;
        timestamp: string;
    }[];
}

export interface HistoricalPositionsResponse {
    success: boolean;
    count: number;
    positions: HistoricalPosition[];
}
