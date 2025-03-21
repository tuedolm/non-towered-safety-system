#!/bin/bash

# Non-Towered Airport Safety System Backend Starter Script
# This script starts all backend components in the correct order

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Non-Towered Airport Safety System Backend...${NC}"

# Ensure data directory exists
mkdir -p ./data

# Start Go components (in background)
echo -e "${YELLOW}Starting Data Ingestion Service...${NC}"
cd ./backend/go/data_ingestion
go build
./data_ingestion &
DATA_INGESTION_PID=$!
cd ../../..

echo -e "${YELLOW}Starting Conflict Detection Engine...${NC}"
cd ./backend/go/conflict_detection
go build
./conflict_detection &
CONFLICT_DETECTION_PID=$!
cd ../../..

# Start Python components (in background)
echo -e "${YELLOW}Starting Airport Intelligence Module...${NC}"
cd ./backend/python/airport_intelligence
python3 airport_database.py &
AIRPORT_INTELLIGENCE_PID=$!
cd ../../..

echo -e "${YELLOW}Starting Advisory Generation System...${NC}"
cd ./backend/python/advisory_generation
python3 advisory_engine.py &
ADVISORY_GENERATION_PID=$!
cd ../../..

# Register cleanup function
function cleanup {
  echo -e "${YELLOW}Shutting down backend components...${NC}"
  kill $DATA_INGESTION_PID 2>/dev/null
  kill $CONFLICT_DETECTION_PID 2>/dev/null
  kill $AIRPORT_INTELLIGENCE_PID 2>/dev/null
  kill $ADVISORY_GENERATION_PID 2>/dev/null
  echo -e "${GREEN}All backend components terminated.${NC}"
  exit 0
}

# Catch interrupt signal (Ctrl+C)
trap cleanup SIGINT

echo -e "${GREEN}All backend components started successfully!${NC}"
echo -e "Data Ingestion:       PID $DATA_INGESTION_PID"
echo -e "Conflict Detection:   PID $CONFLICT_DETECTION_PID"
echo -e "Airport Intelligence: PID $AIRPORT_INTELLIGENCE_PID"
echo -e "Advisory Generation:  PID $ADVISORY_GENERATION_PID"
echo -e "${BLUE}Press Ctrl+C to stop all components${NC}"

# Wait for user to interrupt with Ctrl+C
wait 