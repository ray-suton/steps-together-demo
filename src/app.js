const DEFAULT_EVENTS = [
  {
    id: "creek-cleanup",
    title: "Creek Cleanup Walk",
    category: "cleanup",
    date: "2026-10-10",
    time: "08:30",
    location: "Khalifa City Park",
    distanceKm: 3.2,
    impact: "high",
    capacity: 30,
    remainingSpots: 8,
    description: "A guided community walk that removes litter and logs visible hazards.",
    coordinates: [
      [24.4205, 54.5739],
      [24.4223, 54.5784],
      [24.4247, 54.5812]
    ]
  },
  {
    id: "mangrove-count",
    title: "Mangrove Biodiversity Count",
    category: "citizen-science",
    date: "2026-10-17",
    time: "16:00",
    location: "Jubail Mangrove Park",
    distanceKm: 2.1,
    impact: "medium",
    capacity: 18,
    remainingSpots: 5,
    description: "Volunteers record species sightings on an accessible boardwalk loop.",
    coordinates: [
      [24.546, 54.4382],
      [24.5487, 54.4408],
      [24.5502, 54.4434]
    ]
  }
];

const SELECTORS = {
  count: "#event-count",
  detail: "#event-detail",
  detailBody: "#detail-body",
  detailClose: "#detail-close",
  empty: "#empty-state",
  food: "[data-food-filter]",
  impact: "#impact-filter",
  list: "#event-list, [data-event-list]",
  location: "[data-location-filter]",
  search: "#event-search, [data-search-input]",
  signupEvent: "[data-signup-event]",
  signupForm: "[data-signup-form]",
  signupStatus: "[data-signup-status], #signup-status",
  status: "[data-status-message]",
  category: "#category-filter, [data-level-filter]"
};

const EMAIL_ADDRESS = "hello@steps-together.local";

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function normalizeEvents(eventsModule = {}, domainModule = {}) {
  const rawEvents =
    (typeof domainModule.listEvents === "function" && domainModule.listEvents()) ||
    eventsModule.events ||
    eventsModule.WALKING_EVENTS ||
    eventsModule.default ||
    domainModule.events ||
    DEFAULT_EVENTS;
  const categories =
    (typeof domainModule.getEventTags === "function" && domainModule.getEventTags()) ||
    domainModule.categories ||
    eventsModule.categories ||
    [];
  const impacts = domainModule.impactLevels || eventsModule.impactLevels || ["low", "medium", "high"];

  return {
    categories,
    impacts,
    events: rawEvents.map(normalizeEventForUi)
  };
}

function normalizeEventForUi(event) {
  const difficultyImpact = {
    easy: "low",
    moderate: "medium",
    hard: "high"
  };
  const remaining = event.remainingSpots ?? event.signUp?.remaining ?? event.spotsAvailable;

  return {
    ...event,
    category: event.category || event.difficulty || "community",
    date: event.date || "",
    distanceKm: Number(event.distanceKm || 0),
    impact: event.impact || difficultyImpact[event.difficulty] || "medium",
    remainingSpots: Number.isFinite(Number(remaining)) ? Number(remaining) : null,
    coordinates: getRouteCoordinates(event)
  };
}

function waypointOffset(label, index) {
  let hash = 0;
  for (const char of String(label || index)) {
    hash = (hash * 31 + char.charCodeAt(0)) % 997;
  }
  const angle = (index / Math.max(1, hash % 5)) * Math.PI + (hash % 90);
  const radius = 0.0012 + (hash % 7) * 0.00018;
  return [Math.sin(angle) * radius, Math.cos(angle) * radius];
}

function getRouteCoordinates(event) {
  if (Array.isArray(event.coordinates) && event.coordinates.length > 0) {
    return event.coordinates;
  }

  if (!event.map || typeof event.map.latitude !== "number" || typeof event.map.longitude !== "number") {
    return [];
  }

  const route = Array.isArray(event.route) && event.route.length > 0 ? event.route : [event.map.label, event.location];
  return route.map((waypoint, index) => {
    if (index === 0 || index === route.length - 1) {
      return [event.map.latitude, event.map.longitude];
    }
    const [latOffset, lngOffset] = waypointOffset(waypoint, index);
    return [event.map.latitude + latOffset, event.map.longitude + lngOffset];
  });
}

