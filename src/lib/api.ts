/**
 * Traveloop AI — Axios API Client
 * Centralized HTTP client with JWT token injection and error handling
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Token storage helpers
const TOKEN_KEY = "traveloop_token";
const USER_KEY = "traveloop_user";

export const storage = {
  getToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),

  getUser: () => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },
  setUser: (user: object) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  removeUser: () => localStorage.removeItem(USER_KEY),

  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

// ============================================================
// Core fetch wrapper with auth headers
// ============================================================
interface RequestOptions {
  method?: string;
  body?: object | FormData;
  params?: Record<string, string | number | boolean>;
  isFormData?: boolean;
}

interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
  count?: number;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<APIResponse<T>> {
  const { method = "GET", body, params, isFormData = false } = options;

  // Build URL with query params
  let url = `${API_BASE}${endpoint}`;
  if (params) {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))
    );
    url += `?${qs.toString()}`;
  }

  // Build headers
  const headers: HeadersInit = {};
  const token = storage.getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isFormData) headers["Content-Type"] = "application/json";

  const config: RequestInit = { method, headers };
  if (body) config.body = isFormData ? (body as FormData) : JSON.stringify(body);

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || `Request failed: ${response.status}`);
    (error as Error & { status: number; data: typeof data }).status = response.status;
    (error as Error & { status: number; data: typeof data }).data = data;
    throw error;
  }

  return data;
}

// ============================================================
// Auth API
// ============================================================
export const authAPI = {
  register: (data: { name: string; email: string; password: string; country?: string }) =>
    request("/auth/register", { method: "POST", body: data }),

  login: (data: { email: string; password: string }) =>
    request("/auth/login", { method: "POST", body: data }),

  getProfile: () => request("/auth/profile"),

  updateProfile: (data: FormData) =>
    request("/auth/profile", { method: "PUT", body: data, isFormData: true }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request("/auth/change-password", { method: "PUT", body: data }),
};

// ============================================================
// Trips API
// ============================================================
export const tripsAPI = {
  getMyTrips: (params?: { status?: string; page?: number; limit?: number }) =>
    request("/trips", { params }),

  getPublicTrips: (params?: { mood?: string; page?: number; limit?: number }) =>
    request("/trips/public", { params }),

  createTrip: (data: FormData) =>
    request("/trips", { method: "POST", body: data, isFormData: true }),

  getTripById: (id: string) => request(`/trips/${id}`),

  updateTrip: (id: string, data: object) =>
    request(`/trips/${id}`, { method: "PUT", body: data }),

  deleteTrip: (id: string) => request(`/trips/${id}`, { method: "DELETE" }),

  getTripBudget: (id: string) => request(`/trips/${id}/budget`),
};

// ============================================================
// Itinerary API
// ============================================================
export const itineraryAPI = {
  getItinerary: (tripId: string) => request(`/itinerary/${tripId}`),
  addDay: (data: object) => request("/itinerary", { method: "POST", body: data }),
  updateDay: (id: string, data: object) => request(`/itinerary/days/${id}`, { method: "PUT", body: data }),
  deleteDay: (id: string) => request(`/itinerary/days/${id}`, { method: "DELETE" }),
  generateAI: (tripId: string) => request(`/itinerary/${tripId}/generate`, { method: "POST" }),
  getActivities: (dayId: string) => request(`/itinerary/activities/day/${dayId}`),
  addActivity: (data: object) => request("/itinerary/activities", { method: "POST", body: data }),
  updateActivity: (id: string, data: object) => request(`/itinerary/activities/${id}`, { method: "PUT", body: data }),
  deleteActivity: (id: string) => request(`/itinerary/activities/${id}`, { method: "DELETE" }),
  reorderActivities: (data: { day_id: string; ordered_ids: string[] }) =>
    request("/itinerary/activities/reorder", { method: "POST", body: data }),
};

// ============================================================
// Budget & Expenses API
// ============================================================
export const budgetAPI = {
  getExpenses: (tripId: string, params?: { category?: string; page?: number }) =>
    request(`/budget/expenses/${tripId}`, { params }),
  addExpense: (data: object) => request("/budget/expenses", { method: "POST", body: data }),
  deleteExpense: (id: string) => request(`/budget/expenses/${id}`, { method: "DELETE" }),
  getAIOptimization: (tripId: string) => request(`/budget/optimize/${tripId}`),
  getBudgetTemplate: (params: { destination: string; days: number; style?: string }) =>
    request("/budget/template", { params }),
  getPackingList: (tripId: string) => request(`/budget/packing/${tripId}`),
  addPackingItem: (data: object) => request("/budget/packing", { method: "POST", body: data }),
  bulkAddPacking: (data: { trip_id: string; items: object[] }) =>
    request("/budget/packing/bulk", { method: "POST", body: data }),
  togglePacked: (id: string, tripId: string) =>
    request(`/budget/packing/${tripId}/${id}/toggle`, { method: "PUT" }),
  deletePackingItem: (id: string, tripId: string) =>
    request(`/budget/packing/${tripId}/${id}`, { method: "DELETE" }),
};

// ============================================================
// Journals & Community API
// ============================================================
export const journalsAPI = {
  getJournals: (tripId: string) => request(`/journals/trip/${tripId}`),
  searchJournals: (q: string) => request("/journals/search", { params: { q } }),
  createJournal: (data: FormData) =>
    request("/journals", { method: "POST", body: data, isFormData: true }),
  updateJournal: (id: string, data: object) => request(`/journals/${id}`, { method: "PUT", body: data }),
  deleteJournal: (id: string) => request(`/journals/${id}`, { method: "DELETE" }),
};

export const communityAPI = {
  getFeed: (params?: { page?: number; limit?: number }) =>
    request("/journals/community", { params }),
  createPost: (data: FormData) =>
    request("/journals/community", { method: "POST", body: data, isFormData: true }),
  likePost: (id: string) => request(`/journals/community/${id}/like`, { method: "POST" }),
  deletePost: (id: string) => request(`/journals/community/${id}`, { method: "DELETE" }),
};

// ============================================================
// AI API
// ============================================================
export const aiAPI = {
  analyzePersonality: (answers: object) =>
    request("/ai/personality", { method: "POST", body: { answers } }),
  generateItinerary: (data: object) =>
    request("/ai/generate-itinerary", { method: "POST", body: data }),
  chat: (message: string, context?: object) =>
    request("/ai/chat", { method: "POST", body: { message, context } }),
  getRecommendations: (params: { destination?: string; mood?: string; budget?: number }) =>
    request("/ai/recommendations", { params }),
  getPackingSuggestions: (params: { destination?: string; duration?: string }) =>
    request("/ai/packing-suggestions", { params }),
};

// ============================================================
// Weather API
// ============================================================
export const weatherAPI = {
  getCurrent: (city: string, country?: string) =>
    request(`/ai/weather/${city}`, { params: country ? { country } : undefined }),
  getForecast: (city: string) => request(`/ai/weather/${city}/forecast`),
  getBestMonths: (city: string) => request(`/ai/weather/${city}/best-months`),
};

// ============================================================
// Admin API
// ============================================================
export const adminAPI = {
  getStats: () => request("/admin/stats"),
};
