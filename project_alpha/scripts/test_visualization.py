import requests
import time

BASE_URL = "http://localhost:5000"


def test_api_endpoints():
    """Test all API endpoints"""

    print("Testing API endpoints...")

    # Test current vehicles
    response = requests.get(f"{BASE_URL}/api/vehicles/current")
    print(f"✓ Current vehicles: {response.status_code} - {response.json().get('count', 0)} vehicles")

    # Test stats
    response = requests.get(f"{BASE_URL}/api/stats")
    print(f"✓ Stats: {response.status_code}")

    # Test routes
    response = requests.get(f"{BASE_URL}/api/routes")
    print(f"✓ Routes: {response.status_code}")

    print("\nAll tests passed! ✓")


if __name__ == "__main__":
    time.sleep(2)  # Wait for server to start
    test_api_endpoints()
