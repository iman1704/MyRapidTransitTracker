
import L from 'leaflet';
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { CurrentVehicle } from '../../types/api';
import { formatTimestampToLocal } from '../../lib/formatDate'
// NOTE: This component simulates the required imperative behavior for performance layers
// In a real implementation, 'Leaflet.PixiOverlay' and 'PixiJS' would be used here.

interface LiveVehicleLayerProps {
    vehicles: CurrentVehicle[];
    onVehicleSelect: (vehicleId: string) => void;
}

// Global reference for the simulated layer (to handle cleanup)
let simulatedLayer: L.Layer | null = null;

const createSimulatedMarker = (vehicle: CurrentVehicle, onClick: (id: string) => void) => {
    // In a real PixiOverlay implementation, this would be a Pixi Sprite/Graphics object.
    // Here, we use a standard Leaflet Marker for simulation visibility.
    const marker = L.circleMarker([vehicle.latitude, vehicle.longitude], {
        radius: 6,
        fillColor: vehicle.route?.id ? "#06b6d4" : "#facc15", // Cyan or Yellow
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    });

    const tooltipContent = `
        <b>ID:</b> ${vehicle.vehicle_id}<br/>
        <b>Route:</b> ${vehicle.route?.id || 'N/A'}<br/>
        <b>Speed:</b> ${Math.round(vehicle.speed || 0)} km/h<br/>
        <b>Last Update:</b> ${formatTimestampToLocal(vehicle.feed_timestamp)}
        `;

    marker.bindTooltip(tooltipContent);
    // Simulate click interaction
    marker.on('click', () => {
        onClick(vehicle.vehicle_id);
    });

    return marker;
};

export function LiveVehicleLayer({ vehicles, onVehicleSelect }: LiveVehicleLayerProps) {
    const map = useMap();
    const layerGroupRef = useRef<L.LayerGroup | null>(null);

    // Effect 1: Initialize the Layer Group once on mount
    useEffect(() => {
        if (!layerGroupRef.current) {
            const layerGroup = L.layerGroup().addTo(map);
            layerGroupRef.current = layerGroup;
            simulatedLayer = layerGroup;
            
            // Cleanup function
            return () => {
                map.removeLayer(layerGroup);
                layerGroupRef.current = null;
                simulatedLayer = null;
            };
        }
    }, [map]);


    // Effect 2: Update the layer whenever the vehicles prop changes
    useEffect(() => {
        const layerGroup = layerGroupRef.current;
        if (!layerGroup) return;

        // 1. Clear existing markers/sprites
        layerGroup.clearLayers();

        // 2. Redraw new markers/sprites
        vehicles.forEach(vehicle => {
            const marker = createSimulatedMarker(vehicle, onVehicleSelect);
            layerGroup.addLayer(marker);
        });

        // NOTE: In the real Pixi implementation, this step would be a single call:
        // pixiOverlay.update(vehicles.map(v => ({...})))
        // followed by pixiOverlay.redraw();

        // Log performance metrics (simulation)
        console.log(`[Pixi Simulation] Redrew ${vehicles.length} vehicle sprites.`);

    }, [vehicles, onVehicleSelect]);


    return null; // This component manages the Leaflet layer imperatively, so it renders nothing.
}
