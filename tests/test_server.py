
import requests
import time

def test_api_server():
    base_url = "http://localhost:5001"
    
    try:
        # Test health check
        response = requests.get(f"{base_url}/health")
        print(f"Health check: {response.status_code} - {response.json()}")
        
        # Test root endpoint
        response = requests.get(f"{base_url}/")
        print(f"Root endpoint: {response.status_code} - {response.json()}")
        
        # Test vehicles endpoint
        response = requests.get(f"{base_url}/api/vehicles")
        print(f"Vehicles endpoint: {response.status_code}")
        
        # Test routes endpoint
        response = requests.get(f"{base_url}/api/routes")
        print(f"Routes endpoint: {response.status_code}")
        
        print("✅ All basic endpoint tests passed!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Make sure it's running on localhost:8000")
    except Exception as e:
        print(f"❌ Error during testing: {e}")

if __name__ == "__main__":
    test_api_server()
