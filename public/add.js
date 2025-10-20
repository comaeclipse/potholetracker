// Add report modal functionality
let addMap;
let marker;
let currentLat = 51.505;
let currentLng = -0.09;

// Modal elements
const modal = document.getElementById("addModal");
const openBtn = document.getElementById("openAddModal");
const closeBtn = document.getElementById("closeModal");
const form = document.getElementById("addReportForm");
const submitBtn = document.getElementById("submitBtn");

// Open modal
openBtn?.addEventListener("click", () => {
  modal.classList.add("active");
  document.body.style.overflow = "hidden"; // Prevent background scroll

  // Initialize map when modal opens
  setTimeout(() => {
    initializeAddMap();
  }, 100);
});

// Close modal
function closeModal() {
  modal.classList.remove("active");
  document.body.style.overflow = ""; // Restore scroll

  // Clean up map
  if (addMap) {
    addMap.remove();
    addMap = null;
    marker = null;
  }

  // Reset form
  form.reset();
}

closeBtn?.addEventListener("click", closeModal);

// Close on overlay click
modal?.addEventListener("click", (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

// Close on Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.classList.contains("active")) {
    closeModal();
  }
});

// Initialize the map with user's location
function initializeAddMap() {
  if (addMap) return; // Already initialized

  // Create map
  addMap = L.map("addMap").setView([currentLat, currentLng], 15);

  // Add tiles
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(addMap);

  // Custom draggable marker
  const markerIcon = L.divIcon({
    className: "custom-marker",
    html: `<div style="background: #667eea; width: 40px; height: 40px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 3px 10px rgba(0,0,0,0.4); position: relative; top: -20px; left: -20px;">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(45deg);">
        <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40]
  });

  // Add marker
  marker = L.marker([currentLat, currentLng], {
    icon: markerIcon,
    draggable: true
  }).addTo(addMap);

  // Update coordinates when marker is dragged
  marker.on("dragend", (e) => {
    const position = e.target.getLatLng();
    currentLat = position.lat;
    currentLng = position.lng;
    console.log("New position:", currentLat, currentLng);
  });

  // Try to get user's actual location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        currentLat = position.coords.latitude;
        currentLng = position.coords.longitude;

        // Update map and marker
        addMap.setView([currentLat, currentLng], 15);
        marker.setLatLng([currentLat, currentLng]);

        console.log("User location:", currentLat, currentLng);
      },
      (error) => {
        console.warn("Geolocation error:", error.message);
        // Keep default location
      }
    );
  }
}

// Handle form submission
form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Disable submit button
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";

  // Get form data
  const formData = new FormData(form);
  const data = {
    title: formData.get("title"),
    description: formData.get("description"),
    location: formData.get("location"),
    latitude: currentLat,
    longitude: currentLng
  };

  try {
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error("Failed to submit report");
    }

    const result = await response.json();
    console.log("Report submitted:", result);

    // Show success message
    alert("Report submitted successfully!");

    // Close modal and reset
    closeModal();

    // Reload reports if on home page
    if (typeof loadReports === "function") {
      loadReports();
    }

    // Redirect to home if on map page
    if (window.location.pathname.includes("map.html")) {
      window.location.href = "/";
    }

  } catch (error) {
    console.error("Error submitting report:", error);
    alert("Failed to submit report. Please try again.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Report";
  }
});
