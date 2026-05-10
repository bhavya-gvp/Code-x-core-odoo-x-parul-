/**
 * Frontend constants — single source of truth
 * Import from here instead of hardcoding values in components
 */

// ── API ────────────────────────────────────────────────────
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// ── Pagination ─────────────────────────────────────────────
export const PAGINATION = {
  TRIPS_PER_PAGE:     20,
  COMMUNITY_PER_PAGE: 12,
  EXPENSES_PER_PAGE:  50,
} as const;

// ── Retry ──────────────────────────────────────────────────
export const RETRY = {
  MAX_ATTEMPTS: 3,
  BASE_DELAY_MS: 500,
} as const;

// ── Expense categories ─────────────────────────────────────
export const EXPENSE_CATEGORIES = [
  "Flights", "Hotels", "Food", "Transport",
  "Activities", "Shopping", "Visa", "Insurance", "Other",
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

// ── Category metadata ──────────────────────────────────────
export const CATEGORY_META: Record<string, { emoji: string; color: string }> = {
  Flights:    { emoji: "✈️",  color: "#6366f1" },
  Hotels:     { emoji: "🏨",  color: "#06b6d4" },
  Food:       { emoji: "🍜",  color: "#a855f7" },
  Transport:  { emoji: "🚇",  color: "#f59e0b" },
  Activities: { emoji: "🎭",  color: "#ef4444" },
  Shopping:   { emoji: "🛍️",  color: "#22c55e" },
  Visa:       { emoji: "📋",  color: "#64748b" },
  Insurance:  { emoji: "🛡️",  color: "#0ea5e9" },
  Other:      { emoji: "💳",  color: "#94a3b8" },
};

// ── Trip status ────────────────────────────────────────────
export const TRIP_STATUS = {
  PLANNING:  "planning",
  UPCOMING:  "upcoming",
  ONGOING:   "ongoing",
  COMPLETED: "completed",
} as const;

export const STATUS_META: Record<string, { label: string; color: string }> = {
  planning:  { label: "Planning",  color: "#f59e0b" },
  upcoming:  { label: "Upcoming",  color: "#6366f1" },
  ongoing:   { label: "Ongoing",   color: "#06b6d4" },
  completed: { label: "Completed", color: "#22c55e" },
};

// ── Travel moods ───────────────────────────────────────────
export const TRAVEL_MOODS = [
  { label: "Relax",            emoji: "🌴" },
  { label: "Burnout Recovery", emoji: "🧘" },
  { label: "Romantic Escape",  emoji: "💑" },
  { label: "Social Trip",      emoji: "🎉" },
  { label: "Adventure Rush",   emoji: "⚡" },
  { label: "Nature Detox",     emoji: "🌿" },
] as const;

// ── Personality types ──────────────────────────────────────
export const TRAVEL_PERSONALITIES = [
  "Backpacker",
  "Luxury Explorer",
  "Creator Traveler",
  "Solo Explorer",
  "Adventure Seeker",
  "Romantic Planner",
  "Spiritual Traveler",
] as const;

// ── Fatigue levels ─────────────────────────────────────────
export const FATIGUE_COLORS: Record<string, string> = {
  Low:      "#22c55e",
  Moderate: "#f59e0b",
  High:     "#ef4444",
  Extreme:  "#dc2626",
};

// ── Budget health labels ───────────────────────────────────
export const HEALTH_COLORS: Record<string, string> = {
  Excellent:        "#22c55e",
  Good:             "#06b6d4",
  "Needs Attention": "#f59e0b",
  Critical:         "#ef4444",
};

// ── Local storage keys ─────────────────────────────────────
export const STORAGE_KEYS = {
  TOKEN:     "traveloop_token",
  USER:      "traveloop_user",
  THEME:     "traveloop_theme",
} as const;

// ── Routes ────────────────────────────────────────────────
export const ROUTES = {
  HOME:      "/",
  TRIPS:     "/trips",
  NEW_TRIP:  "/trips/new",
  ITINERARY: "/itinerary",
  BUDGET:    "/budget",
  COMMUNITY: "/community",
  JOURNAL:   "/journal",
  PACKING:   "/packing",
  CREATOR:   "/creator",
  PROFILE:   "/profile",
  ADMIN:     "/admin",
  DISCOVER:  "/discover",
  SAFETY:    "/safety",
} as const;

// ── Debounce delays ────────────────────────────────────────
export const DEBOUNCE_MS = {
  SEARCH:   400,
  AUTOSAVE: 1500,
} as const;
