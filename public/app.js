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

function renderList() {
  const filtered = filterReports();

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
    locationEl.textContent = `dY"? ${report.location}`;

    const altText = `${report.title} - ${report.location}`;
    imageEl.setAttribute("aria-label", altText);
    if (report.imageUrl) {
      imageEl.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), url('${report.imageUrl}')`;
    } else {
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
