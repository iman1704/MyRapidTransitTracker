"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import Sidebar from "@/components/Sidebar";
import MapView from "@/components/MapView";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Vehicle } from "@/types/api";
import { isWebGLSupported } from "@/lib/webgl"; // Import our utility

// Define the structure for our application's filters
interface Filters {
  freshness: number; // in minutes
  selectedRouteIds: string[];
}

// Define the possible view modes
type ViewMode = "live" | "heatmap";

// A simple fetcher function for SWR
const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) {
    throw new Error(`API responded with status: ${res.status}`);
  }
  return res.json();
});

export default function Home() {
  // --- State Management ---
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    freshness: 30,
    selectedRouteIds: [],
  });
  const [viewMode, setViewMode] = useState<ViewMode>("live");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  
  // NEW: State to track WebGL support
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);

  // --- Global Data Fetching ---
  const { data, error, isLoading } = useSWR<{ vehicles: Vehicle[] }>(
    "/api/vehicles/current",
    fetcher,
    {
      refreshInterval: 10000,
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  const vehicles = data?.vehicles || [];

  // NEW: Check for WebGL support on component mount
  useEffect(() => {
    setWebglSupported(isWebGLSupported());
  }, []);

  // --- Render Logic ---
  return (
    <div className="flex h-screen bg-dark text-white">
      <Sidebar
        filters={filters}
        setFilters={setFilters}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className="flex-1 relative">
        {/* NEW: Show a message while checking for WebGL */}
        {webglSupported === null && <LoadingSpinner />}

        {/* NEW: Show an error if WebGL is not supported */}
        {webglSupported === false && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8 bg-darker rounded-lg max-w-md">
              <h2 className="text-xl font-semibold mb-2 text-red-400">WebGL Not Supported</h2>
              <p className="text-gray-400">
                Your browser or graphics hardware doesn't support WebGL, which is required to render the map.
              </p>
              <p className="text-sm text-gray-500 mt-4">
                Please try updating your browser or enabling hardware acceleration in your browser's settings.
              </p>
            </div>
          </div>
        )}

        {/* Only render MapView if WebGL is supported */}
        {webglSupported === true && (
          <>
            {isLoading && <LoadingSpinner />}
            
            {error && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-8 bg-darker rounded-lg">
                  <h2 className="text-xl font-semibold mb-2 text-red-400">Error Loading Data</h2>
                  <p className="text-gray-400">
                    Failed to fetch vehicle data. Please check if the backend server is running.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">{error.message}</p>
                </div>
              </div>
            )}

            {!isLoading && !error && (
              <MapView
                vehicles={vehicles}
                filters={filters}
                viewMode={viewMode}
                selectedVehicleId={selectedVehicleId}
                onVehicleSelect={setSelectedVehicleId}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
