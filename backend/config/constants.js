/**
 * constants.js — Single source of truth for all magic values
 *
 * Never hardcode limits, strings, or config values in controllers/services.
 * Import from here to keep the codebase maintainable and consistent.
 */

// ── Pagination ─────────────────────────────────────────────
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  COMMUNITY_LIMIT: 12,
  SEARCH_LIMIT: 10,
};

// ── JWT ────────────────────────────────────────────────────
export const JWT = {
  EXPIRES_IN: "7d",
  REFRESH_EXPIRES_IN: "30d",
  ALGORITHM: "HS256",
};

// ── Rate Limiting ──────────────────────────────────────────
export const RATE_LIMIT = {
  GLOBAL_WINDOW_MS: 15 * 60 * 1000,  // 15 minutes
  GLOBAL_MAX: 200,
  AUTH_WINDOW_MS: 15 * 60 * 1000,
  AUTH_MAX: 10,                        // Strict — prevents brute force
  AI_WINDOW_MS: 60 * 1000,            // 1 minute
  AI_MAX: 20,                          // AI endpoint protection
};

// ── File Upload ────────────────────────────────────────────
export const UPLOAD = {
  MAX_FILE_SIZE_MB: 5,
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024,
  ALLOWED_MIME_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  UPLOAD_PATH: "uploads/",
};

// ── Trip Status ────────────────────────────────────────────
export const TRIP_STATUS = {
  PLANNING: "planning",
  UPCOMING: "upcoming",
  ONGOING: "ongoing",
  COMPLETED: "completed",
};

// ── Trip Visibility ────────────────────────────────────────
export const TRIP_VISIBILITY = {
  PRIVATE: "private",
  FRIENDS: "friends",
  PUBLIC: "public",
};

// ── Travel Moods ───────────────────────────────────────────
export const TRAVEL_MOODS = [
  "Relax",
  "Burnout Recovery",
  "Romantic Escape",
  "Social Trip",
  "Adventure Rush",
  "Nature Detox",
];

// ── Travel Personalities ───────────────────────────────────
export const TRAVEL_PERSONALITIES = [
  "Backpacker",
  "Luxury Explorer",
  "Creator Traveler",
  "Solo Explorer",
  "Adventure Seeker",
  "Romantic Planner",
  "Spiritual Traveler",
];

// ── Expense Categories ─────────────────────────────────────
export const EXPENSE_CATEGORIES = [
  "Flights",
  "Hotels",
  "Food",
  "Transport",
  "Activities",
  "Shopping",
  "Visa",
  "Insurance",
  "Other",
];

// ── Activity Categories ────────────────────────────────────
export const ACTIVITY_CATEGORIES = [
  "Adventure",
  "Food",
  "Nightlife",
  "Spiritual",
  "Nature",
  "Photography",
  "Local Experience",
  "Hidden Gems",
  "Shopping",
  "Transport",
  "Hotel",
  "Museum",
  "Beach",
  "Cultural",
  "Other",
];

// ── Packing Categories ─────────────────────────────────────
export const PACKING_CATEGORIES = [
  "Clothing",
  "Electronics",
  "Essentials",
  "Documents",
  "Toiletries",
  "Medical",
  "Adventure Gear",
  "Other",
];

// ── Budget Allocation Benchmarks (% of total budget) ──────
// Used by the budget optimizer engine
export const BUDGET_BENCHMARKS = {
  Flights:    { min: 20, ideal: 30, max: 45 },
  Hotels:     { min: 20, ideal: 25, max: 35 },
  Food:       { min: 10, ideal: 15, max: 25 },
  Transport:  { min: 5,  ideal: 8,  max: 15 },
  Activities: { min: 8,  ideal: 12, max: 20 },
  Shopping:   { min: 0,  ideal: 5,  max: 15 },
  Visa:       { min: 0,  ideal: 3,  max: 8  },
  Insurance:  { min: 1,  ideal: 2,  max: 5  },
  Other:      { min: 0,  ideal: 5,  max: 10 },
};

// ── Fatigue Scoring Thresholds ─────────────────────────────
export const FATIGUE = {
  ACTIVITIES_PER_DAY_IDEAL: 4,
  ACTIVITIES_PER_DAY_HIGH: 6,
  WALKING_HOURS_DAILY: 3,         // avg tourist walks 3h
  REST_GAP_MINUTES: 30,           // min gap between activities
  SCORE_LOW: 30,
  SCORE_MEDIUM: 60,
  SCORE_HIGH: 80,
};

// ── Recommendation Engine Weights ──────────────────────────
export const RECOMMENDATION_WEIGHTS = {
  PERSONALITY_MATCH: 0.35,
  MOOD_MATCH: 0.25,
  BUDGET_FIT: 0.20,
  SEASON_FIT: 0.10,
  POPULARITY: 0.10,
};

// ── Collaborator Roles ─────────────────────────────────────
export const COLLABORATOR_ROLES = {
  OWNER: "owner",
  EDITOR: "editor",
  VIEWER: "viewer",
};

// ── User Roles ─────────────────────────────────────────────
export const USER_ROLES = {
  USER: "user",
  ADMIN: "admin",
};

// ── HTTP Status Codes ──────────────────────────────────────
export const HTTP = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};

// ── Climate Zones (for packing engine) ────────────────────
export const CLIMATE_ZONES = {
  TROPICAL:    ["Bali", "Thailand", "Goa", "Sri Lanka", "Maldives", "Singapore", "Bali"],
  COLD:        ["Iceland", "Norway", "Alaska", "Canada", "Scandinavia", "Antarctica"],
  DESERT:      ["Dubai", "Rajasthan", "Egypt", "Morocco", "Jordan"],
  TEMPERATE:   ["Europe", "Japan", "New Zealand", "Australia"],
  MOUNTAIN:    ["Nepal", "Ladakh", "Switzerland", "Colorado", "Patagonia"],
  MONSOON:     ["India", "Vietnam", "Cambodia", "Myanmar"],
};

export default {
  PAGINATION,
  JWT,
  RATE_LIMIT,
  UPLOAD,
  TRIP_STATUS,
  TRIP_VISIBILITY,
  TRAVEL_MOODS,
  TRAVEL_PERSONALITIES,
  EXPENSE_CATEGORIES,
  ACTIVITY_CATEGORIES,
  PACKING_CATEGORIES,
  BUDGET_BENCHMARKS,
  FATIGUE,
  RECOMMENDATION_WEIGHTS,
  COLLABORATOR_ROLES,
  USER_ROLES,
  HTTP,
  CLIMATE_ZONES,
};
