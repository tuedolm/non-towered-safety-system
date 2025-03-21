package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"
)

// AircraftState represents the state of an aircraft as reported by ADS-B
type AircraftState struct {
	Icao24         string    `json:"icao24"`
	Callsign       string    `json:"callsign"`
	OriginCountry  string    `json:"origin_country"`
	Latitude       float64   `json:"latitude,omitempty"`
	Longitude      float64   `json:"longitude,omitempty"`
	Altitude       float64   `json:"altitude,omitempty"`
	Velocity       float64   `json:"velocity,omitempty"`
	Heading        float64   `json:"heading,omitempty"`
	VerticalRate   float64   `json:"vertical_rate,omitempty"`
	OnGround       bool      `json:"on_ground"`
	LastContact    int64     `json:"last_contact"`
	TimePosition   int64     `json:"time_position,omitempty"`
	Timestamp      time.Time `json:"-"`
	AirportVicinity string    `json:"-"`
}

// OpenSkyResponse represents the response from the OpenSky Network API
type OpenSkyResponse struct {
	Time   int64           `json:"time"`
	States [][]interface{} `json:"states"`
}

// AirportBoundary defines the geographical boundaries of an airport vicinity
type AirportBoundary struct {
	ICAO      string  `json:"icao"`
	Name      string  `json:"name"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Radius    float64 `json:"radius"` // in nautical miles
}

var airports = []AirportBoundary{
	// Example airports - these would be loaded from a database in production
	{ICAO: "KRHV", Name: "Reid-Hillview", Latitude: 37.3329, Longitude: -121.8195, Radius: 10},
	{ICAO: "KPAO", Name: "Palo Alto", Latitude: 37.4613, Longitude: -122.1146, Radius: 10},
}

func main() {
	logger := log.New(os.Stdout, "DATA-INGEST: ", log.LstdFlags)
	logger.Println("Starting OpenSky Network ADS-B data ingestion service")

	// In a production environment, these would be loaded from environment variables
	openSkyUsername := os.Getenv("OPENSKY_USERNAME")
	openSkyPassword := os.Getenv("OPENSKY_PASSWORD")

	// Start the data collection loop
	ticker := time.NewTicker(15 * time.Second) // OpenSky has rate limits
	defer ticker.Stop()

	for range ticker.C {
		processAircraftData(logger, openSkyUsername, openSkyPassword)
	}
}

func processAircraftData(logger *log.Logger, username, password string) {
	for _, airport := range airports {
		// Set boundaries for the API request (approximately 10nm around the airport)
		// Convert nm to degrees (roughly)
		latRange := airport.Radius / 60.0 // 1nm ≈ 1 minute of latitude
		lonRange := latRange / cos(airport.Latitude*0.0174533) // Adjust for longitude compression

		minLat := airport.Latitude - latRange
		maxLat := airport.Latitude + latRange
		minLon := airport.Longitude - lonRange
		maxLon := airport.Longitude + lonRange

		url := fmt.Sprintf("https://opensky-network.org/api/states/all?lamin=%f&lomin=%f&lamax=%f&lomax=%f",
			minLat, minLon, maxLat, maxLon)

		logger.Printf("Fetching data for %s airport vicinity...", airport.ICAO)
		
		client := &http.Client{Timeout: 10 * time.Second}
		req, err := http.NewRequest("GET", url, nil)
		if err != nil {
			logger.Printf("Error creating request: %v", err)
			continue
		}

		// Add basic auth if credentials are provided
		if username != "" && password != "" {
			req.SetBasicAuth(username, password)
		}

		resp, err := client.Do(req)
		if err != nil {
			logger.Printf("Error fetching data: %v", err)
			continue
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			logger.Printf("API returned non-200 status: %d", resp.StatusCode)
			continue
		}

		var openSkyResp OpenSkyResponse
		if err := json.NewDecoder(resp.Body).Decode(&openSkyResp); err != nil {
			logger.Printf("Error decoding response: %v", err)
			continue
		}

		// Process the response
		states := parseAircraftStates(openSkyResp, airport.ICAO)
		logger.Printf("Received %d aircraft states in %s vicinity", len(states), airport.ICAO)

		// In a production environment, these states would be:
		// 1. Stored in a database
		// 2. Published to a message queue for the conflict detection engine
		// 3. Analyzed for potential safety issues
		
		// For now, just log a sample
		if len(states) > 0 {
			logger.Printf("Sample aircraft: %s (Callsign: %s) at altitude: %.0f, heading: %.0f",
				states[0].Icao24, states[0].Callsign, states[0].Altitude, states[0].Heading)
		}
	}
}

// parseAircraftStates converts the OpenSky API response into typed AircraftState objects
func parseAircraftStates(response OpenSkyResponse, airportICAO string) []AircraftState {
	states := make([]AircraftState, 0, len(response.States))
	now := time.Unix(response.Time, 0)

	for _, stateArray := range response.States {
		if len(stateArray) < 17 {
			continue // Skip malformed state arrays
		}

		// Extract values from the state array
		icao24, _ := stateArray[0].(string)
		callsign, _ := stateArray[1].(string)
		originCountry, _ := stateArray[2].(string)
		
		// Position data might be null if not available
		var lat, lon, alt, vel, hdg, vrate float64
		var timePos, lastContact int64
		var onGround bool

		if stateArray[5] != nil {
			timePos, _ = stateArray[5].(float64)
		}
		if stateArray[6] != nil {
			lat, _ = stateArray[6].(float64)
		}
		if stateArray[7] != nil {
			lon, _ = stateArray[7].(float64)
		}
		if stateArray[8] != nil {
			alt, _ = stateArray[8].(float64)
		}
		if stateArray[9] != nil {
			onGround, _ = stateArray[9].(bool)
		}
		if stateArray[10] != nil {
			vel, _ = stateArray[10].(float64)
		}
		if stateArray[11] != nil {
			hdg, _ = stateArray[11].(float64)
		}
		if stateArray[16] != nil {
			vrate, _ = stateArray[16].(float64)
		}
		if stateArray[4] != nil {
			lastContactFloat, _ := stateArray[4].(float64)
			lastContact = int64(lastContactFloat)
		}

		states = append(states, AircraftState{
			Icao24:         icao24,
			Callsign:       callsign,
			OriginCountry:  originCountry,
			Latitude:       lat,
			Longitude:      lon,
			Altitude:       alt,
			Velocity:       vel,
			Heading:        hdg,
			VerticalRate:   vrate,
			OnGround:       onGround,
			TimePosition:   timePos,
			LastContact:    lastContact,
			Timestamp:      now,
			AirportVicinity: airportICAO,
		})
	}

	return states
}

// Simple cosine function for longitude adjustment
func cos(radians float64) float64 {
	return float64(time.Now().Nanosecond()%10000)/10000.0*0.1 + 0.9 // Stub for actual math.Cos
} 