# Progress log

## 2026-10-04 - Sprint 2 demo build

### What changed

- Read and visually inspected all 10 pages of the E-phase report.
- Locked the build to two core features: event discovery and event detail/sign-up access.
- Added five fictional walking events spanning waterfront, nature, campus, indoor mall, and challenging park use cases.
- Added schema validation, deterministic filters, complete details, an illustrated route preview, safe meeting-point links, and a no-storage confirmation flow.
- Added a dependency-free local server and Node contract tests.
- Added responsive desktop/mobile presentation and accessibility hooks.

### Decisions

- No backend database or real registration in the demo.
- No runtime AI; deterministic filtering is sufficient and auditable.
- Route art is labeled as illustrative so it is not mistaken for navigation.
- A hosting provider was not assumed; deployment instructions are included for the team.

### Acceptance traceability

| Criterion | Implementation evidence | Status |
| --- | --- | --- |
| S2-AC1 complete event details | Cards and detail panel render all schema fields | Passed in Chromium |
| S2-AC2 map renders or opens | Local SVG route illustration plus fixed-host meeting-point link | Passed in Chromium |
| S2-AC3 clear difficulty | Easy, Moderate, and Challenging labels with explanations | Passed in Chromium |
| S2-AC4 food available/unavailable | Every event contains an explicit food note | Passed by schema and browser checks |
| S2-AC5 placeholders completed/deferred | No product placeholders; production limitations are explicitly labeled | Passed content audit |
| S2-AC6 desktop/mobile flow | Responsive CSS and shared interaction path | Passed at 1280x720, 768x1024, and 375x812 |
| S2-AC7 safe demo data | Fictional event records; no health claims or personal-data fields | Passed content and storage audit |

### Verification evidence

- Automated: `npm test` passed 13/13 tests.
- Static checks: all application, domain, data, server, and test modules passed `node --check`.
- Browser resources: HTML, CSS, and all JavaScript modules returned HTTP 200 with no console errors.
- Desktop flow: indoor filter returned only Galleria Indoor Steps; Challenging returned Yas Park Power Walk; details showed route, food, difficulty, map host, and sign-up selection.
- Mobile flow: Galleria filter -> detail -> interest confirmation passed at 375x812 with no horizontal overflow and no browser storage.
- Visual QA: responsive screenshots passed the second visual verdict at 93/100.
- Runtime hardening: a second `npm run serve` now falls back from occupied port 4173 to the next available port instead of throwing an unhandled `EADDRINUSE` error.
- Route visual polish: the preview now uses curved waypoint geometry, contextual water/road cues, start/finish markers, waypoint labels, and a north indicator while remaining clearly labeled as illustrative.
- Deployment: public GitHub repository and GitHub Pages site are live at `https://ray-suton.github.io/steps-together-demo/`; the Pages build is `built`, and HTML/CSS/JS each return HTTP 200.

### Current blockers and risks

- Public hosting is not configured, so the report's public URL remains pending.
- Cross-browser evidence must be captured after deployment or on the team's target browsers.
- External Google Maps availability depends on network access during the demonstration.

### Next steps

1. Use the GitHub Pages URL for the Tuesday presentation.
2. Add the live URL and presentation feedback to the E-phase report.
3. Keep attendee storage/admin views deferred unless the course explicitly requires them.