export function applyFilters(events, filters = {}) {
  const query = (filters.query || "").trim().toLowerCase();
  const category = filters.category || "all";
  const impact = filters.impact || "all";
  const location = filters.location || "all";
  const food = filters.food || "all";

  return events.filter((event) => {
    const searchable = [
      event.title,
      event.location,
      event.description,
      event.category,
      event.difficulty,
      ...(event.tags || []),
      ...(event.route || [])
    ]
      .join(" ")
      .toLowerCase();
    const queryMatch = !query || searchable.includes(query);
    const categoryMatch =
      category === "all" || event.category === category || event.difficulty === category || event.tags?.includes(category);
    const impactMatch = impact === "all" || event.impact === impact || event.difficulty === impact;
    const locationMatch =
      location === "all" ||
      lowerIncludes(event.location, location) ||
      event.tags?.some((tag) => lowerIncludes(tag, location)) ||
      (location === "outdoor" && !lowerIncludes(event.location, "mall")) ||
      (location === "indoor" && lowerIncludes(event.location, "mall")) ||
      (location === "family" && (event.difficulty === "easy" || event.distanceKm <= 4.5));
    const foodMatch =
      food === "all" ||
      (food === "provided" && event.food?.available === true) ||
      (food === "nearby" && event.food?.available !== true);
    return queryMatch && categoryMatch && impactMatch && locationMatch && foodMatch;
  });
}

function lowerIncludes(value, needle) {
  return String(value ?? "").toLowerCase().includes(String(needle ?? "").toLowerCase());
}

function difficultyInfo(difficulty) {
  return {
    easy: {
      label: "Easy",
      note: "Gentle pace with regular pauses; suitable for new walkers."
    },
    moderate: {
      label: "Moderate",
      note: "Steady pace and a longer route; comfortable walking shoes recommended."
    },
    hard: {
      label: "Challenging",
      note: "Brisk pace over the longest route; designed for experienced walkers."
    }
  }[difficulty] || {
    label: "Level not listed",
    note: "Ask the event host for route accessibility details."
  };
}

function formatSchedule(event) {
  const start = new Date(`${event.date}T${event.time || "00:00"}:00+04:00`);
  if (Number.isNaN(start.getTime())) {
    return [event.date, event.time].filter(Boolean).join(" ");
  }
  return new Intl.DateTimeFormat("en-AE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Dubai"
  }).format(start);
}

