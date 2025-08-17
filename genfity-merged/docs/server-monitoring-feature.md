# Server Monitoring Feature Documentation

## Overview
A comprehensive real-time server monitoring feature has been implemented to track DigitalOcean droplet performance metrics including CPU, memory, and disk usage.

## Features Implemented

### 1. Real-time Charts
- **Chart.js Integration**: Interactive line charts using Chart.js and react-chartjs-2
- **Live Data**: Charts update automatically every 30 seconds when auto-refresh is enabled
- **Responsive Design**: Charts adapt to different screen sizes
- **Time-based X-axis**: Uses time scale for accurate temporal data representation

### 2. Time Period Selection
- **1 Hour**: Last hour of metrics
- **1 Day**: Last 24 hours of metrics  
- **1 Week**: Last 7 days of metrics
- **1 Month**: Last 30 days of metrics

### 3. Auto-refresh Functionality
- **Toggle Control**: Users can enable/disable auto-refresh
- **30-second Intervals**: Automatic metric updates every 30 seconds
- **Visual Indicators**: Animated pulse indicators show active auto-refresh status

### 4. Three Metric Types
- **CPU Usage**: Real-time CPU utilization percentage
- **Memory Usage**: RAM utilization percentage
- **Disk Usage**: Storage utilization percentage

### 5. Enhanced UI/UX
- **Modern Design**: Clean, professional dashboard interface
- **Status Indicators**: Visual server status with color-coded badges
- **Loading States**: Smooth loading animations during data fetching
- **Error Handling**: Graceful fallback to mock data when API is unavailable

## Technical Implementation

### API Endpoints
- **GET /api/servers**: Fetch server list from DigitalOcean
- **POST /api/servers**: Update server data from DigitalOcean API
- **GET /api/servers/[id]/metrics**: Fetch specific metric data with time range support

### Database Schema
```prisma
model Server {
  id                  String   @id @default(cuid())
  dropletId          String   @unique
  name               String
  memory             Int
  vcpus              Int
  disk               Int
  status             String
  region             String
  regionSlug         String
  sizeSlug           String
  publicIp           String?
  privateIp          String?
  priceMonthly       Float
  priceHourly        Float
  tags               String[]
  features           String[]
  imageDistribution  String?
  imageName          String?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}
```

### Key Components
- **Server List**: Interactive grid of server cards with key metrics
- **Time Period Selector**: Dropdown for selecting monitoring timeframe
- **Auto-refresh Toggle**: Button to enable/disable automatic updates
- **Metric Charts**: Three separate charts for CPU, memory, and disk usage
- **Server Details**: Comprehensive server information display

### Mock Data Integration
When DigitalOcean API is unavailable, the system generates realistic mock data:
- **CPU**: 5-80% random values
- **Memory**: 20-90% random values  
- **Disk**: 30-85% random values
- **5-minute intervals**: Data points every 5 minutes for realistic time series

## Dependencies Added
- `chart.js`: Core charting library
- `react-chartjs-2`: React wrapper for Chart.js
- `chartjs-adapter-date-fns`: Date/time handling for Chart.js
- `date-fns`: Date utility functions

## Configuration
Environment variables required:
```
DO_API_TOKEN=your_digitalocean_api_token
```

## Usage
1. Navigate to `/dashboard/servers`
2. Click "Update Servers" to fetch droplet data from DigitalOcean
3. Select a server from the list to view its metrics
4. Choose time period (1h, 1d, 1w, 1m) for historical data
5. Toggle auto-refresh for real-time monitoring
6. View interactive charts with hover tooltips for detailed values

## Future Enhancements
- Network I/O metrics
- Alert thresholds and notifications
- Server performance comparisons
- Export functionality for charts and data
- Custom time range selection
- Mobile app support
