"use client";

import { motion } from "framer-motion";
import { Plane, Wallet, Globe, TrendingUp } from "lucide-react";
import type { Trip } from "../types";

interface TripStatsProps {
  trips: Trip[];
}

export function TripStats({ trips }: TripStatsProps) {
  const totalBudget  = trips.reduce((s, t) => s + Number(t.budget || 0), 0);
  const totalSpent   = trips.reduce((s, t) => s + Number(t.actual_spent || t.spent_amount || 0), 0);
  const completed    = trips.filter((t) => t.status === "completed").length;
  const ongoing      = trips.filter((t) => t.status === "ongoing").length;

  const stats = [
    { label: "Total Trips",   value: trips.length,              icon: <Plane size={18} />,     color: "#6366f1" },
    { label: "Total Budget",  value: `₹${(totalBudget / 1000).toFixed(0)}K`, icon: <Wallet size={18} />,  color: "#06b6d4" },
    { label: "Completed",     value: completed,                  icon: <Globe size={18} />,     color: "#22c55e" },
    { label: "Ongoing",       value: ongoing,                    icon: <TrendingUp size={18} />, color: "#f59e0b" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}
         className="trip-stats-grid">
      <style>{`@media (max-width: 640px) { .trip-stats-grid { grid-template-columns: repeat(2, 1fr) !important; } }`}</style>
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="stat-card"
          style={{ padding: "16px" }}
        >
          <div style={{ color: stat.color, marginBottom: "8px" }}>{stat.icon}</div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary)" }}>{stat.value}</div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{stat.label}</div>
        </motion.div>
      ))}
    </div>
  );
}
