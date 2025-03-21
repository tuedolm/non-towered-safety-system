# Non-Towered Airport Safety System

A real-time monitoring and advisory system for non-towered airports to enhance safety and situational awareness.

## System Overview

This system consists of several components:

1. **Data Ingestion Backend (Go)**: Collects and processes ADS-B data from OpenSky Network.

2. **Airport Intelligence Module (Python)**: Processes airport data and establishes safety boundaries.

3. **Conflict Detection Engine (Go)**: Real-time safety monitoring system for detecting potential conflicts.

4. **Advisory Generation System (Python)**: Generates context-aware safety advisories.

5. **Visualization Dashboard (NextJS)**: Interactive traffic monitoring interface.

## Directory Structure

```
├── backend/
│   ├── go/
│   │   ├── data_ingestion/       # OpenSky ADS-B data collection
│   │   └── conflict_detection/   # Conflict detection algorithms
│   └── python/
│       ├── airport_intelligence/ # Airport data processing
│       └── advisory_generation/  # Safety advisory generation
└── frontend/                    # NextJS visualization dashboard
```

## Setup and Installation

### Prerequisites

- Go 1.21+
- Python 3.9+
- Node.js 18+
- npm or yarn

### Backend Setup

#### Go Backend

1. Set up the Go environment:

```bash
cd backend/go
go mod download
```

2. Start the data ingestion service:

```bash
cd data_ingestion
go build
./data_ingestion
```

3. Start the conflict detection engine:

```bash
cd ../conflict_detection
go build
./conflict_detection
```

#### Python Backend

1. Set up the Python environment:

```bash
cd backend/python
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. Start the airport intelligence module:

```bash
cd airport_intelligence
python airport_database.py
```

3. Start the advisory generation system:

```bash
cd ../advisory_generation
python advisory_engine.py
```

### Frontend Setup

1. Install dependencies:

```bash
cd frontend
npm install
```

2. Start the development server:

```bash
npm run dev
```

The application will be available at http://localhost:3000.

## Configuration

### OpenSky Network API Credentials

Set the following environment variables for OpenSky Network API access:

```
OPENSKY_USERNAME=your_username
OPENSKY_PASSWORD=your_password
```

### Custom Airport Settings

Edit the `airports` list in the data ingestion service to specify which airports to monitor.

## Production Deployment

For production deployment, use containerization:

```bash
# Build and run with Docker
docker-compose up -d
```

## License

MIT License

## Acknowledgments

- [OpenSky Network](https://opensky-network.org/) for ADS-B data
- [OurAirports](https://ourairports.com/) for airport data 