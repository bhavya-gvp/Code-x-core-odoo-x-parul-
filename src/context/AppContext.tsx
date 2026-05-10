"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { authAPI, tripsAPI, storage } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────
interface AppUser {
  id: string;
  name: string;
  email: string;
  profile_image?: string;
  country?: string;
  bio?: string;
  travel_personality?: string;
  role: string;
  trips_count?: number;
  followers_count?: number;
}

interface Trip {
  id: string;
  title: string;
  coverImage?: string;
  cover_image?: string;
  startDate?: string;
  start_date?: string;
  endDate?: string;
  end_date?: string;
  budget: number;
  spentAmount?: number;
  spent_amount?: number;
  status: string;
  mood?: string;
  visibility?: string;
  cities?: { city_name: string; country: string }[];
}

interface AppState {
  user: AppUser | null;
  isAuthenticated: boolean;
  currentTrip: Trip | null;
  trips: Trip[];
  isDarkMode: boolean;
  isSidebarOpen: boolean;
  activeTab: string;
  isAIAssistantOpen: boolean;
  isLoadingTrips: boolean;
  authError: string | null;
}

interface AppContextType extends AppState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  setActiveTab: (tab: string) => void;
  toggleAIAssistant: () => void;
  setCurrentTrip: (trip: Trip | null) => void;
  addTrip: (trip: Trip) => void;
  refreshTrips: () => Promise<void>;
  clearAuthError: () => void;
}

// ── Context ────────────────────────────────────────────────
const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    user: null,
    isAuthenticated: false,
    currentTrip: null,
    trips: [],
    isDarkMode: true,          // default; overridden by localStorage on mount
    isSidebarOpen: false,
    activeTab: "dashboard",
    isAIAssistantOpen: false,
    isLoadingTrips: false,
    authError: null,
  });

  // ── Restore theme from localStorage on first mount ──────
  useEffect(() => {
    const saved = localStorage.getItem("traveloop_theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved !== null ? saved === "dark" : prefersDark;
    setState((prev) => ({ ...prev, isDarkMode: isDark }));
  }, []);

  // ── Restore session on mount ───────────────────────────
  useEffect(() => {
    const token = storage.getToken();
    const savedUser = storage.getUser();
    if (token && savedUser) {
      setState((prev) => ({ ...prev, user: savedUser, isAuthenticated: true }));
      // Silently re-validate token in background
      authAPI.getProfile()
        .then((res: any) => {
          storage.setUser(res.data);
          setState((prev) => ({ ...prev, user: res.data }));
        })
        .catch(() => {
          storage.clear();
          setState((prev) => ({ ...prev, user: null, isAuthenticated: false }));
        });
    }
  }, []);

  // ── Sync dark mode class + persist to localStorage ──────
  useEffect(() => {
    if (state.isDarkMode) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
    localStorage.setItem("traveloop_theme", state.isDarkMode ? "dark" : "light");
  }, [state.isDarkMode]);

  // ── Load trips after auth ──────────────────────────────
  useEffect(() => {
    if (state.isAuthenticated) {
      refreshTrips();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isAuthenticated]);

  // ── Auth: Login ────────────────────────────────────────
  const login = async (email: string, password: string): Promise<boolean> => {
    setState((prev) => ({ ...prev, authError: null }));
    try {
      const res: any = await authAPI.login({ email, password });
      const { user, token } = res.data;
      storage.setToken(token);
      storage.setUser(user);
      setState((prev) => ({ ...prev, user, isAuthenticated: true, authError: null }));
      return true;
    } catch (err: any) {
      const msg = err?.data?.message || err.message || "Login failed.";
      setState((prev) => ({ ...prev, authError: msg }));
      return false;
    }
  };

  // ── Auth: Register ─────────────────────────────────────
  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    setState((prev) => ({ ...prev, authError: null }));
    try {
      const res: any = await authAPI.register({ name, email, password });
      const { user, token } = res.data;
      storage.setToken(token);
      storage.setUser(user);
      setState((prev) => ({ ...prev, user, isAuthenticated: true, authError: null }));
      return true;
    } catch (err: any) {
      const msg = err?.data?.message || err.message || "Registration failed.";
      setState((prev) => ({ ...prev, authError: msg }));
      return false;
    }
  };

  // ── Auth: Logout ───────────────────────────────────────
  const logout = () => {
    storage.clear();
    setState((prev) => ({
      ...prev,
      user: null,
      isAuthenticated: false,
      trips: [],
      currentTrip: null,
      authError: null,
    }));
  };

  // ── Load Trips ─────────────────────────────────────────
  const refreshTrips = useCallback(async () => {
    if (!storage.getToken()) return;
    setState((prev) => ({ ...prev, isLoadingTrips: true }));
    try {
      const res: any = await tripsAPI.getMyTrips();
      setState((prev) => ({ ...prev, trips: res.data || [], isLoadingTrips: false }));
    } catch {
      setState((prev) => ({ ...prev, isLoadingTrips: false }));
    }
  }, []);

  // ── Helpers ────────────────────────────────────────────
  const toggleDarkMode = () => setState((prev) => ({ ...prev, isDarkMode: !prev.isDarkMode }));
  const toggleSidebar = () => setState((prev) => ({ ...prev, isSidebarOpen: !prev.isSidebarOpen }));
  const setActiveTab = (tab: string) => setState((prev) => ({ ...prev, activeTab: tab }));
  const toggleAIAssistant = () => setState((prev) => ({ ...prev, isAIAssistantOpen: !prev.isAIAssistantOpen }));
  const setCurrentTrip = (trip: Trip | null) => setState((prev) => ({ ...prev, currentTrip: trip }));
  const addTrip = (trip: Trip) => setState((prev) => ({ ...prev, trips: [trip, ...prev.trips] }));
  const clearAuthError = () => setState((prev) => ({ ...prev, authError: null }));

  return (
    <AppContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        toggleDarkMode,
        toggleSidebar,
        setActiveTab,
        toggleAIAssistant,
        setCurrentTrip,
        addTrip,
        refreshTrips,
        clearAuthError,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
