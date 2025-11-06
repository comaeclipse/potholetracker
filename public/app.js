const reportsList = document.querySelector("#reportsList");
const emptyState = document.querySelector("#emptyState");
const tabs = Array.from(document.querySelectorAll(".tab"));
const statsElements = {
  total: document.querySelector('[data-stat="total"]'),
  verified: document.querySelector('[data-stat="verified"]'),
  inProgress: document.querySelector('[data-stat="inProgress"]'),
  fixed: document.querySelector('[data-stat="fixed"]')
};

const statusBadgeClassMap = {
  VERIFIED: "status-verified",
  IN_PROGRESS: "status-in-progress",
  REPORTED: "status-reported",
  FIXED: "status-fixed"
};

const state = {
  reports: [],
  filter: "all"
};

const addressCache = new Map();

async function loadReports() {
  try {
    const response = await fetch("/api/reports");
    if (!response.ok) {
      throw new Error("Failed to load reports");
    }
    const { data } = await response.json();
    state.reports = data ?? [];
    render();
  } catch (error) {
    console.error(error);
    reportsList.innerHTML =
      '<div class="empty-state">Unable to load reports right now.</div>';
  }
}

function render() {
  renderStats();
  renderList();
}

function renderStats() {
  const totals = state.reports.reduce(
    (acc, report) => {
      acc.total += 1;
      if (report.status === "VERIFIED") acc.verified += 1;
      if (report.status === "IN_PROGRESS") acc.inProgress += 1;
      if (report.status === "FIXED") acc.fixed += 1;
      return acc;
    },
    {
      total: 0,
      verified: 0,
      inProgress: 0,
      fixed: 0
    }
  );

  statsElements.total.textContent = totals.total;
  statsElements.verified.textContent = totals.verified;
  statsElements.inProgress.textContent = totals.inProgress;
  statsElements.fixed.textContent = totals.fixed;
}

function filterReports() {
  switch (state.filter) {
    case "fixed":
      return state.reports.filter((report) => report.status === "FIXED");
    case "urgent":
      return state.reports.filter((report) => report.status === "IN_PROGRESS");
    case "near":
      return state.reports;
    default:
      return state.reports;
  }
}

async function fetchNearestAddress(lat, lng) {
  const key = `${lat},${lng}`;
  const cached = addressCache.get(key);
  if (cached) {
    return cached;
  }

  const fetchPromise = (async () => {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", lat.toString());
    url.searchParams.set("lon", lng.toString());
    url.searchParams.set("zoom", "18");
    url.searchParams.set("addressdetails", "1");

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json"
      }
    });
    if (!response.ok) {
      throw new Error(`Reverse geocode failed with status ${response.status}`);
    }

    const data = await response.json();
    const road = data?.address?.road;
    const houseNumber = data?.address?.house_number;
    const city =
      data?.address?.city ||
      data?.address?.town ||
      data?.address?.village ||
      data?.address?.hamlet;
    const streetParts = [houseNumber, road].filter(Boolean);
    const streetLine =
      streetParts.length > 0 ? streetParts.join(" ").trim() : null;
    const address =
      [streetLine || road, city].filter(Boolean).join(", ") ||
      data?.display_name ||
      null;
    return address;
  })();

  addressCache.set(key, fetchPromise);

  try {
    const address = await fetchPromise;
    addressCache.set(key, address);
    return address;
  } catch (error) {
    addressCache.delete(key);
    throw error;
  }
}

async function populateLocation(locationEl, report) {
  const fallback = report.location?.trim() || "Location unavailable";
  locationEl.textContent = fallback;

  const lat = Number(report.latitude);
  const lng = Number(report.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return;
  }

  try {
    const address = await fetchNearestAddress(lat, lng);
    if (address && locationEl.isConnected) {
      locationEl.textContent = address;
    }
  } catch (error) {
    console.error("Reverse geocoding failed", error);
  }
}

