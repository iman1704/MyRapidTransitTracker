"""
FastAPI Backend    
"""
from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timedelta
from sqlalchemy import desc
import uvicorn
from typing import Optional, List

from project_alpha.database.database import get_db
from project_alpha.database.models import Vehicle, VehiclePosition, CurrentVehiclePosition, Route

TITLE = "Vehicle tracking API"
DESCRIPTION = "API for tracking vehicle position and routes"
VERSION = "0.0.1"

app = FastAPI(title=TITLE, description=DESCRIPTION, version=VERSION)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Frontend development
        "http://127.0.0.1:3000",  # Alternative localhost
        "http://frontend:80",     # Docker network
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


@app.get("/api/vehicles/current")
async def get_current_vehicles(db: Session = Depends(get_db)):
    """
    Get all current vehicle positions with route information    
    """
    try:
        # Use proper join to get route data efficiently
        vehicles = (
            db.query(CurrentVehiclePosition, Route)
            .outerjoin(Route, CurrentVehiclePosition.route_id == Route.id)
            .all()
        )

        data = []
        for position, route in vehicles:
            vehicle_data = {
                "vehicle_id": position.vehicle_id,
                "latitude": position.latitude,
                "longitude": position.longitude,
                "bearing": position.bearing,
                "speed": position.speed,
                "route": {
                    "id": route.id if route else None
                } if route else None,
                "trip_id": position.trip_id,
                "last_update": position.feed_timestamp.isoformat() if position.feed_timestamp else None
            }
            data.append(vehicle_data)

        return JSONResponse({
            "success": True,
            "count": len(data),
            "vehicles": data,
            "timestamp": datetime.utcnow().isoformat()
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/vehicles/{vehicle_id}/history")
async def get_vehicle_history(vehicle_id: str, db: Session = Depends(get_db)):
    """
    Get historical positions for a specific vehicle (last hour and max 100 records)
    """
    try:
        vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
        if not vehicle:
            raise HTTPException(status_code=404, detail=f"Vehicle: {vehicle_id} not found")

        one_hour_ago = datetime.utcnow() - timedelta(hours=1)

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

        history = []
        for position in positions:  
            history.append({
                "latitude": position.latitude,
                "longitude": position.longitude,
                "bearing": position.bearing,
                "speed": position.speed,
                "timestamp": position.feed_timestamp.isoformat() if position.feed_timestamp else None
            })

        return JSONResponse({
            "success": True,
            "vehicle_id": vehicle_id,
            "history": history
        })

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/routes")
async def get_routes(db: Session = Depends(get_db)):
    """
    Get all available routes    
    """
    try:
        routes = db.query(Route).all()

        data = [{
            "id": r.id
        } for r in routes]

        return JSONResponse({
            "success": True,
            "routes": data
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/stats")  
async def get_stats(db: Session = Depends(get_db)):
    """
    Get system stats    
    """
    try:
        total_vehicles = db.query(Vehicle).count()
        active_vehicles = db.query(CurrentVehiclePosition).count()  
        total_routes = db.query(Route).count()

        return JSONResponse({
            "success": True,
            "stats": {
                "total_vehicles": total_vehicles,
                "active_vehicles": active_vehicles,  
                "total_routes": total_routes,
                "last_updated": datetime.utcnow().isoformat()
            }
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/vehicles")  
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

        result = []
        for position, route in vehicles_data:
            vehicle_data = {
                "vehicle_id": position.vehicle_id,
                "latitude": position.latitude,
                "longitude": position.longitude,
                "bearing": position.bearing,
                "speed": position.speed,
                "trip_id": position.trip_id,
                "route_id": position.route_id,
                "feed_timestamp": position.feed_timestamp.isoformat() if position.feed_timestamp else None,
                "updated_at": position.updated_at.isoformat() if position.updated_at else None,
            }
            
            # Add route object if found
            if route:
                vehicle_data["route"] = {
                    "id": route.id,
                }
            
            result.append(vehicle_data)

        return JSONResponse({
            "success": True,
            "count": len(result),
            "vehicles": result
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/routes/{route_id}/vehicles")
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

        vehicles = (
            db.query(CurrentVehiclePosition)
            .filter(CurrentVehiclePosition.route_id == route_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

        result = []
        for vehicle in vehicles:
            result.append({
                "vehicle_id": vehicle.vehicle_id,
                "latitude": vehicle.latitude,
                "longitude": vehicle.longitude,
                "bearing": vehicle.bearing,
                "speed": vehicle.speed,
                "trip_id": vehicle.trip_id,
                "route_id": vehicle.route_id,
                "feed_timestamp": vehicle.feed_timestamp.isoformat() if vehicle.feed_timestamp else None,
                "updated_at": vehicle.updated_at.isoformat() if vehicle.updated_at else None,
            })

        return JSONResponse({
            "success": True,
            "count": len(result),
            "vehicles": result
        })
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/vehicles/historical")
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
            end = datetime.utcnow()

        positions = db.query(VehiclePosition).filter(
            VehiclePosition.recorded_at >= start,
            VehiclePosition.recorded_at <= end
        ).all()

        data = []
        for position in positions:
            data.append({
                "vehicle_id": position.vehicle_id,
                "latitude": position.latitude,
                "longitude": position.longitude,
                "recorded_at": position.recorded_at.isoformat()
            })

        return JSONResponse({
            "success": True,
            "count": len(data),
            "positions": data
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    
if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
