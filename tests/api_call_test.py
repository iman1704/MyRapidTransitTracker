
#!/usr/bin/env python3
"""
Template script to call a FastAPI endpoint running in docker-compose
and save the response to a JSON file.
"""

import requests
import json
import argparse
import sys
from typing import Dict, Any, Optional
from pathlib import Path


def call_fastapi_endpoint(
    host: str = "localhost",
    port: int = 8000,
    endpoint: str = "/",
    method: str = "GET",
    params: Optional[Dict[str, Any]] = None,
    data: Optional[Dict[str, Any]] = None,
    headers: Optional[Dict[str, str]] = None,
    auth: Optional[tuple] = None,
    timeout: int = 30,
) -> Dict[str, Any]:
    """
    Call a FastAPI endpoint and return the response.
    
    Args:
        host: Hostname where the FastAPI service is running
        port: Port number of the FastAPI service
        endpoint: API endpoint path (e.g., "/items/1")
        method: HTTP method (GET, POST, PUT, DELETE, etc.)
        params: Query parameters
        data: Request body data (for POST, PUT, etc.)
        headers: Request headers
        auth: Authentication tuple (username, password)
        timeout: Request timeout in seconds
    
    Returns:
        Dictionary containing the response data
    
    Raises:
        requests.exceptions.RequestException: If the request fails
    """
    url = f"http://{host}:{port}{endpoint}"
    
    try:
        response = requests.request(
            method=method.upper(),
            url=url,
            params=params,
            json=data,
            headers=headers,
            auth=auth,
            timeout=timeout,
        )
        
        # Raise an exception for bad status codes
        response.raise_for_status()
        
        # Try to parse JSON response
        try:
            return response.json()
        except json.JSONDecodeError:
            return {"response": response.text}
    
    except requests.exceptions.RequestException as e:
        print(f"Error calling API: {e}")
        raise


def save_response_to_file(response_data: Dict[str, Any], output_file: str) -> None:
    """
    Save response data to a JSON file.
    
    Args:
        response_data: The response data to save
        output_file: Path to the output file
    """
    try:
        with open(output_file, "w") as f:
            json.dump(response_data, f, indent=2)
        print(f"Response saved to {output_file}")
    except IOError as e:
        print(f"Error saving response to file: {e}")
        raise


def main():
    # Set up command line arguments
    parser = argparse.ArgumentParser(description="Call FastAPI endpoint and save response")
    parser.add_argument("--host", default="localhost", help="Host where FastAPI is running")
    parser.add_argument("--port", type=int, default=8000, help="Port of FastAPI service")
    parser.add_argument("--endpoint", default="/", help="API endpoint path")
    parser.add_argument("--method", default="GET", help="HTTP method")
    parser.add_argument("--params", help="Query parameters as JSON string")
    parser.add_argument("--data", help="Request body data as JSON string")
    parser.add_argument("--headers", help="Request headers as JSON string")
    parser.add_argument("--auth", help="Authentication as 'username:password'")
    parser.add_argument("--output", default="response.json", help="Output file path")
    parser.add_argument("--timeout", type=int, default=30, help="Request timeout in seconds")
    
    args = parser.parse_args()
    
    # Parse JSON strings for params, data, headers
    params = json.loads(args.params) if args.params else None
    data = json.loads(args.data) if args.data else None
    headers = json.loads(args.headers) if args.headers else None
    
    # Parse authentication
    auth = None
    if args.auth:
        try:
            username, password = args.auth.split(":", 1)
            auth = (username, password)
        except ValueError:
            print("Authentication should be in format 'username:password'")
            sys.exit(1)
    
    try:
        # Call the API endpoint
        print(f"Calling {args.method} http://{args.host}:{args.port}{args.endpoint}")
        response_data = call_fastapi_endpoint(
            host=args.host,
            port=args.port,
            endpoint=args.endpoint,
            method=args.method,
            params=params,
            data=data,
            headers=headers,
            auth=auth,
            timeout=args.timeout,
        )
        
        # Save response to file
        save_response_to_file(response_data, args.output)
        
        print("API call completed successfully")
    
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
