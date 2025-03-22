// Add this after your coordinates data
const busRouteStops = {
    'Gurugram-Panipat': [
        { name: 'Gurugram Bus Stand', time: '06:00 AM', status: 'Departed' },
        { name: 'Rajiv Chowk', time: '06:20 AM', status: 'Departed' },
        { name: 'Delhi Border', time: '06:45 AM', status: 'Departed' },
        { name: 'Sonipat Bus Stand', time: '07:30 AM', status: 'Next Stop' },
        { name: 'Samalkha', time: '08:00 AM', status: 'Pending' },
        { name: 'Panipat Bus Stand', time: '08:30 AM', status: 'Pending' }
    ],
    'Faridabad-Ambala': [
        { name: 'Faridabad Bus Stand', time: '07:00 AM', status: 'Departed' },
        { name: 'Delhi', time: '07:45 AM', status: 'Departed' },
        { name: 'Sonipat', time: '08:30 AM', status: 'Next Stop' },
        { name: 'Panipat', time: '09:15 AM', status: 'Pending' },
        { name: 'Karnal', time: '10:00 AM', status: 'Pending' },
        { name: 'Kurukshetra', time: '10:45 AM', status: 'Pending' },
        { name: 'Ambala Bus Stand', time: '11:30 AM', status: 'Pending' }
    ]
    // Add more routes as needed
};

// Modify the trackBus function
function trackBus(busNumber, source, destination) {
    // Create route key
    const routeKey = `${source}-${destination}`;
    const stops = busRouteStops[routeKey] || generateDummyStops(source, destination);

    // Show tracking modal
    showTrackingModal(busNumber, stops, source, destination);
}

// Add this function to generate dummy stops for any route
function generateDummyStops(source, destination) {
    const sourceCoords = getDistrictCoordinates(source);
    const destCoords = getDistrictCoordinates(destination);
    
    // Calculate intermediate points
    const numStops = 4; // Number of stops between source and destination
    const stops = [];
    
    // Add source as first stop
    stops.push({
        name: `${source} Bus Stand`,
        time: '06:00 AM',
        status: 'Departed',
        coordinates: sourceCoords
    });

    // Generate intermediate stops
    for(let i = 1; i <= numStops; i++) {
        const progress = i / (numStops + 1);
        const lat = sourceCoords[0] + (destCoords[0] - sourceCoords[0]) * progress;
        const lng = sourceCoords[1] + (destCoords[1] - sourceCoords[1]) * progress;
        
        const hour = 6 + Math.floor(i * 2);
        const time = `${hour.toString().padStart(2, '0')}:00 AM`;
        
        stops.push({
            name: `Stop ${i}`,
            time: time,
            status: hour <= new Date().getHours() ? 'Departed' : hour === new Date().getHours() + 1 ? 'Next Stop' : 'Pending',
            coordinates: [lat, lng]
        });
    }

    // Add destination as last stop
    stops.push({
        name: `${destination} Bus Stand`,
        time: '08:00 PM',
        status: 'Pending',
        coordinates: destCoords
    });

    return stops;
}

// Add this function to show the tracking modal
function showTrackingModal(busNumber, stops, source, destination) {
    // Create modal HTML
    const modalHtml = `
        <div id="trackingModal" class="tracking-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Bus ${busNumber}</h2>
                    <span class="close-btn" onclick="closeTrackingModal()">&times;</span>
                </div>
                <div class="route-info">
                    <div class="route-endpoints">
                        <div class="endpoint">
                            <i class="fas fa-circle start"></i>
                            <span>${source}</span>
                        </div>
                        <div class="endpoint">
                            <i class="fas fa-circle end"></i>
                            <span>${destination}</span>
                        </div>
                    </div>
                    <div class="stops-container">
                        ${stops.map((stop, index) => `
                            <div class="stop-item ${stop.status.toLowerCase().replace(' ', '-')}">
                                <div class="stop-timeline">
                                    <div class="timeline-dot"></div>
                                    ${index < stops.length - 1 ? '<div class="timeline-line"></div>' : ''}
                                </div>
                                <div class="stop-info">
                                    <div class="stop-name">${stop.name}</div>
                                    <div class="stop-time">${stop.time}</div>
                                    <div class="stop-status">${stop.status}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Update map with all stops
    showStopsOnMap(stops);
}

// Add this function to show stops on map
function showStopsOnMap(stops) {
    // Clear existing markers
    if (busPath) map.removeLayer(busPath);
    if (busMarker) map.removeLayer(busMarker);

    // Create coordinates array for the path
    const coordinates = stops.map(stop => stop.coordinates);

    // Draw path
    busPath = L.polyline(coordinates, {
        color: '#1a237e',
        weight: 3
    }).addTo(map);

    // Add markers for each stop
    stops.forEach((stop, index) => {
        const markerColor = stop.status === 'Departed' ? 'green' : 
                          stop.status === 'Next Stop' ? 'blue' : 'gray';
        
        const stopIcon = L.divIcon({
            html: `<div class="stop-marker ${markerColor}">
                    <span class="stop-number">${index + 1}</span>
                   </div>`,
            className: 'stop-icon'
        });

        L.marker(stop.coordinates, {icon: stopIcon})
         .bindPopup(`<b>${stop.name}</b><br>Time: ${stop.time}<br>Status: ${stop.status}`)
         .addTo(map);
    });

    // Fit map to show all stops
    map.fitBounds(busPath.getBounds(), {
        padding: [50, 50]
    });
}

// Add this function to close the tracking modal
function closeTrackingModal() {
    const modal = document.getElementById('trackingModal');
    if (modal) modal.remove();
}