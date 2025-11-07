"""
FastAPI Backend    
"""
import json
import logging
from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timedelta, timezone 
from sqlalchemy import desc
import uvicorn
from typing import Optional, List

from pydantic import BaseModel, Field

from MyRapidTransitTracker.database.database import get_db, redis_client
from MyRapidTransitTracker.database.models import Vehicle, VehiclePosition, CurrentVehiclePosition, Route

logger = logging.getLogger(__name__)

TITLE = "Vehicle tracking API"
DESCRIPTION = "API for tracking vehicle position and routes"
VERSION = "0.0.1"

app = FastAPI(title=TITLE, description=DESCRIPTION, version=VERSION)

# Pydantic API schemas
# Base schemas
class RouteSchema(BaseModel):
    id: str

class VehicleBaseSchema(BaseModel):
    vehicle_id: str
    latitude: float
    longitude: float
    bearing: Optional[float] = None
    speed: Optional[float] = None
    trip_id: Optional[str] = None
    route_id: Optional[str] = None
    feed_timestamp: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class CurrentVehicleDetailSchema(VehicleBaseSchema):
    route: Optional[RouteSchema] = None

class VehicleHistoryPointSchema(BaseModel):
    latitude: float
    longitude: float
    bearing: Optional[float] = None
    speed: Optional[float] = None
    timestamp: Optional[datetime] = None

class HistoricalPositionSchema(BaseModel):
    vehicle_id: str
    latitude: float
    longitude: float
    recorded_at: datetime

class SuccessResponse(BaseModel):
    success: bool = True

# Top-level schemas
class CurrentVehiclesResponseSchema(SuccessResponse):
    count: int
    vehicles: List[CurrentVehicleDetailSchema]
    timestamp: datetime

class PaginatedVehicleResponseSchema(SuccessResponse):
    count: int
    vehicles: List[CurrentVehicleDetailSchema]

class RouteVehiclesResponseSchema(SuccessResponse):
    count: int
    vehicles: List[VehicleBaseSchema]
    
class VehicleHistoryResponseSchema(SuccessResponse):
    vehicle_id: str
    history: List[VehicleHistoryPointSchema]

class HistoricalPositionsResponseSchema(SuccessResponse):
    count: int
    positions: List[HistoricalPositionSchema]
    
class StatsSchema(BaseModel):
    total_vehicles: int
    active_vehicles: int
    total_routes: int
    last_updated: datetime

class StatsResponseSchema(SuccessResponse):
    stats: StatsSchema

class RoutesResponseSchema(SuccessResponse):
    routes: List[RouteSchema]

    
# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost",       # Base localhost
        "http://127.0.0.1",       # Base localhost IP
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """
    Basic health check    
    """
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.get("/api/vehicles/current", response_model=CurrentVehiclesResponseSchema)
async def get_current_vehicles(db: Session = Depends(get_db)):
    try:
        vehicles = db.query(CurrentVehiclePosition, Route).outerjoin(Route, CurrentVehiclePosition.route_id == Route.id).all()
        data = [
            CurrentVehicleDetailSchema(
                vehicle_id=pos.vehicle_id,
                latitude=pos.latitude,
                longitude=pos.longitude,
                bearing=pos.bearing,
                speed=pos.speed,
                route=RouteSchema(id=r.id) if r else None,
                trip_id=pos.trip_id,
                feed_timestamp=pos.feed_timestamp,
                updated_at=pos.updated_at
            ) for pos, r in vehicles
        ]
        return CurrentVehiclesResponseSchema(count=len(data), vehicles=data, timestamp=datetime.now(timezone.utc))
    except Exception as e:
        # raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        logger.exception(f"Fatal exception in /api/vehicles/current handler: {e}")
        raise


@app.get("/api/vehicles/{vehicle_id}/history", response_model=VehicleHistoryResponseSchema)
async def get_vehicle_history(vehicle_id: str, db: Session = Depends(get_db)):
    """
    Get historical positions for a specific vehicle (last hour and max 100 records)
    """
    try:
        vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
        if not vehicle:
            raise HTTPException(status_code=404, detail=f"Vehicle: {vehicle_id} not found")

        one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)

        positions = (
            db.query(VehiclePosition)
            .filter(
                VehiclePosition.vehicle_id == vehicle_id,
                VehiclePosition.recorded_at >= one_hour_ago
            )
            .order_by(desc(VehiclePosition.recorded_at))
            .limit(100)
            .all()
        )

        history = [
            VehicleHistoryPointSchema(
                latitude=p.latitude,
                longitude=p.longitude,
                bearing=p.bearing,
                speed=p.speed,
                timestamp=p.feed_timestamp
            ) for p in positions
        ]

        return VehicleHistoryResponseSchema(vehicle_id=vehicle_id, history=history)

    except Exception as e:
        # raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

        logger.exception(f"Fatal exception in /api/vehicles/{vehicle_id}/history : {e}")
        raise


