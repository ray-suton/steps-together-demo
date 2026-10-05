# Steps Together demo

Steps Together is a dependency-free Sprint 2 demo for the E-phase laboratory. It keeps the approved journey from the report: discover a community walking event, review the route and practical details, then confirm sign-up interest.

Live demo: <https://ray-suton.github.io/steps-together-demo/>

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm test
npm run serve
```

Open the URL printed by the server. It starts at <http://127.0.0.1:4173/> and automatically tries the next port if that port is already occupied.

## Locked MVP scope

The 48-hour demo has two core features:

1. Event discovery: search and filter complete fictional walking-event listings.
2. Event decision and sign-up: inspect an illustrated route, difficulty explanation, food status, meeting-point map link, and privacy-safe interest confirmation.

Out of scope: accounts, authentication, payments, database persistence, real registration, admin tools, live map routing, medical advice, and runtime AI.

## Architecture

- `index.html` and `styles.css`: accessible responsive application shell.
- `src/events.js`: fictional, non-sensitive event records.
- `src/domain.js`: data validation, filtering, lookup, and safe map-link generation.
- `src/app.js`: browser rendering, filters, details, illustrated routes, and sign-up interaction.
- `scripts/serve.mjs`: small static development server.
- `tests/`: Node built-in contract and domain tests.

The browser imports ES modules directly. There is no server-side application and no persisted user data.

## Endpoints

The local server exposes static `GET` resources only:

- `GET /` -> application shell
- `GET /styles.css` -> application styles
- `GET /src/app.js` -> browser controller
- `GET /src/domain.js` and `GET /src/events.js` -> data contract and demo records

There is no registration API in this MVP. The sign-up action records nothing; it only confirms the selected event in the current page.

There is no client-side storage, attendee list, active-event database, or admin view in this Wizard-of-Oz increment.

## Event schema

Each event contains:

```text
id, title, location, date, time, durationMinutes, distanceKm,
difficulty, description, route[], food{available,note},
signUp{capacity,remaining,deadline}, map{latitude,longitude,label},
imageTheme, tags[]
```

`src/domain.js` validates the schema before the UI starts and derives `spotsAvailable`, `isSoldOut`, and a fixed-host Google Maps meeting-point URL.

## AI logic

There is no runtime AI. This follows the report's rule that AI may support team work but is not acceptance evidence. Discovery uses deterministic text, level, place-type, and food filters. A future release may add opt-in rule-based ranking, but it must remain transparent and must not infer health suitability.

## Deploy

This is a static site. For GitHub Pages, Netlify, or Vercel, publish the repository root with no build command. Keep `index.html` at the site root. After deployment, repeat the desktop/mobile journey and record the public URL in the E-phase report.

## Current limitations

- Event and route data are fictional demonstration content.
- The SVG is an illustrated route preview, not turn-by-turn navigation.
- The map action opens the event meeting point in Google Maps.
- Sign-up is a no-storage demo confirmation, not a real reservation.
- Public deployment and cross-browser evidence must be recorded separately.

Project memory: [project description](./project_description.md), [feature list](./feature-list.md), and [progress log](./progress.md).
