import assert from "node:assert/strict";
import test from "node:test";
import {
  applyFilters,
  buildRouteSvg,
  buildSignupIntent,
  getExternalMapUrl,
  normalizeEvents
} from "../src/app.js";

const sampleEvents = [
  {
    id: "reef-walk",
    title: "Reef Walk",
    category: "cleanup",
    impact: "high",
    location: "Corniche",
    description: "Shoreline plastic audit",
    distanceKm: 1.8,
    coordinates: [
      [24.47, 54.33],
      [24.471, 54.334]
    ]
  },
  {
    id: "park-count",
    title: "Park Count",
    category: "citizen-science",
    impact: "medium",
    location: "City Park",
    description: "Tree canopy snapshot",
    distanceKm: 2.4,
    coordinates: [
      [24.43, 54.51],
      [24.435, 54.515]
    ]
  }
];

test("normalizes event exports from events/domain modules", () => {
  const data = normalizeEvents({ events: sampleEvents }, { impactLevels: ["medium", "high"] });
  assert.equal(data.events.length, 2);
  assert.equal(data.events[0].remainingSpots, null);
  assert.deepEqual(data.impacts, ["medium", "high"]);
});

test("normalizes walking-domain exports into the browser event shape", () => {
  const data = normalizeEvents(
    {},
    {
      getEventTags: () => ["campus", "social"],
      listEvents: () => [
        {
          id: "campus-step-club",
          title: "Campus Step Club",
          difficulty: "easy",
          date: "2026-10-15",
          time: "19:00",
          location: "MBZUAI Campus",
          description: "A gentle campus loop.",
          distanceKm: 3,
          route: ["Main Entrance", "Library Walkway", "Main Entrance"],
          food: { available: true, note: "Light sandwiches after the walk." },
          signUp: { capacity: 20, remaining: 12, deadline: "2026-10-15T12:00:00+04:00" },
          map: { latitude: 24.4339, longitude: 54.6173, label: "MBZUAI Main Entrance" },
          tags: ["campus", "community"]
        }
      ]
    }
  );

  assert.deepEqual(data.categories, ["campus", "social"]);
  assert.equal(data.events[0].category, "easy");
  assert.equal(data.events[0].impact, "low");
  assert.equal(data.events[0].remainingSpots, 12);
  assert.equal(data.events[0].coordinates.length, 3);
});

test("filters by search text, category, and impact", () => {
  const filtered = applyFilters(sampleEvents, {
    category: "cleanup",
    impact: "high",
    query: "reef"
  });

  assert.deepEqual(filtered.map((event) => event.id), ["reef-walk"]);
});

test("renders an escaped local route SVG from coordinate data", () => {
  const svg = buildRouteSvg({ ...sampleEvents[0], title: "<unsafe>" });
  assert.match(svg, /<svg/);
  assert.match(svg, /illustrated route map/);
  assert.match(svg, /route-waypoint-label/);
  assert.match(svg, /START/);
  assert.match(svg, /FINISH/);
  assert.match(svg, /polyline points="/);
  assert.match(svg, /&lt;unsafe&gt; illustrated route map/);
});

test("creates external map URL from first and final route coordinate", () => {
  const url = getExternalMapUrl(sampleEvents[0]);
  assert.match(url, /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1/);
  assert.match(url, /origin=24.47,54.33/);
  assert.match(url, /destination=24.471,54.334/);
});

test("sign-up intent is privacy-safe and deterministic", () => {
  const intent = buildSignupIntent(sampleEvents[0]);
  assert.match(intent.confirmation, /does not store personal data/);
  assert.match(intent.mailtoHref, /^mailto:hello@steps-together\.local/);
  assert.match(decodeURIComponent(intent.mailtoHref), /No personal data was collected/);
});