@app.get("/api/routes", response_model=RoutesResponseSchema)
async def get_routes(db: Session = Depends(get_db)):
    """
    Get all available routes (Cached)
    """
    CACHE_KEY = "api:routes"
    TTL = 60 # seconds

    if redis_client:
        cached_data = redis_client.get(CACHE_KEY)
        if cached_data:
            return RoutesResponseSchema(**json.loads(cached_data))
    try:
        routes = db.query(Route).all()
        
        data = [{
            "id": r.id
        } for r in routes]

        response_data = RoutesResponseSchema(success=True, routes=data)

        if redis_client:
            redis_client.setex(CACHE_KEY, TTL, response_data.model_dump_json())

        return response_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")



@app.get("/api/stats", response_model=StatsResponseSchema)  
async def get_stats(db: Session = Depends(get_db)):
    """
    Get system stats (Cached for 10 seconds)
    """
    CACHE_KEY = "api:stats"
    TTL = 10 # seconds

    if redis_client:
        cached_data = redis_client.get(CACHE_KEY)
        if cached_data:
            return StatsResponseSchema(**json.loads(cached_data))

    try:
        total_vehicles = db.query(Vehicle).count()
        active_vehicles = db.query(CurrentVehiclePosition).count()  
        total_routes = db.query(Route).count()
        last_updated = datetime.now(timezone.utc)

        stats = StatsSchema(
            total_vehicles=total_vehicles,
            active_vehicles=active_vehicles,
            total_routes=total_routes,
            last_updated=last_updated
        )
        response_data = StatsResponseSchema(stats=stats)

        # Cache the successful response
        if redis_client:
            redis_client.setex(CACHE_KEY, TTL, response_data.model_dump_json())

        return response_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    
@app.get("/api/vehicles", response_model=PaginatedVehicleResponseSchema)  
async def get_all_vehicles(
    db: Session = Depends(get_db),
    limit: Optional[int] = 100,
    skip: Optional[int] = 0
):
    """
    Get all vehicles with pagination (alternative endpoint)
    """
    try:
        vehicles_data = (
            db.query(CurrentVehiclePosition, Route)
            .outerjoin(Route, CurrentVehiclePosition.route_id == Route.id)
            .offset(skip)
            .limit(limit)
            .all()
        )

        vehicles = [
            CurrentVehicleDetailSchema(
                vehicle_id=pos.vehicle_id,
                latitude=pos.latitude,
                longitude=pos.longitude,
                bearing=pos.bearing,
                speed=pos.speed,
                route=RouteSchema(id=r.id) if r else None,
                trip_id=pos.trip_id,
                feed_timestamp=pos.feed_timestamp,
                updated_at=pos.updated_at
            ) for pos, r in vehicles_data
        ]    

        return PaginatedVehicleResponseSchema(count=len(vehicles), vehicles=vehicles)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/routes/{route_id}/vehicles", response_model=RouteVehiclesResponseSchema)
async def get_vehicles_by_route(
    route_id: str, 
    db: Session = Depends(get_db), 
    limit: Optional[int] = 100, 
    skip: Optional[int] = 0
):
    """
    Get vehicles on a specific route
    """
    try:
        route = db.query(Route).filter(Route.id == route_id).first()
        if not route:
            raise HTTPException(status_code=404, detail="Route not found")

        vehicles_route_data = (
            db.query(CurrentVehiclePosition)
            .filter(CurrentVehiclePosition.route_id == route_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

        vehicles = [
            VehicleBaseSchema(
                vehicle_id=v.vehicle_id,
                latitude=v.latitude,
                longitude=v.longitude,
                bearing=v.bearing,
                speed=v.speed,
                trip_id=v.trip_id,
                route_id=v.route_id,
                feed_timestamp=v.feed_timestamp,
                updated_at=v.updated_at
            ) for v in vehicles_route_data
        ]

        return RouteVehiclesResponseSchema(count=len(vehicles), vehicles=vehicles)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/vehicles/historical", response_model=HistoricalPositionsResponseSchema)
async def get_historical_vehicles(
    start: datetime,
    end: datetime = None,
    db: Session = Depends(get_db)
):
    """
    Get historical vehicle positions for heatmap visualization
    """
    try:
        if end is None:
            end = datetime.now(timezone.utc)

        positions_data = db.query(VehiclePosition).filter(
            VehiclePosition.recorded_at >= start,
            VehiclePosition.recorded_at <= end
        ).all()

        positions = [
            HistoricalPositionSchema(
                vehicle_id=p.vehicle_id,
                latitude=p.latitude,
                longitude=p.longitude,
                recorded_at=p.recorded_at
            ) for p in positions_data
        ]

        return HistoricalPositionsResponseSchema(count=len(positions), positions=positions)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    
if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
