# VMC Mock Server

Mock Vending Machine Controller with WebSocket support for real-time status updates.

## Features

- ✅ RESTful API endpoints for vending operations
- ✅ WebSocket support for real-time status updates
- ✅ Simulated vending delays
- ✅ Status tracking (idle/vending)

## Installation

```bash
npm install
```

## Running the Server

```bash
# Standard mode
npm start

# Development mode (auto-restart on changes)
npm run dev
```

The server will start on port **3002** by default.

## API Endpoints

### POST /vend
Accepts an array of item numbers and simulates vending with a 5-second delay.

**Request:**
```json
{
  "items": [101, 202, 105]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Vending started",
  "items": [101, 202, 105],
  "estimatedTime": 5000
}
```

### GET /status
Returns the current vending machine status.

**Response (when idle):**
```json
{
  "status": "idle",
  "message": "Machine is idle",
  "timestamp": "2025-11-11T10:30:00.000Z"
}
```

**Response (when vending):**
```json
{
  "status": "vending",
  "items": [101, 202, 105],
  "elapsedTime": 2340,
  "message": "Vending in progress",
  "timestamp": "2025-11-11T10:30:00.000Z"
}
```

### GET /health
Health check endpoint.

## WebSocket Connection

Connect to `ws://localhost:3002` to receive real-time status updates.

**Message Types:**

1. **Status Update:**
```json
{
  "type": "status",
  "status": "vending",
  "items": [101, 202, 105],
  "message": "Vending started"
}
```

2. **Vending Complete:**
```json
{
  "type": "vend-complete",
  "status": "idle",
  "message": "Vending completed successfully",
  "vendedItems": [101, 202, 105],
  "timestamp": "2025-11-11T10:30:05.000Z"
}
```

## Testing with cURL

```bash
# Test vending
curl -X POST http://localhost:3002/vend \
  -H "Content-Type: application/json" \
  -d '{"items": [101, 202, 105]}'

# Check status
curl http://localhost:3002/status

# Health check
curl http://localhost:3002/health
```

## Port Configuration

Default port is 3002. You can change it by setting the `PORT` environment variable:

```bash
PORT=3003 npm start
```
