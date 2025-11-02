# Vehicle Tracking Web Application - Docker Setup

This document explains how to run the complete vehicle tracking web application using Docker.

## 🐳 Docker Services Overview

The application consists of three main services:

1. **PostgreSQL Database** (`postgres`) - Stores vehicle and route data
2. **FastAPI Backend** (`web-app`) - REST API server 
3. **React Frontend** (`frontend`) - Web interface with Nginx

## 🚀 Quick Start

### **Option 1: Start All Services**
```bash
# Start all services at once
docker-compose up -d

# Check service status
docker ps
```

### **Option 2: Start Services Individually**
```bash
# Start database first
docker-compose up -d postgres

# Start backend API
docker-compose up -d web-app

# Start frontend (includes Nginx)
docker-compose up -d frontend
```

## 🌐 Access Points

Once all services are running:

- **Main Application**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **API Documentation**: http://localhost:5001/docs

## 📊 Service Details

### **Frontend Service (Port 3000)**
- **Technology**: React + TypeScript + Nginx
- **Features**: 
  - Dark themed map interface
  - Real-time vehicle tracking
  - Historical heatmap visualization
  - Interactive controls and filters
  - Responsive design
- **Health Check**: `curl http://localhost:3000`

### **Backend Service (Port 5001)**
- **Technology**: FastAPI + Python
- **Endpoints**:
  - `/health` - Health check
  - `/api/vehicles/current` - Current vehicle positions
  - `/api/vehicles/historical` - Historical data for heatmap
  - `/api/stats` - System statistics
  - `/api/routes` - Available routes
- **Health Check**: `curl http://localhost:5001/health`

### **Database Service (Port 5432)**
- **Technology**: PostgreSQL 15
- **Data**: 450 active vehicles, 115 routes
- **Connection**: `docker exec -it gtfs-postgres psql -U Iman -d rapid-bus-kl-realtime`

## 🧪 Testing the Application

### **Test Frontend**
```bash
# Check if frontend is serving
curl -s http://localhost:3000 | grep -o "<title>.*</title>"

# Expected: <title>React App</title>
```

### **Test API Through Frontend Proxy**
```bash
# Test health endpoint
curl http://localhost:3000/health

# Test vehicles API
curl http://localhost:3000/api/vehicles/current | jq '.success, .count'

# Test stats API
curl http://localhost:3000/api/stats | jq '.success, .stats.active_vehicles'

# Test historical data
curl "http://localhost:3000/api/vehicles/historical?start=2025-10-15T07:00:00Z&end=2025-10-15T08:00:00Z" | jq '.success, .count'
```

### **Expected Results**
- **Vehicles**: 450 active vehicles
- **Routes**: 115 available routes
- **Historical Data**: 374 positions (last hour sample)

## 🎨 Application Features

### **Real-time Vehicle Tracking**
- Live vehicle positions on interactive map
- Updates every 10 seconds
- Custom markers with popup details
- Vehicle clustering for dense areas

### **Historical Heatmap**
- Toggleable heatmap layer
- Time range selection (1h, 6h, 24h, 7d)
- Warm color gradients (red to yellow)
- Smooth transitions between views

### **Interactive Controls**
- System statistics display
- View toggles (real-time vs heatmap)
- Vehicle filtering (by route, status)
- Time range selector for heatmap
- Responsive design for all screen sizes

### **Design Features**
- Dark theme throughout
- Warm color gradients for density
- Clean, minimalist UI
- Bootstrap components
- Mobile-responsive layout

## 🔧 Management Commands

### **View Logs**
```bash
# View all service logs
docker-compose logs

# View specific service logs
docker-compose logs frontend
docker-compose logs web-app
docker-compose logs postgres
```

### **Stop Services**
```bash
# Stop all services
docker-compose down

# Stop specific service
docker-compose stop frontend
```

### **Restart Services**
```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart frontend
```

### **Update Services**
```bash
# Rebuild and restart
docker-compose up -d --build

# Rebuild specific service
docker-compose up -d --build frontend
```

## 🔍 Troubleshooting

### **Common Issues**

1. **Frontend not accessible**
   ```bash
   # Check container status
   docker ps | grep gtfs-frontend
   
   # Check logs
   docker-compose logs frontend
   ```

2. **API not responding**
   ```bash
   # Check backend container
   docker ps | grep gtfs-visualization
   
   # Test direct API access
   curl http://localhost:5001/health
   ```

3. **Database connection issues**
   ```bash
   # Check database container
   docker ps | grep gtfs-postgres
   
   # Test database connection
   docker exec gtfs-postgres psql -U Iman -d rapid-bus-kl-realtime -c "SELECT COUNT(*) FROM current_vehicle_positions;"
   ```

### **Port Conflicts**
If ports are already in use:
```bash
# Check what's using the ports
lsof -i :3000
lsof -i :5001
lsof -i :5432

# Stop conflicting services or modify docker-compose.yml ports
```

### **Performance Issues**
```bash
# Monitor resource usage
docker stats

# Check disk space
df -h
```

## 📱 Browser Testing

Open http://localhost:3000 in your browser and test:

1. **Map Loading**: Verify dark map loads with vehicle markers
2. **Real-time Updates**: Watch vehicles update every 10 seconds
3. **Heatmap Toggle**: Switch to historical heatmap view
4. **Time Range Selection**: Try different time periods
5. **Filters**: Filter vehicles by route and status
6. **Responsive Design**: Resize browser to test mobile layout
7. **Vehicle Popups**: Click on vehicles to see details

## 🎯 Success Indicators

✅ **All containers running**: `docker ps` shows 3 healthy containers  
✅ **Frontend accessible**: http://localhost:3000 loads the application  
✅ **API working**: All endpoints return data with success=true  
✅ **Real-time data**: 450 vehicles displayed on map  
✅ **Heatmap functional**: Historical data displays with color gradients  
✅ **Interactive controls**: All toggles and filters work properly  

The complete Docker setup provides a production-ready vehicle tracking application with all the requested features!