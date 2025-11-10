from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer, String, Time, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

Base = declarative_base()


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(String(50), primary_key=True)
    license_plate = Column(String(20))
    last_seen = Column(DateTime)
    created_at = Column(DateTime, default=func.now())

    positions = relationship("VehiclePosition", back_populates="vehicle", cascade="all, delete-orphan")
    current_position = relationship("CurrentVehiclePosition", back_populates="vehicle", uselist=False, cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Vehicle(id='{self.id}')>"


class VehiclePosition(Base):
    __tablename__ = "vehicle_positions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vehicle_id = Column(String(50), ForeignKey("vehicles.id"), nullable=False, index=True)

    # Positional data
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    bearing = Column(Float)
    speed = Column(Float)

    # Trip
    trip_id = Column(String(100), ForeignKey("trips.trip_id"), index=True)
    route_id = Column(String(100), ForeignKey("routes.id"), index=True)

    # Timestamps
    feed_timestamp = Column(DateTime, nullable=False)
    recorded_at = Column(DateTime, default=func.now(), index=True)

    # Relationships
    vehicle = relationship("Vehicle", back_populates="positions")
    trip = relationship("Trip", back_populates="positions")
    route = relationship("Route", back_populates="positions")

    # Unique constraints
    __table_args__ = (UniqueConstraint("vehicle_id", "feed_timestamp", name="uq_vehicle_position_vehicle_ts"),)

    def __repr__(self) -> str:
        return f"<VehiclePosition(vehicle='{self.vehicle_id}', lat={self.latitude}, lon={self.longitude})>"


class CurrentVehiclePosition(Base):
    __tablename__ = "current_vehicle_positions"

    vehicle_id = Column(String(50), ForeignKey("vehicles.id"), primary_key=True)

    # Current position
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    bearing = Column(Float)
    speed = Column(Float)

    # Trip context 
    trip_id = Column(String(100), ForeignKey("trips.trip_id"), nullable=True)
    route_id = Column(String(100), ForeignKey("routes.id"), nullable=True)

    # Timestamps
    feed_timestamp = Column(DateTime(timezone=True))
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    vehicle = relationship("Vehicle", back_populates="current_position")
    route = relationship("Route")

    def __repr__(self) -> str:
        return f"<CurrentPosition(vehicle='{self.vehicle_id}')>"


class Trip(Base):
    __tablename__ = "trips"

    trip_id = Column(String(100), primary_key=True)
    route_id = Column(String(100), ForeignKey("routes.id"), nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    start_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=func.now())

    # Relationships
    route = relationship("Route", back_populates="trips")
    positions = relationship("VehiclePosition", back_populates="trip")

    def __repr__(self) -> str:
        return f"<Trip(trip_id:'{self.trip_id}', route:'{self.route_id}')>"


class Route(Base):
    __tablename__ = "routes"

    id = Column(String(100), primary_key=True)
    created_at = Column(DateTime, default=func.now())

    # Relationships
    trips = relationship("Trip", back_populates="route", cascade="all, delete-orphan")
    positions = relationship("VehiclePosition", back_populates="route")

    def __repr__(self) -> str:
        return f"<Route(id='{self.id}')>"
