"use client";

import { motion } from "framer-motion";
import { Calendar, Wallet, MapPin, Users } from "lucide-react";
import type { Trip } from "../types";
import { STATUS_META, CATEGORY_META } from "@/lib/constants";

interface TripCardProps {
  trip: Trip;
  onClick?: (trip: Trip) => void;
  compact?: boolean;
}

export function TripCard({ trip, onClick, compact = false }: TripCardProps) {
  const spentAmount = trip.actual_spent ?? trip.spent_amount ?? 0;
  const progress    = trip.budget > 0 ? Math.min(100, Math.round((spentAmount / trip.budget) * 100)) : 0;
  const status      = STATUS_META[trip.status] || STATUS_META.planning;
  const duration    = Math.ceil(
    (new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onClick?.(trip)}
      style={{
        borderRadius: "20px",
        overflow: "hidden",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        cursor: onClick ? "pointer" : "default",
        position: "relative",
        transition: "box-shadow 0.2s",
      }}
    >
      {/* Cover image */}
      <div style={{ position: "relative", height: compact ? "140px" : "180px", overflow: "hidden" }}>
        {trip.cover_image ? (
          <img
            src={trip.cover_image}
            alt={trip.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            background: "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "48px",
          }}>
            {trip.mood === "Adventure Rush" ? "⚡" : trip.mood === "Relax" ? "🌴" : "✈️"}
          </div>
        )}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)",
        }} />

        {/* Status badge */}
        <div style={{
          position: "absolute", top: "12px", right: "12px",
          padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
          background: `${status.color}22`,
          color: status.color,
          border: `1px solid ${status.color}44`,
          backdropFilter: "blur(8px)",
        }}>
          {status.label}
        </div>

        {/* Collaborator count */}
        {(trip.collaborator_count ?? 0) > 0 && (
          <div style={{
            position: "absolute", top: "12px", left: "12px",
            display: "flex", alignItems: "center", gap: "4px",
            padding: "4px 8px", borderRadius: "20px", fontSize: "11px",
            background: "rgba(0,0,0,0.5)", color: "white",
            backdropFilter: "blur(8px)",
          }}>
            <Users size={11} /> {trip.collaborator_count}
          </div>
        )}

        {/* Trip title over image */}
        <div style={{ position: "absolute", bottom: "12px", left: "14px", right: "14px" }}>
          <div style={{ fontWeight: 800, color: "white", fontSize: compact ? "14px" : "16px", lineHeight: 1.2 }}>
            {trip.title}
          </div>
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: "16px" }}>
        {/* Dates + duration */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
          <Calendar size={13} color="var(--text-muted)" />
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            {new Date(trip.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            {" → "}
            {new Date(trip.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          <span style={{
            marginLeft: "auto", fontSize: "11px", fontWeight: 600,
            background: "var(--bg-primary)", padding: "2px 8px",
            borderRadius: "10px", color: "var(--text-secondary)",
          }}>
            {duration}d
          </span>
        </div>

        {/* Budget progress */}
        <div style={{ marginBottom: compact ? "0" : "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Wallet size={12} color="var(--text-muted)" />
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Budget</span>
            </div>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>
              ₹{Number(trip.budget).toLocaleString("en-IN")}
            </span>
          </div>
          <div style={{
            height: "5px", borderRadius: "10px",
            background: "var(--bg-primary)", overflow: "hidden",
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{
                height: "100%", borderRadius: "10px",
                background: progress > 90 ? "#ef4444" : progress > 70 ? "#f59e0b" : "#22c55e",
              }}
            />
          </div>
          {spentAmount > 0 && (
            <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px", textAlign: "right" }}>
              ₹{Number(spentAmount).toLocaleString("en-IN")} spent ({progress}%)
            </div>
          )}
        </div>

        {/* Cities */}
        {!compact && trip.cities && trip.cities.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
            <MapPin size={12} color="var(--brand-primary)" />
            {trip.cities.slice(0, 3).map((c: any, i: number) => (
              <span key={i} style={{
                fontSize: "11px", color: "var(--brand-primary)",
                background: "rgba(99,102,241,0.1)", padding: "2px 8px",
                borderRadius: "10px", fontWeight: 600,
              }}>
                {c.city_name || c.cityName}
              </span>
            ))}
            {trip.cities.length > 3 && (
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>+{trip.cities.length - 3} more</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
