# Database Schema Overview

This document provides a detailed overview of the database schema used in this project. The schema is designed to ingest and store real-time public transit vehicle data, maintain a history of vehicle movements, and associate this data with specific routes and trips.

## Tables

The database consists of five main tables:

1.  [`vehicles`](#vehicles)
2.  [`vehicle_positions`](#vehicle_positions)
3.  [`current_vehicle_positions`](#current_vehicle_positions)
4.  [`trips`](#trips)
5.  [`routes`](#routes)

---

### `vehicles`

This table acts as the master list for all vehicles in the system.

*   **Purpose**: To store unique information about each vehicle.
*   **Columns**:
    *   `id` (String, **Primary Key**): A unique identifier for the vehicle (e.g., a vehicle number or VIN).
    *   `license_plate` (String): The vehicle's license plate number.
    *   `last_seen` (DateTime): A timestamp indicating the last time any data was received for this vehicle. This is useful for knowing if a vehicle's data feed has gone stale.
    *   `created_at` (DateTime): A timestamp for when the vehicle was first registered in the database.
*   **Relationships**:
    *   It has a one-to-many relationship with `vehicle_positions`, meaning one vehicle can have many historical position records.
    *   It has a one-to-one relationship with `current_vehicle_positions`, meaning each vehicle has only one "current" position entry.

---

### `vehicle_positions`

This table is the historical log of all vehicle movements. Every time a new position is received from a vehicle, a new row is added here.

*   **Purpose**: To store a complete history of vehicle locations and states over time.
*   **Columns**:
    *   `id` (Integer, **Primary Key**): A unique ID for each individual position record.
    *   `vehicle_id` (String, **Foreign Key** to `vehicles.id`): Links this position record to a specific vehicle.
    *   `latitude`, `longitude` (Float): The geographical coordinates of the vehicle.
    *   `bearing` (Float): The direction the vehicle is traveling, in degrees.
    *   `speed` (Float): The vehicle's speed, likely in meters/second or km/hour.
    *   `trip_id` (String, **Foreign Key** to `trips.trip_id`): The ID of the trip the vehicle is currently on.
    *   `route_id` (String, **Foreign Key** to `routes.id`): The ID of the route the vehicle is currently on.
    *   `stop_id` (String): The ID of the stop the vehicle is either at or heading towards.
    *   `current_status` (String): The operational status of the vehicle (e.g., `IN_TRANSIT_TO`, `STOPPED_AT`).
    *   `feed_timestamp` (DateTime): The timestamp from the original data feed, indicating when the position was captured.
    *   `recorded_at` (DateTime): The timestamp of when this record was saved to the database.
*   **Constraints**:
    *   A unique constraint on `(vehicle_id, feed_timestamp)` prevents duplicate position entries for the same vehicle at the same time.

---

### `current_vehicle_positions`

This table is an optimization. It holds only the single, most recent position for every vehicle, making it very fast to query the current state of the fleet.

*   **Purpose**: To provide quick access to the last known position and status of every vehicle.
*   **Columns**:
    *   `vehicle_id` (String, **Primary Key**, **Foreign Key** to `vehicles.id`): Uniquely identifies the record and links it directly to a vehicle.
    *   It contains the same position, trip, and status fields as `vehicle_positions`.
    *   `updated_at` (DateTime): A timestamp that automatically updates whenever the row is modified, effectively tracking when the last update was received.

---

### `trips`

This table defines the scheduled journeys that vehicles undertake.

*   **Purpose**: To store information about scheduled trips.
*   **Columns**:
    *   `trip_id` (String, **Primary Key**): The unique identifier for a specific trip.
    *   `route_id` (String, **Foreign Key** to `routes.id`): The route that this trip follows.
    *   `start_time` (Time): The scheduled start time of the trip (e.g., 08:30:00).
    *   `start_date` (Date): The scheduled start date of the trip.
    *   `created_at` (DateTime): A timestamp for when the trip was first added to the database.
*   **Relationships**:
    *   It has a many-to-one relationship with `routes`, as many trips can belong to one route.

---

### `routes`

This table is the master list of all available transit routes.

*   **Purpose**: To store descriptive information about each transit route.
*   **Columns**:
    *   `id` (String, **Primary Key**): The unique identifier for the route.
    *   `short_name` (String): A short, public-facing name for the route (e.g., "1A", "MAX").
    *   `long_name` (String): A more descriptive name for the route (e.g., "Main Street / City Center").
    *   `created_at` (DateTime): A timestamp for when the route was first added to the database.
*   **Relationships**:
    *   It has a one-to-many relationship with `trips`, as a single route can have many scheduled trips throughout the day.
