import React, { useState } from 'react';
import { 
  Button, 
  Form, 
  ToggleButton, 
  ToggleButtonGroup, 
  Badge,
  Card,
  Accordion
} from 'react-bootstrap';
import { TimeRange, FilterOptions, Route, LastUpdatedRange } from '../types';
import { convertToKualaLumpurTimeOnly } from '../utils/time';

interface ControlPanelProps {
  onTimeRangeChange: (timeRange: TimeRange) => void;
  onFilterChange: (filters: FilterOptions) => void;
  onToggleHeatmap: (show: boolean) => void;
  onToggleRealTime: (show: boolean) => void;
  showHeatmap: boolean;
  showRealTime: boolean;
  currentTimeRange: TimeRange;
  routes: Route[];
  stats: {
    total_vehicles: number;
    active_vehicles: number;
    total_routes: number;
    last_updated: string;
  };
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  onTimeRangeChange,
  onFilterChange,
  onToggleHeatmap,
  onToggleRealTime,
  showHeatmap,
  showRealTime,
  currentTimeRange,
  routes,
  stats
}) => {
  const [filters, setFilters] = useState<FilterOptions>({
    vehicleTypes: [],
    routes: [],
    lastUpdated: 'all',
    customLastUpdatedMinutes: 60
  });

  const handleTimeRangeChange = (value: TimeRange) => {
    onTimeRangeChange(value);
  };

  const handleLastUpdatedChange = (value: string) => {
    // Validate that the value is one of the valid LastUpdatedRange values
    const validValues: LastUpdatedRange[] = ['5m', '30m', '1h', '3h', '6h', '12h', '24h', 'custom', 'all'];
    if (validValues.includes(value as LastUpdatedRange)) {
      const typedValue = value as LastUpdatedRange;
      const newFilters = { 
        ...filters, 
        lastUpdated: typedValue,
        // Reset custom minutes when switching away from custom
        ...(typedValue !== 'custom' && { customLastUpdatedMinutes: undefined })
      };
      setFilters(newFilters);
      onFilterChange(newFilters);
    }
  }

  const handleCustomDurationChange = (minutes: number) => {
    const newFilters: FilterOptions = { 
      ...filters, 
      lastUpdated: 'custom' as LastUpdatedRange, // Explicitly type the string literal
      customLastUpdatedMinutes: Math.max(1, minutes) // Ensure at least 1 minute
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  }

  const currentCustomMinutes = filters.lastUpdated === 'custom' 
    ? filters.customLastUpdatedMinutes || 60
    : 60;

  const handleRouteFilterChange = (selectedRoutes: string[]) => {
    const newFilters = { ...filters, routes: selectedRoutes };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters: FilterOptions = { 
      vehicleTypes: [], 
      routes: [], 
      lastUpdated: 'all',
      customLastUpdatedMinutes: 60
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const hasActiveFilters = filters.routes.length > 0 || filters.lastUpdated !== 'all';

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      minWidth: '320px',
      maxWidth: '400px'
    }}>
      <Card className="bg-dark text-white border-secondary">
        <Card.Header className="bg-secondary border-secondary">
          <h5 className="mb-0">Vehicle Tracking Controls</h5>
        </Card.Header>
        <Card.Body className="p-3">
          {/* Stats Section */}
          <div className="mb-4">
            <h6 className="text-warning mb-3">System Statistics</h6>
            <div className="d-flex justify-content-between mb-2">
              <span>Active Vehicles:</span>
              <Badge bg="success">{stats.active_vehicles}</Badge>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span>Total Routes:</span>
              <Badge bg="info">{stats.total_routes}</Badge>
            </div>
            <div className="d-flex justify-content-between">
              <span>Last Updated:</span>
              <small className="text-muted">
                {convertToKualaLumpurTimeOnly(stats.last_updated)}
              </small>
            </div>
          </div>

          {/* View Toggle */}
          <Accordion className="mb-3">
            <Accordion.Item eventKey="0" className="bg-dark border-secondary">
              <Accordion.Header className="bg-dark text-white">
                View Options
              </Accordion.Header>
              <Accordion.Body className="bg-dark">
                <div className="mb-3">
                  <Form.Label className="text-warning">Display Mode</Form.Label>
                  <div className="d-grid gap-2">
                    <ToggleButtonGroup
                      type="checkbox"
                      value={[showRealTime ? 'realtime' : null, showHeatmap ? 'heatmap' : null].filter(Boolean)}
                      onChange={(value) => {
                        const newShowRealTime = value.includes('realtime');
                        const newShowHeatmap = value.includes('heatmap');
                        onToggleRealTime(newShowRealTime);
                        onToggleHeatmap(newShowHeatmap);
                      }}
                    >
                      <ToggleButton
                        id="toggle-realtime"
                        value="realtime"
                        variant={showRealTime ? "success" : "outline-success"}
                        size="sm"
                      >
                        Real-time Vehicles
                      </ToggleButton>
                      <ToggleButton
                        id="toggle-heatmap"
                        value="heatmap"
                        variant={showHeatmap ? "warning" : "outline-warning"}
                        size="sm"
                      >
                        Historical Heatmap
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </div>
                </div>

                {showHeatmap && (
                  <div className="mb-3">
                    <Form.Label className="text-warning">Time Range</Form.Label>
                    <ToggleButtonGroup
                      type="radio"
                      name="timeRange"
                      value={currentTimeRange}
                      onChange={handleTimeRangeChange}
                      className="w-100"
                    >
                      <ToggleButton
                        id="range-1h"
                        value="1h"
                        variant="outline-primary"
                        size="sm"
                        className="flex-fill"
                      >
                        1 Hour
                      </ToggleButton>
                      <ToggleButton
                        id="range-6h"
                        value="6h"
                        variant="outline-primary"
                        size="sm"
                        className="flex-fill"
                      >
                        6 Hours
                      </ToggleButton>
                      <ToggleButton
                        id="range-24h"
                        value="24h"
                        variant="outline-primary"
                        size="sm"
                        className="flex-fill"
                      >
                        24 Hours
                      </ToggleButton>
                      <ToggleButton
                        id="range-7d"
                        value="7d"
                        variant="outline-primary"
                        size="sm"
                        className="flex-fill"
                      >
                        7 Days
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </div>
                )}
              </Accordion.Body>
            </Accordion.Item>

            {/* Filters */}
            <Accordion.Item eventKey="1" className="bg-dark border-secondary">
              <Accordion.Header className="bg-dark text-white">
                Filters {hasActiveFilters && <Badge bg="warning" className="ms-2">Active</Badge>}
              </Accordion.Header>
              <Accordion.Body className="bg-dark">


                {/* Last Updated Filter */}
                <div className="mb-3">
                  <Form.Label className="text-warning">Last Updated</Form.Label>
                  <ToggleButtonGroup
                    type="radio"
                    name="lastUpdated"
                    value={filters.lastUpdated}
                    onChange={handleLastUpdatedChange}
                    className="w-100"
                  >
                    <ToggleButton
                      id="last-updated-5m"
                      value="5m"
                      variant="outline-primary"
                      size="sm"
                      className="flex-fill"
                    >
                      5 Min
                    </ToggleButton>
                    <ToggleButton
                      id="last-updated-30m"
                      value="30m"
                      variant="outline-primary"
                      size="sm"
                      className="flex-fill"
                    >
                      30 Min
                    </ToggleButton>
                    <ToggleButton
                      id="last-updated-1h"
                      value="1h"
                      variant="outline-primary"
                      size="sm"
                      className="flex-fill"
                    >
                      1 Hr
                    </ToggleButton>
                    <ToggleButton
                      id="last-updated-3h"
                      value="3h"
                      variant="outline-primary"
                      size="sm"
                      className="flex-fill"
                    >
                      3 Hr
                    </ToggleButton>
                    <ToggleButton
                      id="last-updated-6h"
                      value="6h"
                      variant="outline-primary"
                      size="sm"
                      className="flex-fill"
                    >
                      6 Hr
                    </ToggleButton>
                    <ToggleButton
                      id="last-updated-12h"
                      value="12h"
                      variant="outline-primary"
                      size="sm"
                      className="flex-fill"
                    >
                      12 Hr
                    </ToggleButton>
                    <ToggleButton
                      id="last-updated-24h"
                      value="24h"
                      variant="outline-primary"
                      size="sm"
                      className="flex-fill"
                    >
                      24 Hr
                    </ToggleButton>
                    <ToggleButton
                      id="last-updated-all"
                      value="all"
                      variant="outline-primary"
                      size="sm"
                      className="flex-fill"
                    >
                      All
                    </ToggleButton>
                  </ToggleButtonGroup>
                </div>

                {/* Custom Duration Filter */}
                {filters.lastUpdated === 'custom' && (
                  <div className="mb-3">
                    <Form.Label className="text-warning">Custom Duration (minutes)</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      max="1440"  // 24 hours in minutes
                      value={currentCustomMinutes}
                      onChange={(e) => handleCustomDurationChange(parseInt(e.target.value) || 1)}
                      className="bg-dark text-white border-secondary"
                    />
                    <Form.Text className="text-muted">
                      Vehicles updated within the last {currentCustomMinutes} minutes
                    </Form.Text>
                  </div>
                )}

                {/* Route Filter */}
                <div className="mb-3">
                  <Form.Label className="text-warning">Routes</Form.Label>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {routes.slice(0, 10).map((route) => (
                      <Form.Check
                        key={route.id}
                        type="checkbox"
                        id={`route-${route.id}`}
                        label={route.id}
                        checked={filters.routes.includes(route.id)}
                        onChange={(e) => {
                          const newRoutes = e.target.checked
                            ? [...filters.routes, route.id]
                            : filters.routes.filter(r => r !== route.id);
                          handleRouteFilterChange(newRoutes);
                        }}
                        className="text-white mb-2"
                      />
                    ))}
                  </div>
                </div>

                {hasActiveFilters && (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={clearFilters}
                    className="w-100"
                  >
                    Clear All Filters
                  </Button>
                )}
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>

          {/* Legend */}
          <div className="mt-3">
            <h6 className="text-warning mb-2">Legend</h6>
            <div className="d-flex align-items-center mb-2">
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ff6b6b, #ffd93d)',
                  border: '2px solid #fff',
                  marginRight: '8px'
                }}
              />
              <small>Vehicle</small>
            </div>
            <div className="d-flex align-items-center mb-2">
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ff3838, #ffaa00)',
                  border: '3px solid #fff',
                  marginRight: '8px'
                }}
              />
              <small>Selected Vehicle</small>
            </div>
            {showHeatmap && (
              <div className="mt-2">
                <small className="text-warning">Heatmap Density:</small>
                <div className="d-flex align-items-center mt-1">
                  <div style={{ 
                    width: '60px', 
                    height: '10px', 
                    background: 'linear-gradient(to right, #ffd93d, #ff9f40, #ff6b6b, #ff3838)',
                    marginRight: '8px'
                  }} />
                  <small>Low → High</small>
                </div>
              </div>
            )}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ControlPanel;