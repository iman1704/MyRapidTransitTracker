import L from 'leaflet';
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { CurrentVehicle } from '../../types/api';
import { formatTimestampToLocal } from '../../lib/formatDate'

interface LiveVehicleLayerProps {
    vehicles: CurrentVehicle[];
    onVehicleSelect: (vehicleId: string) => void;
}

let simulatedLayer: L.Layer | null = null;

const createSimulatedMarker = (vehicle: CurrentVehicle, onClick: (id: string) => void) => {
    const marker = L.circleMarker([vehicle.latitude, vehicle.longitude], {
        radius: 4,  // Changed from 8 to 4
        fillColor: vehicle.route?.id ? "#06b6d4" : "#facc15",
        color: vehicle.route?.id ? "#06b6d4" : "#facc15",
        weight: 0,
        opacity: 0.9,
        fillOpacity: 0.7
    });

    const tooltipContent = `
        <div style="
            background: rgba(10, 14, 26, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(6, 182, 212, 0.3);
            border-radius: 12px;
            padding: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        ">
            <div style="color: #06b6d4; font-weight: 600; margin-bottom: 8px; font-size: 14px;">
                Vehicle ${vehicle.vehicle_id}
            </div>
            <div style="color: rgba(255, 255, 255, 0.7); font-size: 12px; line-height: 1.6;">
                <div><strong>Route:</strong> ${vehicle.route?.id || 'N/A'}</div>
                <div><strong>Speed:</strong> ${Math.round(vehicle.speed || 0)} km/h</div>
                <div><strong>Updated:</strong> ${formatTimestampToLocal(vehicle.feed_timestamp)}</div>
            </div>
        </div>
    `;

    marker.bindTooltip(tooltipContent, {
        className: 'glass-tooltip',
        direction: 'top',
        offset: [0, -8]  // Adjusted offset for smaller marker
    });
    
    marker.on('click', () => {
        onClick(vehicle.vehicle_id);
    });

    return marker;
};

export function LiveVehicleLayer({ vehicles, onVehicleSelect }: LiveVehicleLayerProps) {
    const map = useMap();
    const layerGroupRef = useRef<L.LayerGroup | null>(null);

    useEffect(() => {
        if (!layerGroupRef.current) {
            const layerGroup = L.layerGroup().addTo(map);
            layerGroupRef.current = layerGroup;
            simulatedLayer = layerGroup;
            
            return () => {
                map.removeLayer(layerGroup);
                layerGroupRef.current = null;
                simulatedLayer = null;
            };
        }
    }, [map]);

    useEffect(() => {
        const layerGroup = layerGroupRef.current;
        if (!layerGroup) return;

        layerGroup.clearLayers();

        vehicles.forEach(vehicle => {
            const marker = createSimulatedMarker(vehicle, onVehicleSelect);
            layerGroup.addLayer(marker);
        });

        console.log(`[Pixi Simulation] Redrew ${vehicles.length} vehicle sprites.`);

    }, [vehicles, onVehicleSelect]);

    return null;
}
