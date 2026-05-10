/**
 * useTrips — Custom hook for trip management
 *
 * Encapsulates all trip-related state and API calls.
 * Components only need to call this hook — no direct API imports.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { tripsAPI } from "@/lib/api";
import { PAGINATION } from "@/lib/constants";

interface Trip {
  id: string;
  title: string;
  description?: string;
  cover_image?: string;
  start_date: string;
  end_date: string;
  budget: number;
  spent_amount?: number;
  actual_spent?: number;
  mood?: string;
  travel_type?: string;
  status: string;
  visibility: string;
  cities?: any[];
  collaborator_count?: number;
  budget_summary?: any;
  created_at: string;
}

interface UseTripsOptions {
  status?: string;
  autoFetch?: boolean;
}

interface UseTripsReturn {
  trips: Trip[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  hasMore: boolean;
  fetchTrips: () => Promise<void>;
  loadMore: () => void;
  createTrip: (data: Record<string, any>) => Promise<Trip | null>;
  updateTrip: (id: string, data: Record<string, any>) => Promise<Trip | null>;
  deleteTrip: (id: string) => Promise<boolean>;
  refreshTrips: () => void;
}

export function useTrips({ status, autoFetch = true }: UseTripsOptions = {}): UseTripsReturn {
  const [trips, setTrips]     = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const [refresh, setRefresh] = useState(0);

  const limit = PAGINATION.TRIPS_PER_PAGE;

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await tripsAPI.getMyTrips({ status, page, limit } as any);
      const data = res.data;
      setTrips(page === 1 ? (data.data || []) : (prev) => [...prev, ...(data.data || [])]);
      setTotal(data.meta?.pagination?.total || data.count || 0);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to load trips.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [status, page, refresh]);

  useEffect(() => {
    if (autoFetch) fetchTrips();
  }, [fetchTrips, autoFetch]);

  const loadMore = useCallback(() => {
    if (!loading && trips.length < total) {
      setPage((p) => p + 1);
    }
  }, [loading, trips.length, total]);

  const createTrip = useCallback(async (data: Record<string, any>): Promise<Trip | null> => {
    try {
      const res: any = await tripsAPI.createTrip(data as any);
      const newTrip: Trip = res.data?.data;
      setTrips((prev) => [newTrip, ...prev]);
      setTotal((t) => t + 1);
      return newTrip;
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create trip.");
      return null;
    }
  }, []);

  const updateTrip = useCallback(async (id: string, data: Record<string, any>): Promise<Trip | null> => {
    try {
      const res: any = await tripsAPI.updateTrip(id, data);
      const updated: Trip = res.data?.data;
      setTrips((prev) => prev.map((t) => (t.id === id ? updated : t)));
      return updated;
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update trip.");
      return null;
    }
  }, []);

  const deleteTrip = useCallback(async (id: string): Promise<boolean> => {
    try {
      await tripsAPI.deleteTrip(id);
      setTrips((prev) => prev.filter((t) => t.id !== id));
      setTotal((t) => Math.max(t - 1, 0));
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete trip.");
      return false;
    }
  }, []);

  const refreshTrips = useCallback(() => {
    setPage(1);
    setRefresh((r) => r + 1);
  }, []);

  return {
    trips,
    loading,
    error,
    total,
    page,
    hasMore: trips.length < total,
    fetchTrips,
    loadMore,
    createTrip,
    updateTrip,
    deleteTrip,
    refreshTrips,
  };
}

export default useTrips;
