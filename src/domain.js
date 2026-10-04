import { WALKING_EVENTS } from './events.js';

const DIFFICULTIES = Object.freeze(['easy', 'moderate', 'hard']);
const DIFFICULTY_ORDER = Object.freeze({ easy: 1, moderate: 2, hard: 3 });
const REQUIRED_TEXT_FIELDS = Object.freeze([
  'id',
  'title',
  'location',
  'date',
  'time',
  'difficulty',
  'description',
  'imageTheme',
]);

const EVENT_SCHEMA_HINT = Object.freeze({
  id: 'stable slug',
  title: 'display title',
  location: 'human-readable place',
  date: 'YYYY-MM-DD',
  time: 'HH:mm',
  durationMinutes: 'positive integer',
  distanceKm: 'positive number',
  difficulty: 'easy | moderate | hard',
  description: 'short product copy',
  route: 'ordered string[] waypoints',
  food: '{ available: boolean, note: string }',
  signUp: '{ capacity: integer, remaining: integer, deadline: ISO datetime }',
  map: '{ latitude: number, longitude: number, label: string }',
  imageTheme: 'prompt/theme for generated or curated imagery',
  tags: 'string[]',
});

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isTime(value) {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function isNumberInRange(value, min, max) {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

function lower(value) {
  return String(value ?? '').trim().toLowerCase();
}

function normalizeEvent(event) {
  return {
    ...event,
    spotsAvailable: Math.max(0, event.signUp.remaining),
    isSoldOut: event.signUp.remaining <= 0,
    mapUrl: createMapLink(event.map),
  };
}

export const eventSchemaHint = EVENT_SCHEMA_HINT;

/**
 * Validates a walking event record and returns an array of human-readable issues.
 * An empty array means the event matches the local MVP data contract.
 */
export function validateEvent(event) {
  const issues = [];

  if (!isPlainObject(event)) {
    return ['event must be an object'];
  }

  for (const field of REQUIRED_TEXT_FIELDS) {
    if (!hasText(event[field])) {
      issues.push(`${field} must be a non-empty string`);
    }
  }

  if (!isDate(event.date)) {
    issues.push('date must use YYYY-MM-DD format');
  }

  if (!isTime(event.time)) {
    issues.push('time must use HH:mm 24-hour format');
  }

  if (!Number.isInteger(event.durationMinutes) || event.durationMinutes <= 0) {
    issues.push('durationMinutes must be a positive integer');
  }

  if (!isNumberInRange(event.distanceKm, 0.1, 100)) {
    issues.push('distanceKm must be a positive number');
  }

  if (!DIFFICULTIES.includes(event.difficulty)) {
    issues.push('difficulty must be easy, moderate, or hard');
  }

  if (!Array.isArray(event.route) || event.route.length < 2 || !event.route.every(hasText)) {
    issues.push('route must include at least two named waypoints');
  }

  if (!isPlainObject(event.food) || typeof event.food.available !== 'boolean' || !hasText(event.food.note)) {
    issues.push('food must include available and note');
  }

  if (!isPlainObject(event.signUp)) {
    issues.push('signUp must be an object');
  } else {
    if (!Number.isInteger(event.signUp.capacity) || event.signUp.capacity <= 0) {
      issues.push('signUp.capacity must be a positive integer');
    }

    if (!Number.isInteger(event.signUp.remaining) || event.signUp.remaining < 0) {
      issues.push('signUp.remaining must be a non-negative integer');
    }

    if (
      Number.isInteger(event.signUp.capacity) &&
      Number.isInteger(event.signUp.remaining) &&
      event.signUp.remaining > event.signUp.capacity
    ) {
      issues.push('signUp.remaining cannot exceed capacity');
    }

    if (!hasText(event.signUp.deadline) || Number.isNaN(Date.parse(event.signUp.deadline))) {
      issues.push('signUp.deadline must be a parseable ISO datetime');
    }
  }

  if (!isPlainObject(event.map)) {
    issues.push('map must be an object');
  } else {
    if (!isNumberInRange(event.map.latitude, -90, 90)) {
      issues.push('map.latitude must be between -90 and 90');
    }

    if (!isNumberInRange(event.map.longitude, -180, 180)) {
      issues.push('map.longitude must be between -180 and 180');
    }

    if (!hasText(event.map.label)) {
      issues.push('map.label must be a non-empty string');
    }
  }

  if (!Array.isArray(event.tags) || event.tags.length === 0 || !event.tags.every(hasText)) {
    issues.push('tags must be a non-empty string array');
  }

  return issues;
}

/**
 * Builds a safe Google Maps URL from trusted coordinates only.
 * Labels are encoded as query text and never control the destination host.
 */
export function createMapLink(map) {
  if (!isPlainObject(map) || !isNumberInRange(map.latitude, -90, 90) || !isNumberInRange(map.longitude, -180, 180)) {
    throw new TypeError('map coordinates are required to create a map link');
  }

  const coordinates = `${map.latitude.toFixed(6)},${map.longitude.toFixed(6)}`;
  const query = hasText(map.label) ? `${map.label} ${coordinates}` : coordinates;
  const url = new URL('https://www.google.com/maps/search/');
  url.searchParams.set('api', '1');
  url.searchParams.set('query', query);
  return url.toString();
}

/**
 * Returns upcoming walking events filtered by search text, difficulty, tag,
 * food availability, max distance, and minimum available spots.
 */
export function listEvents(filters = {}) {
  const search = lower(filters.search);
  const difficulty = lower(filters.difficulty);
  const tag = lower(filters.tag);
  const maxDistanceKm = Number(filters.maxDistanceKm);
  const minSpots = Number(filters.minSpots ?? 0);
  const foodRequired = filters.foodAvailable === true;

  return WALKING_EVENTS.filter((event) => {
    const haystack = lower([
      event.title,
      event.location,
      event.description,
      event.difficulty,
      ...event.tags,
      ...event.route,
    ].join(' '));

    return (
      (!search || haystack.includes(search)) &&
      (!difficulty || event.difficulty === difficulty) &&
      (!tag || event.tags.some((eventTag) => lower(eventTag) === tag)) &&
      (!Number.isFinite(maxDistanceKm) || event.distanceKm <= maxDistanceKm) &&
      event.signUp.remaining >= minSpots &&
      (!foodRequired || event.food.available)
    );
  })
    .sort((first, second) => {
      const dateSort = `${first.date}T${first.time}`.localeCompare(`${second.date}T${second.time}`);
      return dateSort || DIFFICULTY_ORDER[first.difficulty] - DIFFICULTY_ORDER[second.difficulty];
    })
    .map(normalizeEvent);
}

/**
 * Finds one event by id. Returns null instead of throwing so UI code can render
 * an ordinary empty state when a stale link is opened.
 */
export function getEventById(id) {
  const event = WALKING_EVENTS.find((candidate) => candidate.id === id);
  return event ? normalizeEvent(event) : null;
}

export function getEventTags() {
  return [...new Set(WALKING_EVENTS.flatMap((event) => event.tags))].sort();
}

const validationIssues = WALKING_EVENTS.flatMap((event) =>
  validateEvent(event).map((issue) => `${event.id || 'unknown event'}: ${issue}`),
);

if (validationIssues.length > 0) {
  throw new Error(`Invalid walking event seed data:\n${validationIssues.join('\n')}`);
}
