# Project description

## Product truth

Steps Together is a community walking-event discovery demo for the Project Management E-phase laboratory. It serves students and local community members who want a low-pressure way to find a suitable social walk and understand the practical details before joining.

The product exists to prove one observable Scrum increment: a person can browse fictional events, judge whether a route fits, locate the meeting point, and reach a clear sign-up action.

## Strategy and constraints

- Preserve the event-discovery journey approved in the E-phase report.
- Fit implementation and verification inside 48 hours.
- Limit the MVP to two core features.
- Use fictional or non-sensitive data only.
- Make no medical, weight-loss, or safety claims.
- Prefer dependency-free static hosting over backend infrastructure.
- Treat placeholders and untested actions as limitations, not acceptance evidence.

## Key decisions

- A static browser application is sufficient for the course demo.
- The route preview is visibly labeled as an illustration; Google Maps is used only for the meeting-point link.
- The sign-up flow stores and transmits no personal information.
- Runtime AI is excluded because it does not advance the Sprint 2 acceptance criteria.
- Public deployment remains a separate release step because no hosting target or account was provided.

## Non-goals

User accounts, persistent registration, organizer administration, payments, live maps, attendance tracking, health recommendations, and production security/compliance are not part of this demo.
