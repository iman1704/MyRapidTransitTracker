#!/usr/bin/env python3
"""
Test script to verify the API endpoints for the vehicle tracking application
Updated for FastAPI backend and new frontend features
Modified to show sample responses from each test
"""
import asyncio
import json
from datetime import datetime, timedelta # Added for historical data test
from http import HTTPStatus

import httpx


async def test_api_endpoints():
    """Test all API endpoints"""
    # According to docker-compose.yml, host port 5001 maps to container port 8000
    base_url = "http://localhost:5001" 
    
    print(f"Testing FastAPI endpoints at {base_url}...\n")
    
    # Test /api/stats endpoint
    print("1. Testing /api/stats endpoint...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{base_url}/api/stats")
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"   Sample response: {json.dumps(data, indent=4)}")
                if data.get('success'):
                    stats = data.get('stats', {})
                    print(f"   Active vehicles: {stats.get('active_vehicles', 'N/A')}")
                    print(f"   Total routes: {stats.get('total_routes', 'N/A')}")
                    print(f"   Total vehicles: {stats.get('total_vehicles', 'N/A')}")
                    print("   ✅ Success")
                else:
                    print(f"   ❌ API returned success: false")
                    print(f"   Error: {data.get('error', 'Unknown error')}")
            else:
                print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Connection Error: {str(e)}")
    
    print()
    
    # Test /api/vehicles/current endpoint
    print("2. Testing /api/vehicles/current endpoint (includes route info)...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{base_url}/api/vehicles/current")
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    vehicles = data.get('vehicles', [])
                    count = data.get('count', 0)
                    print(f"   Number of vehicles returned: {count}")
                    print(f"   Timestamp: {data.get('timestamp', 'N/A')}")
                    if vehicles:
                        print(f"   Sample vehicle: {json.dumps(vehicles[0], indent=4)}")
                    print("   ✅ Success")
                else:
                    print(f"   ❌ API returned success: false")
                    print(f"   Error: {data.get('error', 'Unknown error')}")
            else:
                print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Connection Error: {str(e)}")
    
    print()
    
    # Test /api/vehicles endpoint (with pagination)
    print("3. Testing /api/vehicles endpoint (with pagination)...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{base_url}/api/vehicles", params={"limit": 5})
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    vehicles = data.get('vehicles', [])
                    count = len(vehicles)
                    print(f"   Number of vehicles returned (limit=5): {count}")
                    if vehicles:
                        print(f"   Sample vehicle: {json.dumps(vehicles[0], indent=4)}")
                    print("   ✅ Success")
                else:
                    print(f"   ❌ API returned success: false")
                    print(f"   Error: {data.get('error', 'Unknown error')}")
            else:
                print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Connection Error: {str(e)}")
    
    print()
    
    # Test /api/routes endpoint
    print("4. Testing /api/routes endpoint...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{base_url}/api/routes")
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    routes = data.get('routes', [])
                    print(f"   Number of routes returned: {len(routes)}")
                    if routes:
                        print(f"   Sample route: {json.dumps(routes[0], indent=4)}")
                    print("   ✅ Success")
                else:
                    print(f"   ❌ API returned success: false")
                    print(f"   Error: {data.get('error', 'Unknown error')}")
            else:
                print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Connection Error: {str(e)}")
    
    print()
    
    # Test /health endpoint
    print("5. Testing /health endpoint...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{base_url}/health")
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"   Sample response: {json.dumps(data, indent=4)}")
                print("   ✅ Success")
            else:
                print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Connection Error: {str(e)}")
    
    print()
    
    # Variables for dynamic testing
    test_vehicle_id = None
    test_route_id = None

    # Get data for dynamic tests
    try:
        async with httpx.AsyncClient() as client:
            # Get a vehicle
            v_resp = await client.get(f"{base_url}/api/vehicles/current")
            if v_resp.status_code == 200:
                v_data = v_resp.json()
                if v_data.get('vehicles'):
                    test_vehicle_id = v_data['vehicles'][0]['vehicle_id']
            
            # Get a route
            r_resp = await client.get(f"{base_url}/api/routes")
            if r_resp.status_code == 200:
                r_data = r_resp.json()
                if r_data.get('routes'):
                    test_route_id = r_data['routes'][0]['id']
    except Exception:
        pass

    # Test vehicle history endpoint
    print("6. Testing individual vehicle history endpoint...")
    if test_vehicle_id:
        try:
            async with httpx.AsyncClient() as client:
                print(f"   Testing history for vehicle: {test_vehicle_id}")
                response = await client.get(f"{base_url}/api/vehicles/{test_vehicle_id}/history")
                print(f"   Status: {response.status_code}")
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success'):
                        history = data.get('history', [])
                        print(f"   History entries returned (max 100): {len(history)}")
                        if history:
                            print(f"   Sample history entry: {json.dumps(history[0], indent=4)}")
                        print("   ✅ Success")
                    else:
                        print(f"   ❌ API returned success: false: {data.get('error')}")
                else:
                    print(f"   ❌ Error: {response.text}")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
    else:
        print("   ⚠️ Skipping: No vehicles available to test history endpoint")
    
    print()
    
    # Test routes vehicles endpoint
    print("7. Testing route vehicles endpoint...")
    if test_route_id:
        try:
            async with httpx.AsyncClient() as client:
                print(f"   Testing vehicles for route: {test_route_id}")
                response = await client.get(f"{base_url}/api/routes/{test_route_id}/vehicles")
                print(f"   Status: {response.status_code}")
                if response.status_code == 200:
                    data = response.json()
                    vehicles = data.get('vehicles', [])
                    count = data.get('count', 0)
                    print(f"   Vehicles on route: {count}")
                    if vehicles:
                        print(f"   Sample vehicle on route: {json.dumps(vehicles[0], indent=4)}")
                    print("   ✅ Success")
                else:
                    print(f"   ❌ Error: {response.text}")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
    else:
        print("   ⚠️ Skipping: No routes available to test route vehicles endpoint")

    print()

    # Test /api/vehicles/historical endpoint (NEW)
    print("8. Testing /api/vehicles/historical endpoint (for heatmap)...")
    try:
        async with httpx.AsyncClient() as client:
            # Calculate time range (last 1 hour)
            end_time = datetime.utcnow()
            start_time = end_time - timedelta(hours=1)

            params = {
                "start": start_time.isoformat(),
                "end": end_time.isoformat()
            }

            print(f"   Requesting data from {params['start']} to {params['end']}")
            response = await client.get(f"{base_url}/api/vehicles/historical", params=params)
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    count = data.get('count', 0)
                    print(f"   Number of historical positions returned: {count}")
                    if count > 0:
                        # Show a sample of the historical data
                        history = data.get('history', [])
                        if history:
                            print(f"   Sample historical position: {json.dumps(history[0], indent=4)}")
                    print("   ✅ Success")
                else:
                    print(f"   ❌ API returned success: false")
                    print(f"   Error: {data.get('error', 'Unknown error')}")
            else:
                print(f"   ❌ Error details: {response.text}")
    except Exception as e:
        print(f"   ❌ Connection Error: {str(e)}")


if __name__ == "__main__":
    print("=========================================")
    print("  FastAPI Endpoint Testing Script")
    print("=========================================")
    try:
        asyncio.run(test_api_endpoints())
    except KeyboardInterrupt:
        print("\nTest interrupted by user.")
    except Exception as e:
        print(f"\nTest script failed: {e}")
    print("\n=========================================")
    print("  Test sequence completed.")
    print("=========================================")
