# pip install gtfs-realtime-bindings pandas requests
import pandas as pd
from datetime import datetime, timezone
from google.protobuf.json_format import MessageToDict
from google.transit import gtfs_realtime_pb2
from requests import get

"""
Summary of data:
- timestamp
- trip.tripId
- trip.startTime
- trip.startDate
- trip.routeId
- position.latitude
- position.longitude
- position.bearing
- position.speed
- vehicle.id
- vehicle.licensePlate

"""

# Sample GTFS-R URL from Malaysia's Open API
# As of September 2025 the api only offers vehicle position data (trip updates and alerts are not yet available)
feed_type = "vehicle-position"
URL = f"https://api.data.gov.my/gtfs-realtime/{feed_type}/prasarana?category=rapid-bus-kl"

# Parse the GTFS Realtime feed
feed = gtfs_realtime_pb2.FeedMessage()
response = get(URL, headers=None, timeout=10)

feed.ParseFromString(response.content)

# Extract and print vehicle position information
vehicle_positions = [MessageToDict(entity.vehicle) for entity in feed.entity]
print(f"Total vehicles: {len(vehicle_positions)}")
df = pd.json_normalize(vehicle_positions)
print(datetime.now())
print(datetime.utcnow())
print(df.tail(10))
print(df.columns)
