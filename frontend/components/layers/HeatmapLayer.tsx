// frontend/components/layers/HeatmapLayer.tsx

import L from 'leaflet';
// Add this import line for React Hooks
import { useEffect, useState, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { API_BASE_URL } from '../../lib/constants';
import { HistoricalPositionsResponse } from '../../types/api';

// NOTE: We need to import the heatmap library imperatively in a real app:
// import 'leaflet.heat';

interface HeatmapLayerProps {
    isActive: boolean;
}

const fetcher = async (url: string) => {
    // Calculate time range (last 1 hour)
    const end_time = new Date();
    const start_time = new Date(end_time.getTime() - 60 * 60 * 1000);

    const params = new URLSearchParams({
        start: start_time.toISOString(),
        end: end_time.toISOString()
    });

    const response = await fetch(`${url}?${params.toString()}`);
    if (!response.ok) {
        throw new Error('Failed to fetch historical data');
    }
    return response.json();
};

export function HeatmapLayer({ isActive }: HeatmapLayerProps) {
    const map = useMap();
    const [heatmapData, setHeatmapData] = useState<L.LatLngExpression[]>([]);
    const heatmapLayerRef = useRef<L.Layer | null>(null);

    // Effect 1: Fetch historical data when active
    useEffect(() => {
        if (!isActive) {
            setHeatmapData([]);
            return;
        }

        console.log("Fetching historical data for heatmap...");
        fetcher(`${API_BASE_URL}/vehicles/historical`)
            .then((data: HistoricalPositionsResponse) => {
                if (data.success) {
                    const points = data.positions.map(p => 
                        [p.latitude, p.longitude, 0.5] // Lat, Lng, Intensity (0.5)
                    ) as L.LatLngExpression[];
                    setHeatmapData(points);
                    console.log(`Fetched ${data.count} historical positions.`);
                }
            })
            .catch(err => console.error("Heatmap fetch error:", err));

    }, [isActive]);

    // Effect 2: Manage the Leaflet Heat Layer imperatively
    useEffect(() => {
        if (!map) return;

        // Cleanup previous layer
        if (heatmapLayerRef.current) {
            map.removeLayer(heatmapLayerRef.current);
            heatmapLayerRef.current = null;
        }

        if (isActive && heatmapData.length > 0) {
            // NOTE: L.heatLayer is provided by leaflet.heat plugin
            const heatLayer = L.layerGroup().addTo(map); // Placeholder for L.heatLayer(heatmapData).addTo(map);
            
            // Simulation visibility
            heatmapData.slice(0, 500).forEach(point => {
                const [lat, lng] = point as [number, number];
                L.circleMarker([lat, lng], {
                    radius: 2,
                    fillColor: '#f03',
                    color: '#f03',
                    weight: 0,
                    fillOpacity: 0.5
                }).addTo(heatLayer);
            });

            heatmapLayerRef.current = heatLayer;
            console.log("Heatmap layer added to map.");
        }
        
        return () => {
             if (heatmapLayerRef.current) {
                map.removeLayer(heatmapLayerRef.current);
                heatmapLayerRef.current = null;
            }
        };

    }, [map, isActive, heatmapData]);

    return null;
}
