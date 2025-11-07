# Vehicle Tracking Web Application - Docker Setup

This document explains how to run the complete vehicle tracking web application using Docker.

## 🐳 Docker Services Overview

The application consists of three main services:

1. **PostgreSQL Database** (`postgres`) - Stores vehicle and route data
2. **FastAPI Backend** (`web-app`) - REST API server 

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
```

## 🌐 Access Points

Once all services are running:

- **Backend API**: http://localhost:5001
- **API Documentation**: http://localhost:5001/docs

## 📊 Service Details

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

docker-compose logs web-app
docker-compose logs postgres
```

### **Stop Services**
```bash
# Stop all services
docker-compose down
```

### **Restart Services**
```bash
# Restart all services
docker-compose restart
```

### **Update Services**
```bash
# Rebuild and restart
docker-compose up -d --build
```

## 🔍 Troubleshooting

### **Common Issues**

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

## 🎯 Success Indicators

✅ **All containers running**: `docker ps` shows 3 healthy containers  
✅ **API working**: All endpoints return data with success=true  
✅ **Real-time data**: 450 vehicles displayed on map  
✅ **Heatmap functional**: Historical data displays with color gradients  
✅ **Interactive controls**: All toggles and filters work properly  

The complete Docker setup provides a production-ready vehicle tracking application with all the requested features!