function renderList() {
  const filtered = filterReports();

  // Clean up any existing Leaflet maps before clearing the DOM
  const existingMaps = reportsList.querySelectorAll('[id^="map-"]');
  existingMaps.forEach((mapEl) => {
    if (mapEl._leaflet_id) {
      const map = mapEl._leaflet;
      if (map) {
        map.remove();
      }
    }
  });

  reportsList.innerHTML = "";
  emptyState.hidden = filtered.length > 0;

  if (filtered.length === 0) {
    return;
  }

  const tmpl = document.querySelector("#reportTemplate");

  filtered.forEach((report) => {
    const node = tmpl.content.firstElementChild.cloneNode(true);
    const titleEl = node.querySelector(".report-title");
    const badgeEl = node.querySelector(".status-badge");
    const locationEl = node.querySelector(".report-location");
    const imageEl = node.querySelector(".report-image");
    const timeEl = node.querySelector(".report-time");
    const [upBtn, downBtn] = node.querySelectorAll(".action-btn");

    titleEl.textContent = report.title;
    badgeEl.textContent = formatStatus(report.status);
    badgeEl.classList.add(statusBadgeClassMap[report.status] ?? "");
    populateLocation(locationEl, report);

    const lat = Number(report.latitude);
    const lng = Number(report.longitude);
    const altText = `${report.title} - GPS: ${lat}, ${lng}`;
    imageEl.setAttribute("aria-label", altText);

    // Create Leaflet map if valid GPS coordinates exist
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      // Clear any existing background
      imageEl.style.backgroundImage = '';

      // Create a unique ID for this map container
      const mapId = `map-${report.id}`;
      imageEl.id = mapId;

      // Initialize map after a short delay to ensure DOM is ready
      setTimeout(() => {
        const mapContainer = document.getElementById(mapId);
        if (!mapContainer || mapContainer._leaflet_id) {
          return; // Skip if container doesn't exist or map already initialized
        }

        const map = L.map(mapId, {
          scrollWheelZoom: false,
          dragging: false,
          zoomControl: false,
          doubleClickZoom: false,
          touchZoom: false,
          attributionControl: false
        }).setView([lat, lng], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19
        }).addTo(map);

        L.marker([lat, lng]).addTo(map);
      }, 0);
    } else if (report.imageUrl) {
      // Fallback to image if no GPS but image exists
      imageEl.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), url('${report.imageUrl}')`;
    } else {
      // Fallback to gradient if no GPS and no image
      imageEl.style.backgroundImage =
        "linear-gradient(135deg, rgba(102, 126, 234, 0.4), rgba(118, 75, 162, 0.4))";
    }

    timeEl.textContent = formatRelativeTime(report.reportedAt);

    upBtn.querySelector(".action-count").textContent = report.upVotes ?? 0;
    downBtn.querySelector(".action-count").textContent = report.downVotes ?? 0;

    upBtn.addEventListener("click", () => vote(report.id, "up"));
    downBtn.addEventListener("click", () => vote(report.id, "down"));

    reportsList.appendChild(node);
  });
}

async function vote(id, direction) {
  try {
    const response = await fetch(`/api/reports/${id}/votes/${direction}`, {
      method: "POST"
    });
    if (!response.ok) {
      throw new Error("Vote failed");
    }
    const { data } = await response.json();
    state.reports = state.reports.map((report) =>
      report.id === id ? data : report
    );
    render();
  } catch (error) {
    console.error(error);
  }
}

function formatStatus(status) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatRelativeTime(dateString) {
  if (!dateString) {
    return "Unknown";
  }
  const date = new Date(dateString);
  const diff = Date.now() - date.getTime();
  const absDiff = Math.abs(diff);

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;

  const units = [
    { limit: minute, format: () => "just now" },
    {
      limit: hour,
      format: (elapsed) =>
        formatElapsed(Math.round(elapsed / minute), "minute")
    },
    {
      limit: day,
      format: (elapsed) =>
        formatElapsed(Math.round(elapsed / hour), "hour")
    },
    {
      limit: week,
      format: (elapsed) =>
        formatElapsed(Math.round(elapsed / day), "day")
    },
    {
      limit: month,
      format: (elapsed) =>
        formatElapsed(Math.round(elapsed / week), "week")
    },
    {
      limit: year,
      format: (elapsed) =>
        formatElapsed(Math.round(elapsed / month), "month")
    },
    {
      limit: Infinity,
      format: (elapsed) =>
        formatElapsed(Math.round(elapsed / year), "year")
    }
  ];

  for (const unit of units) {
    if (absDiff < unit.limit) {
      return unit.format(absDiff);
    }
  }

  return date.toLocaleDateString();
}

function formatElapsed(quantity, unit) {
  if (quantity <= 0) {
    return "just now";
  }
  const label = quantity === 1 ? unit : `${unit}s`;
  return `${quantity} ${label} ago`;
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    state.filter = tab.dataset.filter ?? "all";
    renderList();
  });
});

loadReports();
