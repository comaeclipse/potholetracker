// Pensacola, FL area default center (30d25'17"N 87d13'00"W)
const DEFAULT_CENTER = { lat: 30.421389, lng: -87.216667 };
const DEFAULT_ZOOM = 12;

// Initialize the map
const map = L.map("map").setView(
  [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
  DEFAULT_ZOOM
);

// Add OpenStreetMap tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19
}).addTo(map);

// Edit mode state
let editMode = false;
const markers = new Map(); // reportId -> { marker, originalLatLng, report }
const pendingChanges = new Map(); // reportId -> { lat, lng }

// Edit mode UI elements
const editModeBtn = document.getElementById("editModeBtn");
const saveChangesBar = document.getElementById("saveChangesBar");
const editModeIndicator = document.getElementById("editModeIndicator");
const changesCount = document.getElementById("changesCount");
const saveChangesBtn = document.getElementById("saveChangesBtn");
const cancelChangesBtn = document.getElementById("cancelChangesBtn");

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
    const { data: reports } = await response.json();

    if (!reports || reports.length === 0) {
      loading.textContent = "No reports found";
      return;
    }

    // Hide loading indicator
    loading.style.display = "none";

    // Clear existing markers
    markers.forEach(({ marker }) => {
      map.removeLayer(marker);
    });
    markers.clear();
    pendingChanges.clear();

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
      const marker = L.marker([lat, lng], { icon: potholeIcon, draggable: false })
        .addTo(map)
        .bindPopup(popupContent);

      // Store marker reference for edit mode
      markers.set(report.id, {
        marker,
        originalLatLng: { lat, lng },
        report
      });

      // Handle marker drag events
      marker.on("dragend", function(e) {
        const newLatLng = e.target.getLatLng();
        pendingChanges.set(report.id, {
          lat: newLatLng.lat,
          lng: newLatLng.lng
        });
        updateChangesCount();
      });
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

// Edit mode functions
function toggleEditMode() {
  editMode = !editMode;
  editModeBtn.classList.toggle("active", editMode);
  editModeIndicator.classList.toggle("active", editMode);

  // Enable/disable dragging on all markers
  markers.forEach(({ marker }) => {
    if (editMode) {
      marker.dragging.enable();
    } else {
      marker.dragging.disable();
    }
  });

  // Show/hide save bar if there are pending changes
  updateChangesCount();
}

function updateChangesCount() {
  const count = pendingChanges.size;
  changesCount.textContent = count;
  saveChangesBar.classList.toggle("active", editMode && count > 0);
}

async function saveChanges() {
  if (pendingChanges.size === 0) return;

  saveChangesBtn.disabled = true;
  saveChangesBtn.textContent = "Saving...";

  try {
    const promises = [];
    pendingChanges.forEach((coords, reportId) => {
      promises.push(
        fetch(`/api/reports/${reportId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: coords.lat,
            longitude: coords.lng
          })
        })
      );
    });

    await Promise.all(promises);

    // Update original positions
    pendingChanges.forEach((coords, reportId) => {
      const data = markers.get(reportId);
      if (data) {
        data.originalLatLng = { lat: coords.lat, lng: coords.lng };
      }
    });

    pendingChanges.clear();
    updateChangesCount();
    
    // Show success feedback
    alert(`Successfully updated ${promises.length} location(s)`);
  } catch (error) {
    console.error("Error saving changes:", error);
    alert("Failed to save some changes. Please try again.");
  } finally {
    saveChangesBtn.disabled = false;
    saveChangesBtn.textContent = "Save Changes";
  }
}

function cancelChanges() {
  // Reset markers to original positions
  pendingChanges.forEach((_, reportId) => {
    const data = markers.get(reportId);
    if (data) {
      data.marker.setLatLng([data.originalLatLng.lat, data.originalLatLng.lng]);
    }
  });

  pendingChanges.clear();
  updateChangesCount();
}

// Event listeners for edit mode
editModeBtn.addEventListener("click", toggleEditMode);
saveChangesBtn.addEventListener("click", saveChanges);
cancelChangesBtn.addEventListener("click", cancelChanges);

// Load reports when page loads
loadReports();

// Refresh every 30 seconds (only if not in edit mode to avoid disrupting edits)
setInterval(() => {
  if (!editMode) {
    loadReports();
  }
}, 30000);
