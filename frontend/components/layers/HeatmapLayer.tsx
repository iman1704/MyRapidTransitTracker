// frontend/components/layers/HeatmapLayer.tsx

import L from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import { API_BASE_URL } from '../../lib/constants';
import { HistoricalPositionsResponse } from '../../types/api';

// 1. Import the leaflet.heat plugin to attach it to the L object
import 'leaflet.heat';

interface HeatmapLayerProps {
  isActive: boolean;
  timeFilter: number; // Time filter in minutes
}

const fetcher = async (url: string, timeFilterMinutes: number) => {
  const end_time = new Date();
  const start_time = new Date(end_time.getTime() - timeFilterMinutes * 60 * 1000);

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

export function HeatmapLayer({ isActive, timeFilter }: HeatmapLayerProps) {
  const map = useMap();
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const heatmapLayerRef = useRef<L.HeatLayer | null>(null); // Use the correct type: L.HeatLayer

  // Effect 1: Fetch historical data when active or timeFilter changes
  useEffect(() => {
    if (!isActive) {
      setHeatmapData([]);
      return;
    }

    console.log(`Fetching historical data for heatmap (last ${timeFilter} minutes)...`);
    fetcher(`${API_BASE_URL}/vehicles/historical`, timeFilter)
      .then((data: HistoricalPositionsResponse) => {
        if (data.success) {
          // Return plain array [lat, lng, intensity]
          const points = data.positions.map(p =>
            [p.latitude, p.longitude, 1.0]
          );
          setHeatmapData(points);
          console.log(`Fetched ${data.count} historical positions.`);
        }
      })
      .catch(err => console.error("Heatmap fetch error:", err));

  }, [isActive, timeFilter]);

  // Effect 2: Manage the Leaflet Heat Layer imperatively
  useEffect(() => {
    if (!map) return;

    // Cleanup previous layer
    if (heatmapLayerRef.current) {
      map.removeLayer(heatmapLayerRef.current);
      heatmapLayerRef.current = null;
    }

    if (isActive && heatmapData.length > 0) {
      // 2. Define the custom gradient to match the reference image
      // Black -> Orange -> Yellow -> White
      const gradient = {
        0.1: '#1a1a1a',  // Start with a very dark, near-black
        0.4: '#d95f0e',  // Dark Orange
        0.6: '#fec44f',  // Orange-Yellow
        0.8: '#ffffb2',  // Bright Yellow
        1.0: '#ffffff'   // White hot center
      };

      // 3. Create the L.heatLayer with custom options
      const heatLayer = (L as any).heatLayer(heatmapData, {
        radius: 7,         // Adjust for desired point influence size
        blur: 12,           // Adjust for smoothness
        maxZoom: 18,        // The zoom level at which the points reach maximum intensity
        gradient: gradient, // Apply our custom gradient
      }).addTo(map);

      heatmapLayerRef.current = heatLayer;
      console.log("Heatmap layer added to map.");
    }

    // No return function needed here as the cleanup is at the start of the effect

  }, [map, isActive, heatmapData]);

  return null;
}
