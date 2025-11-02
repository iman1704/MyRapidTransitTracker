import { VehiclesResponse, HistoricalResponse, StatsResponse, Route, TimeRange } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async getCurrentVehicles(): Promise<VehiclesResponse> {
    return this.request<VehiclesResponse>('/api/vehicles/current');
  }

  async getHistoricalVehicles(startTime: string, endTime?: string): Promise<HistoricalResponse> {
    const params = new URLSearchParams({
      start: startTime,
    });
    
    if (endTime) {
      params.append('end', endTime);
    }

    return this.request<HistoricalResponse>(`/api/vehicles/historical?${params}`);
  }

  async getStats(): Promise<StatsResponse> {
    return this.request<StatsResponse>('/api/stats');
  }

  async getRoutes(): Promise<{ success: boolean; routes: Route[] }> {
    return this.request<{ success: boolean; routes: Route[] }>('/api/routes');
  }

  async getVehicleHistory(vehicleId: string): Promise<{ success: boolean; history: any[] }> {
    return this.request<{ success: boolean; history: any[] }>(`/api/vehicles/${vehicleId}/history`);
  }

  async getVehiclesByRoute(routeId: string): Promise<{ success: boolean; vehicles: any[]; count: number }> {
    return this.request<{ success: boolean; vehicles: any[]; count: number }>(`/api/routes/${routeId}/vehicles`);
  }

  getTimeRangeDates(timeRange: TimeRange): { start: string; end: string } {
    const now = new Date();
    const end = now.toISOString();
    
    let start: Date;
    switch (timeRange) {
      case '1h':
        start = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '6h':
        start = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case '24h':
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(now.getTime() - 60 * 60 * 1000);
    }
    
    return {
      start: start.toISOString(),
      end
    };
  }
}

export const apiService = new ApiService();