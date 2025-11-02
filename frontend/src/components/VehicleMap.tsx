import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { LatLngBounds, LatLngExpression } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Vehicle, FilterOptions } from '../types';
import { convertToKualaLumpurTimeOnly } from '../utils/time';

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface VehicleMapProps {
  vehicles: Vehicle[];
  selectedVehicle?: Vehicle | null;
  onVehicleSelect?: (vehicle: Vehicle) => void;
  filters?: FilterOptions;
  showHeatmap?: boolean;
  heatmapData?: any[];
}

const VehicleIcon = L.divIcon({
  html: `<div style="
    background: linear-gradient(135deg, #ff6b6b, #ffd93d);
    border: 2px solid #fff;
    border-radius: 50%;
    width: 12px;
    height: 12px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  "></div>`,
  className: 'vehicle-marker',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const SelectedVehicleIcon = L.divIcon({
  html: `<div style="
    background: linear-gradient(135deg, #ff3838, #ffaa00);
    border: 3px solid #fff;
    border-radius: 50%;
    width: 16px;
    height: 16px;
    box-shadow: 0 3px 8px rgba(0,0,0,0.4);
    animation: pulse 2s infinite;
  "></div>`,
  className: 'selected-vehicle-marker',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const MapBounds: React.FC<{ vehicles: Vehicle[] }> = ({ vehicles }) => {
  const map = useMap();
  
  useEffect(() => {
    if (vehicles.length > 0) {
      const bounds = new LatLngBounds(
        vehicles.map(v => [v.latitude, v.longitude] as LatLngExpression)
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [vehicles, map]);

  return null;
};

const HeatmapLayer: React.FC<{ data: any[] }> = ({ data }) => {
  const map = useMap();
  const heatmapRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && data.length > 0) {
      import('leaflet.heat').then((heatModule) => {
        if (heatmapRef.current) {
          map.removeLayer(heatmapRef.current);
        }

        const heatData = data.map(point => [
          point.latitude,
          point.longitude,
          1.0
        ]);

        // @ts-ignore - leaflet.heat module type issue
        heatmapRef.current = L.heatLayer(heatData, {
          radius: 25,
          blur: 15,
          maxZoom: 17,
          gradient: {
            0.4: '#ffd93d',
            0.6: '#ff9f40',
            0.8: '#ff6b6b',
            1.0: '#ff3838'
          }
        }).addTo(map);
      });
    }

    return () => {
      if (heatmapRef.current) {
        map.removeLayer(heatmapRef.current);
      }
    };
  }, [data, map]);

  return null;
};

const VehicleMap: React.FC<VehicleMapProps> = ({
  vehicles,
  selectedVehicle,
  onVehicleSelect,
  filters,
  showHeatmap = false,
  heatmapData = []
}) => {
  const [mapCenter] = useState<LatLngExpression>([40.7128, -74.0060]); // Default to NYC
  const [mapZoom] = useState(12);

  const getVehicleIcon = (vehicle: Vehicle) => {
    if (selectedVehicle && selectedVehicle.vehicle_id === vehicle.vehicle_id) {
      return SelectedVehicleIcon;
    }
    return VehicleIcon;
  };

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%', background: '#1a1a1a' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url='https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        />
        
        {vehicles.length > 0 && <MapBounds vehicles={vehicles} />}
        
        {showHeatmap && heatmapData.length > 0 && (
          <HeatmapLayer data={heatmapData} />
        )}
        
        {vehicles.map((vehicle) => (
          <Marker
            key={vehicle.vehicle_id}
            position={[vehicle.latitude, vehicle.longitude]}
            icon={getVehicleIcon(vehicle)}
            eventHandlers={{
              click: () => onVehicleSelect?.(vehicle),
            }}
          >
            <Popup>
              <div style={{ 
                minWidth: '200px', 
                fontFamily: 'Arial, sans-serif',
                fontSize: '14px'
              }}>
                <h4 style={{ 
                  margin: '0 0 8px 0', 
                  color: '#333',
                  borderBottom: '2px solid #ff6b6b',
                  paddingBottom: '4px'
                }}>
                  Vehicle {vehicle.vehicle_id}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {vehicle.route && (
                    <div>
                      <strong>Route:</strong> {vehicle.route.id}
                    </div>
                  )}
                  <div>
                    <strong>Speed:</strong> {vehicle.speed ? `${vehicle.speed} km/h` : 'N/A'}
                  </div>

                  <div>
                    <strong>Last Update:</strong> {convertToKualaLumpurTimeOnly(vehicle.last_update)}
                  </div>
                  {vehicle.bearing && (
                    <div>
                      <strong>Direction:</strong> {vehicle.bearing}°
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      <style>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default VehicleMap;