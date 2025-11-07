
import { useEffect, useState } from 'react';
import { Polyline, Tooltip, useMap } from 'react-leaflet';
import useSWR from 'swr';
import { API_BASE_URL } from '../../lib/constants';
import { VehicleHistoryResponse } from '../../types/api';

interface HistoricalTraceLayerProps {
    selectedVehicleId: string | null;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function HistoricalTraceLayer({ selectedVehicleId }: HistoricalTraceLayerProps) {
    const map = useMap();
    const [tracePositions, setTracePositions] = useState<[number, number][]>([]);

    // SWR hook to fetch history when the ID changes
    const { data, error, isLoading } = useSWR<VehicleHistoryResponse>(
        selectedVehicleId ? `${API_BASE_URL}/vehicles/${selectedVehicleId}/history` : null,
        fetcher,
        {
            revalidateOnFocus: false,
            // History is static, no need for continuous polling
            refreshInterval: 0,
        }
    );

    useEffect(() => {
        if (data?.success && data.history.length > 0) {
            const positions: [number, number][] = data.history.map(p => [p.latitude, p.longitude]);
            setTracePositions(positions);
            
            // Pan the map to the last known position of the trace
            if (positions.length > 0) {
                map.panTo(positions[0]);
            }
        } else if (!selectedVehicleId) {
            setTracePositions([]);
        }
    }, [data, selectedVehicleId, map]);

    if (!selectedVehicleId || tracePositions.length === 0) {
        return null;
    }

    // React-Leaflet Polyline component renders the path
    return (
        <Polyline 
            positions={tracePositions} 
            color="#00ffff" // Cyan
            weight={4}
            opacity={0.7}
        >
            <Tooltip sticky>
                Historical Trace for Vehicle ID: {selectedVehicleId} ({tracePositions.length} points)
            </Tooltip>
        </Polyline>
    );
}
