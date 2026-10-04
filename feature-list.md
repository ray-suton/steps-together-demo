# Feature list

## Shipped in the local MVP

### Event discovery and filtering

- Status: shipped
- Priority: P0
- User value: find a walk by text, difficulty, place type, or food availability.
- Acceptance: complete fictional event cards remain readable and return a clear empty state when no event matches.
- Dependencies: local event schema and browser ES modules.
- Implementation: `src/events.js`, `src/domain.js`, `src/app.js`.

### Event detail, route, and sign-up access

- Status: shipped
- Priority: P0
- User value: compare route length, duration, difficulty explanation, food status, meeting point, map access, and remaining capacity before confirming interest.
- Acceptance: illustrated route renders, meeting-point link uses a fixed Google Maps host, and confirmation requests/stores no personal data.
- Dependencies: event discovery selection.
- Implementation: `src/app.js`, `index.html`, `styles.css`.

## Planned release work

### Public static deployment

- Status: planned
- Priority: P0 for report submission
- User value: gives reviewers a stable URL.
- Acceptance: public URL loads, the desktop/mobile journey passes, and the URL is recorded in the E-phase report.
- Dependencies: access to the team's chosen GitHub Pages, Netlify, Vercel, or Replit project.

## Deferred

- Real registration and shared persistence.
- Organizer/admin event management.
- Live route navigation.
- Optional transparent recommendation ranking.

## Removed from MVP

- Runtime generative AI.
- Authentication and profiles.
- Health or weight-loss recommendations.
