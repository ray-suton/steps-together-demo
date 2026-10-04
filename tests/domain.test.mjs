import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createMapLink,
  eventSchemaHint,
  getEventById,
  getEventTags,
  listEvents,
  validateEvent,
} from '../src/domain.js';
import { WALKING_EVENTS } from '../src/events.js';

test('seed events satisfy the published schema contract', () => {
  assert.equal(eventSchemaHint.signUp, '{ capacity: integer, remaining: integer, deadline: ISO datetime }');

  for (const event of WALKING_EVENTS) {
    assert.deepEqual(validateEvent(event), []);
  }
});

test('listEvents filters by search, difficulty, tag, food, distance, and available spots', () => {
  const easyFoodEvents = listEvents({
    search: 'campus',
    difficulty: 'easy',
    tag: 'community',
    foodAvailable: true,
    maxDistanceKm: 3.5,
    minSpots: 2,
  });

  assert.equal(easyFoodEvents.length, 1);
  assert.equal(easyFoodEvents[0].id, 'campus-step-club');
  assert.equal(easyFoodEvents[0].mapUrl.startsWith('https://www.google.com/maps/search/'), true);
});

test('listEvents returns upcoming events sorted by date and time', () => {
  const events = listEvents();

  assert.deepEqual(
    events.map((event) => event.id),
    [
      'sunrise-corniche-loop',
      'mangrove-wellbeing-walk',
      'campus-step-club',
      'galleria-indoor-steps',
      'yas-park-power-walk',
    ],
  );
});

test('getEventById returns enriched records or null for stale ids', () => {
  const event = getEventById('yas-park-power-walk');

  assert.equal(event.title, 'Yas Park Power Walk');
  assert.equal(event.spotsAvailable, 5);
  assert.equal(event.isSoldOut, false);
  assert.equal(getEventById('missing-event'), null);
});

test('createMapLink encodes query text and keeps the Google Maps host fixed', () => {
  const link = createMapLink({
    latitude: 24.1234567,
    longitude: 54.9876543,
    label: 'Park & Cafe https://evil.example/path',
  });

  const url = new URL(link);
  assert.equal(url.origin, 'https://www.google.com');
  assert.equal(url.pathname, '/maps/search/');
  assert.equal(url.searchParams.get('api'), '1');
  assert.match(url.searchParams.get('query'), /24\.123457,54\.987654/);
  assert.match(url.searchParams.get('query'), /Park & Cafe/);
});

test('validateEvent reports malformed nested fields', () => {
  const invalid = {
    ...WALKING_EVENTS[0],
    distanceKm: -1,
    signUp: { capacity: 4, remaining: 5, deadline: 'not-a-date' },
    map: { latitude: 95, longitude: 54, label: '' },
  };

  assert.deepEqual(validateEvent(invalid), [
    'distanceKm must be a positive number',
    'signUp.remaining cannot exceed capacity',
    'signUp.deadline must be a parseable ISO datetime',
    'map.latitude must be between -90 and 90',
    'map.label must be a non-empty string',
  ]);
});

test('getEventTags exposes sorted unique tags for filter controls', () => {
  assert.deepEqual(getEventTags(), [
    'after-work',
    'beginner',
    'brisk',
    'campus',
    'community',
    'evening',
    'fitness',
    'indoor',
    'mall',
    'mindful',
    'morning',
    'nature',
    'social',
    'waterfront',
    'weekend',
  ]);
});
