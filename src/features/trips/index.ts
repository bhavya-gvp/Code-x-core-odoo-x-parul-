/**
 * features/trips/index.ts — Trips feature public API
 * Re-exports everything consumers need from this feature module
 */

export { TripCard } from "./components/TripCard";
export { TripStats } from "./components/TripStats";
export { useTrips } from "@/hooks/useTrips";
export type { Trip } from "./types";
