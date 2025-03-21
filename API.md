# Non-Towered Airport Safety System API Documentation

## Base URL

- Development: `http://localhost:8080`
- Production: `https://api.your-domain.com`

## Authentication

All API endpoints require authentication using an API key:

```
Authorization: Bearer YOUR_API_KEY
```

## API Endpoints

### Aircraft Data

#### GET `/api/aircraft`

Retrieve all aircraft currently tracked by the system.

**Query Parameters:**
- `airport` (optional): Filter aircraft by airport vicinity (ICAO code)

**Response:**
```json
{
  "aircraft": [
    {
      "id": "a8d729",
      "callsign": "N12345",
      "position": [37.3329, -121.8989],
      "altitude": 2500,
      "heading": 270,
      "speed": 120,
      "verticalRate": -500,
      "onGround": false,
      "type": "C172",
      "alertLevel": "none"
    },
    // Additional aircraft...
  ],
  "total": 12,
  "airport": "KRHV"
}
```

### Advisories

#### GET `/api/advisories`

Retrieve active safety advisories.

**Query Parameters:**
- `airport` (optional): Filter advisories by airport (ICAO code)

**Response:**
```json
{
  "advisories": [
    {
      "id": "ADV-KRHV-PATTERN-1",
      "timestamp": "2023-05-15T14:23:45Z",
      "message": "TRAFFIC ALERT: Pattern separation issue between N12345 and N54321.",
      "severity": 3,
      "category": "PATTERN",
      "expires": "2023-05-15T14:33:45Z"
    },
    // Additional advisories...
  ],
  "total": 3,
  "airport": "KRHV"
}
```

### Airport Data

#### GET `/api/airports`

Retrieve information about monitored airports.

**Query Parameters:**
- `icao` (optional): Filter by specific airport ICAO code

**Response:**
```json
{
  "airports": [
    {
      "id": "KRHV",
      "name": "Reid-Hillview Airport",
      "position": [37.3329, -121.8989],
      "elevation": 133,
      "runways": [
        {
          "id": "13L/31R",
          "heading": 130,
          "length": 3100,
          "width": 75,
          "threshold1": [37.3376, -121.9034],
          "threshold2": [37.3281, -121.8944],
          "active": true
        },
        // Additional runways...
      ]
    },
    // Additional airports...
  ]
}
```

### Weather Data

#### GET `/api/weather`

Retrieve current weather conditions for monitored airports.

**Query Parameters:**
- `airport` (optional): Filter by specific airport ICAO code

**Response:**
```json
{
  "weather": [
    {
      "airport_icao": "KRHV",
      "time": "2023-05-15T14:53:00Z",
      "wind_direction": 240,
      "wind_speed": 12,
      "wind_gust": 18,
      "visibility": 10,
      "ceiling": 5000,
      "temperature": 25,
      "dewpoint": 15,
      "altimeter": 29.92,
      "flight_category": "VFR",
      "raw_metar": "KRHV 151453Z 24012G18KT 10SM FEW050 25/15 A2992"
    },
    // Additional weather data...
  ]
}
```

## WebSocket Endpoints

### Real-time Updates

#### WS `/ws/updates`

Connect to receive real-time updates about aircraft positions, new advisories, and changing conditions.

**Query Parameters:**
- `airport` (optional): Filter updates by airport ICAO code
- `type` (optional): Filter by update type (aircraft, advisory, weather)

**Messages:**

1. Aircraft Position Update:
```json
{
  "type": "aircraft_update",
  "data": {
    "id": "a8d729",
    "callsign": "N12345",
    "position": [37.3329, -121.8989],
    "altitude": 2500,
    "heading": 270,
    "speed": 120,
    "verticalRate": -500,
    "onGround": false,
    "type": "C172",
    "alertLevel": "none"
  }
}
```

2. New Advisory:
```json
{
  "type": "advisory",
  "data": {
    "id": "ADV-KRHV-PATTERN-1",
    "timestamp": "2023-05-15T14:23:45Z",
    "message": "TRAFFIC ALERT: Pattern separation issue between N12345 and N54321.",
    "severity": 3,
    "category": "PATTERN",
    "expires": "2023-05-15T14:33:45Z"
  }
}
```

3. Weather Update:
```json
{
  "type": "weather_update",
  "data": {
    "airport_icao": "KRHV",
    "time": "2023-05-15T14:53:00Z",
    "wind_direction": 240,
    "wind_speed": 12,
    "wind_gust": 18,
    "visibility": 10,
    "ceiling": 5000,
    "temperature": 25,
    "dewpoint": 15,
    "altimeter": 29.92,
    "flight_category": "VFR",
    "raw_metar": "KRHV 151453Z 24012G18KT 10SM FEW050 25/15 A2992"
  }
}
```

## Error Responses

All API endpoints return standard HTTP status codes:

- 200: Success
- 400: Bad Request (invalid parameters)
- 401: Unauthorized (invalid or missing API key)
- 403: Forbidden (insufficient permissions)
- 404: Not Found (resource doesn't exist)
- 500: Internal Server Error

Error response body format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {} // Optional additional information
}
``` 