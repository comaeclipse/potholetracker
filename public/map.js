// Pensacola, FL area default center (30d25'17"N 87d13'00"W)
const DEFAULT_CENTER = { lat: 30.421389, lng: -87.216667 };

// Initialize the map
const map = L.map("map").setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], 13);

// Add OpenStreetMap tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19
}).addTo(map);

// Custom icon for pothole markers
const potholeIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="background: #667eea; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

// Status badge helper
function getStatusClass(status) {
  const statusMap = {
    VERIFIED: "verified",
    IN_PROGRESS: "in-progress",
    REPORTED: "reported",
    FIXED: "fixed"
  };
  return statusMap[status] || "reported";
}

function formatStatus(status) {
  const statusMap = {
    VERIFIED: "Verified",
    IN_PROGRESS: "In Progress",
    REPORTED: "Reported",
    FIXED: "Fixed"
  };
  return statusMap[status] || status;
}

// Load reports and add markers
async function loadReports() {
  const loading = document.getElementById("loading");

  try {
    const response = await fetch("/api/reports");
    const reports = await response.json();

    if (!reports || reports.length === 0) {
      loading.textContent = "No reports found";
      return;
    }

    // Hide loading indicator
    loading.style.display = "none";

    // Track bounds for auto-zoom
    const bounds = [];

    reports.forEach((report) => {
      // Use provided coordinates or generate random ones for demo
      // In production, you'd geocode the location or require GPS coordinates
      const lat =
        report.latitude || DEFAULT_CENTER.lat + (Math.random() - 0.5) * 0.1;
      const lng =
        report.longitude || DEFAULT_CENTER.lng + (Math.random() - 0.5) * 0.1;

      bounds.push([lat, lng]);

      // Create popup content
      const popupContent = `
        <div class="popup-content">
          <div class="popup-title">${report.title}</div>
          <div class="popup-location">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            ${report.location}
          </div>
          <div class="popup-status status-${getStatusClass(report.status)}">
            ${formatStatus(report.status)}
          </div>
          <div class="popup-votes">
            <span>👍 ${report.upVotes}</span>
            <span>👎 ${report.downVotes}</span>
          </div>
        </div>
      `;

      // Add marker
      const marker = L.marker([lat, lng], { icon: potholeIcon })
        .addTo(map)
        .bindPopup(popupContent);
    });

    // Fit map to show all markers
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  } catch (error) {
    console.error("Error loading reports:", error);
    loading.textContent = "Error loading reports";
    loading.style.color = "#f44336";
  }
}

// Load reports when page loads
loadReports();

// Refresh every 30 seconds
setInterval(loadReports, 30000);
