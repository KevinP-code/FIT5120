import { calculateDistance, checkAccidentsOnRoute } from './accidents.js';

// Geocode a location name to coordinates using Mapbox Geocoding API
async function geocodeLocation(location) {
    const query = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?access_token=${mapboxgl.accessToken}`,
        { method: 'GET' }
    );
    const json = await query.json();
    if (json.features.length > 0) {
        return json.features[0].center;
    } else {
        throw new Error(`Location not found: ${location}`);
    }
}

// Request a route from the Mapbox Directions API and display it on the map
async function getRoute(map, start, end, routeLayers, routesData, accidentData) {
    const query = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/cycling/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&alternatives=true&access_token=${mapboxgl.accessToken}`,
        { method: 'GET' }
    );
    const json = await query.json();
    console.log('Route data from Mapbox:', json); // Log route data from Mapbox

    // Clear existing route layers
    routeLayers.forEach(layerId => {
        if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
        }
        if (map.getSource(layerId)) {
            map.removeSource(layerId);
        }
    });
    routeLayers.length = 0;
    routesData.length = 0;

    // Display all routes and set up event listeners to select a route
    json.routes.forEach((route, index) => {
        const routeId = `route${index}`;
        routeLayers.push(routeId);
        routesData.push(route);

        const geojson = {
            type: 'Feature',
            properties: {},
            geometry: route.geometry
        };

        map.addSource(routeId, {
            type: 'geojson',
            data: geojson
        });

        map.addLayer({
            id: routeId,
            type: 'line',
            source: routeId,
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': index === 0 ? '#3887be' : '#888',
                'line-width': 5,
                'line-opacity': index === 0 ? 0.75 : 0.5
            }
        });

        // Add button to select route
        const button = document.createElement('button');
        button.className = 'btn btn-secondary route-button';
        button.textContent = `Route ${index + 1}`;
        button.onclick = () => selectRoute(map, index, routesData, accidentData);
        document.getElementById('routeButtons').appendChild(button);
    });

    // Default to selecting the first route
    selectRoute(map, 0, routesData, accidentData);
}

// Select a route and update turn-by-turn instructions
function selectRoute(map, index, routesData, accidentData) {
    routesData.forEach((route, i) => {
        map.setPaintProperty(`route${i}`, 'line-color', i === index ? getRouteColor(route, accidentData) : '#888');
        map.setPaintProperty(`route${i}`, 'line-opacity', i === index ? 0.75 : 0.5);
    });

    const instructions = document.getElementById('instructions');
    const steps = routesData[index].legs[0].steps;
    let tripInstructions = '';

    // Check the number of accident points the route passes through and calculate average severity
    const { accidentCount, averageSeverity } = checkAccidentsOnRoute(routesData[index], accidentData);

    // Determine safety level based on accidentCount
    let safetyLevel;
    if (accidentCount >= 1 && accidentCount <= 15) {
        safetyLevel = "Safe";
    } else if (accidentCount >= 15 && accidentCount <= 50) {
        safetyLevel = "Moderate";
    } else if (accidentCount > 50) {
        safetyLevel = "Dangerous";
    } else {
        safetyLevel = "Unknown"; // Default case if no accidents
    }

    if (accidentCount > 0) {
        tripInstructions += `<li><strong>Warning: This route passes through ${accidentCount} accident-prone area(s)! Safety Level: ${safetyLevel}</strong></li>`;
    }

    for (const step of steps) {
        tripInstructions += `<li>${step.maneuver.instruction}</li>`;
    }
    instructions.innerHTML = `<p><strong>Trip duration: ${Math.floor(routesData[index].duration / 60)} min  </strong></p><ol>${tripInstructions}</ol>`;
}

// Get the route color based on safety level
function getRouteColor(route, accidentData) {
    const { accidentCount } = checkAccidentsOnRoute(route, accidentData);

    if (accidentCount >= 1 && accidentCount <= 15) {
        return '#00FF00'; // Green for Safe
    } else if (accidentCount >= 15 && accidentCount <= 50) {
        return '#FFA500'; // Orange for Moderate
    } else if (accidentCount > 50) {
        return '#FF0000'; // Red for Dangerous
    } else {
        return '#3887be'; // Default color
    }
}

export { geocodeLocation, getRoute, selectRoute };
