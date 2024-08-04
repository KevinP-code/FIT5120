// Calculate the distance between two points in meters
function calculateDistance(coord1, coord2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = coord1[1] * Math.PI / 180;
    const φ2 = coord2[1] * Math.PI / 180;
    const Δφ = (coord2[1] - coord1[1]) * Math.PI / 180;
    const Δλ = (coord2[0] - coord1[0]) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const d = R * c;
    return d;
}

// Check if the route passes through accident points and return the number of accidents encountered
function checkAccidentsOnRoute(route, accidentData) {
    const accidentCoordinates = accidentData.features.map(feature => feature.geometry.coordinates);
    const threshold = 100; // If the accident point to the route is less than 100 meters, then count as pass by the accidents
    let accidentCount = 0;
    let totalSeverity = 0;

    for (const accidentCoord of accidentCoordinates) {
        for (const routeCoord of route.geometry.coordinates) {
            const distance = calculateDistance(accidentCoord, routeCoord);
            if (distance < threshold) {
                accidentCount++;
                const accidentFeature = accidentData.features.find(feature => feature.geometry.coordinates[0] === accidentCoord[0] && feature.geometry.coordinates[1] === accidentCoord[1]);
                if (accidentFeature && accidentFeature.properties.severity) {
                    totalSeverity += accidentFeature.properties.severity;
                }
                break; // Prevent duplicate counting
            }
        }
    }

    const averageSeverity = accidentCount > 0 ? totalSeverity / accidentCount : 0;
    return { accidentCount, averageSeverity };
}

// Add accident points to the map
function addAccidentsToMap(map, accidentData) {
    map.addSource('accidents', {
        'type': 'geojson',
        'data': accidentData
    });

    map.addLayer({
        'id': 'accidents',
        'type': 'circle',
        'source': 'accidents',
        'paint': {
            'circle-radius': 3,
            'circle-color': [
                'match',
                ['get', 'severity'],
                1, '#00FF00', // Green for severity 1
                2, '#FFA500', // Orange for severity 2
                3, '#FF0000', // Red for severity 3
                '#FF0000' // Default to red
            ]
        }
    });

    // Click on the accidents will show the exact details of accidents
    map.on('click', 'accidents', function(e) {
        var coordinates = e.features[0].geometry.coordinates.slice();
        var description = e.features[0].properties.description;

        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(description)
            .addTo(map);
    });

    // Change cursor style when hovering over accident points
    map.on('mouseenter', 'accidents', function() {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'accidents', function() {
        map.getCanvas().style.cursor = '';
    });
}

// Export functions
export { calculateDistance, checkAccidentsOnRoute, addAccidentsToMap };