export function buildRouteSvg(event) {
  const coordinates = event.coordinates || [];
  if (coordinates.length < 2) {
    return '<div class="route-map route-map--empty">Route preview unavailable</div>';
  }

  const latitudes = coordinates.map(([lat]) => lat);
  const longitudes = coordinates.map(([, lng]) => lng);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const latSpan = Math.max(maxLat - minLat, 0.0001);
  const lngSpan = Math.max(maxLng - minLng, 0.0001);

  const pointPairs = coordinates
    .map(([lat, lng]) => {
      const x = 24 + ((lng - minLng) / lngSpan) * 252;
      const y = 156 - ((lat - minLat) / latSpan) * 120;
      return [Number(x.toFixed(1)), Number(y.toFixed(1))];
    });
  const points = pointPairs.map(([x, y]) => `${x},${y}`).join(" ");
  const routePath = pointPairs.reduce((path, [x, y], index) => {
    if (index === 0) return `M ${x} ${y}`;
    const [previousX, previousY] = pointPairs[index - 1];
    const controlX = ((previousX + x) / 2).toFixed(1);
    const controlY = ((previousY + y) / 2).toFixed(1);
    return `${path} Q ${controlX} ${controlY} ${x} ${y}`;
  }, "");
  const waypointLabels = Array.isArray(event.route) && event.route.length
    ? event.route
    : pointPairs.map((_, index) => `Waypoint ${index + 1}`);
  const start = pointPairs[0];
  const finish = pointPairs.at(-1);
  const theme = `${event.title || ""} ${event.location || ""} ${event.imageTheme || ""}`.toLowerCase();
  const waterShape = /corniche|mangrove|waterfront|lake|boardwalk/.test(theme)
    ? '<path d="M0 24 C54 10 86 48 142 30 S252 8 300 26 L300 0 L0 0 Z" fill="#d9eff1" opacity="0.95"></path>'
    : '<path d="M0 24 H300 M0 58 H300 M0 92 H300 M0 126 H300 M36 0 V180 M92 0 V180 M148 0 V180 M204 0 V180 M260 0 V180" stroke="#d9e8e1" stroke-width="1" opacity="0.8"></path>';
  const labels = pointPairs
    .map(([x, y], index) => {
      const label = waypointLabels[index] || `Waypoint ${index + 1}`;
      const shortLabel = label.length > 20 ? `${label.slice(0, 19)}…` : label;
      const labelY = y < 34 ? y + 20 : y - 13;
      const labelAnchor = x < 60 ? "start" : x > 240 ? "end" : "middle";
      const labelX = x < 60 ? 8 : x > 240 ? 292 : x;
      return `
        <circle cx="${x}" cy="${y}" r="4.5" fill="#ffffff" stroke="#0d6b57" stroke-width="2"></circle>
        <text x="${labelX.toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="${labelAnchor}" class="route-waypoint-label">${escapeHtml(shortLabel)}</text>
      `;
    })
    .join("");

  return `
    <svg class="route-map" viewBox="0 0 300 180" role="img" aria-label="${escapeHtml(event.title)} illustrated route map">
      <rect width="300" height="180" rx="8" fill="#eef7f2"></rect>
      ${waterShape}
      <path d="M-20 150 C42 126 82 174 142 142 S246 102 320 130" fill="none" stroke="#ffffff" stroke-width="12" stroke-linecap="round" opacity="0.8"></path>
      <path d="${routePath}" fill="none" stroke="#b8d0c5" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"></path>
      <path d="${routePath}" fill="none" stroke="#0d6b57" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"></path>
      <polyline points="${points}" fill="none" stroke="transparent" stroke-width="1"></polyline>
      ${labels}
      <circle cx="${start[0]}" cy="${start[1]}" r="8" fill="#0d6b57"></circle>
      <circle cx="${finish[0]}" cy="${finish[1]}" r="8" fill="#f3a712"></circle>
      <text x="12" y="168" class="route-legend-label">START</text>
      <text x="255" y="168" class="route-legend-label">FINISH</text>
      <text x="282" y="18" text-anchor="end" class="route-north">N ↑</text>
    </svg>
  `;
}

export function getExternalMapUrl(event) {
  if (event.mapUrl) {
    return event.mapUrl;
  }
  if (event.map && typeof event.map.latitude === "number" && typeof event.map.longitude === "number") {
    const query = `${event.map.label || event.location || event.title} ${event.map.latitude},${event.map.longitude}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }
  const coordinates = event.coordinates || [];
  if (!coordinates.length) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location || event.title)}`;
  }
  const [startLat, startLng] = coordinates[0];
  const [endLat, endLng] = coordinates.at(-1);
  return `https://www.google.com/maps/dir/?api=1&origin=${startLat},${startLng}&destination=${endLat},${endLng}`;
}

