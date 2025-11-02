export interface Vehicle {
  vehicle_id: string;
  latitude: number;
  longitude: number;
  bearing?: number;
  speed?: number;
  route?: {
    id: string;
  };
  trip_id?: string;
  last_update?: string;
  status?: 'IN_TRANSIT_TO' | 'STOPPED_AT' | 'INCOMING_AT';
}

export interface Route {
  id: string;
}

export interface VehiclePosition {
  vehicle_id: string;
  latitude: number;
  longitude: number;
  recorded_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  count?: number;
  data?: T;
  error?: string;
}

export interface VehiclesResponse {
  success: boolean;
  count: number;
  vehicles: Vehicle[];
  timestamp?: string;
}

export interface HistoricalResponse {
  success: boolean;
  count: number;
  positions: VehiclePosition[];
}

export interface StatsResponse {
  success: boolean;
  stats: {
    total_vehicles: number;
    active_vehicles: number;
    total_routes: number;
    last_updated: string;
  };
}

export type TimeRange = '1h' | '6h' | '24h' | '7d';
export type LastUpdatedRange = '5m' | '30m' | '1h' | '3h' | '6h' | '12h' | '24h' | 'custom' | 'all';

export interface FilterOptions {
  vehicleTypes: string[];
  routes: string[];
  lastUpdated: LastUpdatedRange;
  customLastUpdatedMinutes?: number; // Custom duration in minutes when lastUpdated is 'custom'
}