export function buildSignupIntent(event) {
  const subject = `Steps Together interest: ${event.title}`;
  const body = [
    `I am interested in joining ${event.title}.`,
    `Event ID: ${event.id}`,
    "Please reply with the next steps. No personal data was collected by the demo."
  ].join("\n");

  return {
    confirmation: `Interest noted for ${event.title}. The demo does not store personal data.`,
    mailtoHref: `mailto:${EMAIL_ADDRESS}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  };
}

function eventCard(event) {
  const spots = event.remainingSpots === null ? "Open" : `${event.remainingSpots} spots`;
  const food = event.food?.available ? event.food.note : event.food?.note || "Food unavailable";
  const difficulty = difficultyInfo(event.difficulty);
  const selectedClass = event.isSelected ? " is-selected" : "";
  return `
    <article class="event-card${selectedClass}" data-event-card data-event-id="${escapeHtml(event.id)}">
      <div class="card-main">
        <div class="card-heading">
          <span class="level-badge ${escapeHtml(event.difficulty)}">${escapeHtml(difficulty.label)}</span>
          <h3>${escapeHtml(event.title)}</h3>
        </div>
        <p>${escapeHtml(event.description)}</p>
        <dl class="event-facts">
          <div><dt>When</dt><dd>${escapeHtml(formatSchedule(event))}</dd></div>
          <div><dt>Where</dt><dd>${escapeHtml(event.location)}</dd></div>
          <div><dt>Route</dt><dd>${escapeHtml(event.distanceKm)} km · ${escapeHtml(event.durationMinutes)} min</dd></div>
          <div><dt>Food</dt><dd>${escapeHtml(food)}</dd></div>
        </dl>
      </div>
      <div class="event-card__footer">
        <span class="spots-label">${escapeHtml(spots)} available</span>
        <button type="button" class="select-button" data-action="view-event" data-event-select="${escapeHtml(event.id)}" data-event-id="${escapeHtml(event.id)}">View details</button>
      </div>
    </article>
  `;
}

function detailMarkup(event) {
  const route = Array.isArray(event.route) ? event.route.join(" → ") : "Route details available at meetup";
  const food = event.food?.note || "Bring water and comfortable walking shoes.";
  const difficulty = difficultyInfo(event.difficulty);
  const spots = event.remainingSpots === null ? "Registration open" : `${event.remainingSpots} demo spots available`;
  return `
    <div class="detail-header">
      <span class="level-badge ${escapeHtml(event.difficulty)}">${escapeHtml(difficulty.label)}</span>
      <h2 id="detail-heading">${escapeHtml(event.title)}</h2>
      <p>${escapeHtml(event.description)}</p>
    </div>
    <div class="map-preview route-map-shell" role="img" aria-label="Illustrated route preview for ${escapeHtml(event.title)}">
      ${buildRouteSvg(event)}
    </div>
    <p class="map-caption">Illustrated demo route. Use the map link for the meeting point.</p>
    <dl class="detail-grid">
      <div><dt>Route</dt><dd>${escapeHtml(event.distanceKm)} km · ${escapeHtml(event.durationMinutes)} minutes<br>${escapeHtml(route)}</dd></div>
      <div><dt>Difficulty</dt><dd>${escapeHtml(difficulty.note)}</dd></div>
      <div><dt>Food</dt><dd>${escapeHtml(food)}</dd></div>
      <div><dt>Meet point</dt><dd>${escapeHtml(event.map?.label || event.location)}<br>${escapeHtml(formatSchedule(event))}</dd></div>
    </dl>
    <div class="detail-actions">
      <a class="primary-action" data-action="signup-access" href="#signup-panel">Access sign-up</a>
      <a class="secondary-action" data-action="external-map" target="_blank" rel="noreferrer" href="${escapeHtml(getExternalMapUrl(event))}">Open meeting point</a>
    </div>
    <p class="availability-note">${escapeHtml(spots)}. This demo does not collect personal data.</p>
  `;
}

function query(root, selector) {
  return root?.querySelector?.(selector) || null;
}

export function createApp({ document: doc = globalThis.document, events = DEFAULT_EVENTS } = {}) {
  const state = {
    events,
    selectedEventId: null,
    filters: {
      category: "all",
      impact: "all",
      food: "all",
      location: "all",
      query: ""
    }
  };

  const render = () => {
    const list = query(doc, SELECTORS.list);
    const count = query(doc, SELECTORS.count);
    const empty = query(doc, SELECTORS.empty);
    const filtered = applyFilters(state.events, state.filters);

    if (list) {
      list.innerHTML = filtered.length
        ? filtered
            .map((event) => eventCard({ ...event, isSelected: event.id === state.selectedEventId }))
            .join("")
        : '<p class="empty-state">No walks match those filters. Try a broader search or choose all levels.</p>';
    }
    if (count) {
      count.textContent = `${filtered.length} event${filtered.length === 1 ? "" : "s"}`;
    }
    const status = query(doc, SELECTORS.status);
    if (status) {
      status.textContent = `Showing ${filtered.length} demo event${filtered.length === 1 ? "" : "s"}.`;
    }
    if (empty) {
      empty.hidden = filtered.length > 0;
    }
    const signupEvent = query(doc, SELECTORS.signupEvent);
    if (signupEvent) {
      signupEvent.innerHTML = state.events
        .map((event) => `<option value="${escapeHtml(event.id)}">${escapeHtml(event.title)}</option>`)
        .join("");
    }
  };

  const openEvent = (eventId) => {
    const event = state.events.find((candidate) => candidate.id === eventId);
    const detail = query(doc, SELECTORS.detail);
    if (!event || !detail) {
      return;
    }
    detail.innerHTML = detailMarkup(event);
    detail.hidden = false;
    detail.setAttribute("data-open-event", event.id);
    state.selectedEventId = event.id;
    doc?.querySelectorAll?.("[data-event-card]").forEach((card) => {
      card.classList.toggle("is-selected", card.dataset.eventId === event.id);
    });
    const signupEvent = query(doc, SELECTORS.signupEvent);
    if (signupEvent) {
      signupEvent.value = event.id;
    }
  };

  const closeEvent = () => {
    const detail = query(doc, SELECTORS.detail);
    if (!detail) {
      return;
    }
    detail.hidden = true;
    detail.removeAttribute("data-open-event");
  };

  const bind = () => {
    query(doc, SELECTORS.search)?.addEventListener("input", (event) => {
      state.filters.query = event.target.value;
      render();
    });
    query(doc, SELECTORS.category)?.addEventListener("change", (event) => {
      state.filters.category = event.target.value || "all";
      render();
    });
    query(doc, SELECTORS.impact)?.addEventListener("change", (event) => {
      state.filters.impact = event.target.value || "all";
      render();
    });
    query(doc, SELECTORS.location)?.addEventListener("change", (event) => {
      state.filters.location = event.target.value || "all";
      render();
    });
    doc?.querySelectorAll?.(SELECTORS.food).forEach((input) => {
      input.addEventListener("change", (event) => {
        if (event.target.checked) {
          state.filters.food = event.target.value || "all";
          render();
        }
      });
    });
    query(doc, SELECTORS.list)?.addEventListener("click", (event) => {
      const button = event.target.closest?.("[data-action='view-event'], [data-event-select]");
      if (button) {
        openEvent(button.dataset.eventId || button.dataset.eventSelect);
      }
    });
    query(doc, SELECTORS.detail)?.addEventListener("click", (event) => {
      const signup = event.target.closest?.("[data-action='signup-access']");
      if (signup) {
        const detail = query(doc, SELECTORS.detail);
        const selected = state.events.find((candidate) => candidate.id === detail?.dataset.openEvent);
        const status = query(doc, SELECTORS.signupStatus);
        if (selected && status) {
          status.textContent = `${selected.title} selected. Confirm below; no personal data is requested.`;
        }
      }
    });
    query(doc, SELECTORS.signupForm)?.addEventListener("submit", (event) => {
      event.preventDefault();
      const selectedId = query(doc, SELECTORS.signupEvent)?.value;
      const selected = state.events.find((candidate) => candidate.id === selectedId) || state.events[0];
      const status = query(doc, SELECTORS.status);
      if (selected && status) {
        status.textContent = buildSignupIntent(selected).confirmation;
      }
      const signupStatus = query(doc, SELECTORS.signupStatus);
      if (selected && signupStatus) {
        signupStatus.textContent = buildSignupIntent(selected).confirmation;
      }
      if (selected) {
        openEvent(selected.id);
      }
    });
  };

  return {
    bind,
    closeEvent,
    openEvent,
    render,
    state
  };
}

export async function init({ document: doc = globalThis.document } = {}) {
  let eventsModule = {};
  let domainModule = {};

  try {
    eventsModule = await import("./events.js");
  } catch {
    eventsModule = {};
  }

  try {
    domainModule = await import("./domain.js");
  } catch {
    domainModule = {};
  }

  const data = normalizeEvents(eventsModule, domainModule);
  const app = createApp({ document: doc, events: data.events });
  app.bind();
  app.render();
  if (data.events[0]) {
    app.openEvent(data.events[0].id);
  }
  return app;
}

if (globalThis.document) {
  init();
}
