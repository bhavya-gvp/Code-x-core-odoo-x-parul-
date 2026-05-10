"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Plus, Calendar, MapPin, Clock, Wallet, Star, ChevronDown, ChevronUp, Sparkles, GripVertical, Map } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { MapView } from "./MapView";
import { itineraryAPI } from "@/lib/api";

interface ItineraryActivity {
  id: string;
  time: string;
  name: string;
  type: string;
  duration: string;
  cost: number;
  rating?: number;
  notes?: string;
  emoji: string;
}

interface Day {
  id: string;
  day: number;
  date: string;
  city: string;
  activities: ItineraryActivity[];
  expanded: boolean;
}

const INITIAL_DAYS: Day[] = [
  {
    id: "d1", day: 1, date: "2024-04-01", city: "Tokyo", expanded: true,
    activities: [
      { id: "a1", time: "09:00", name: "Senso-ji Temple", type: "Cultural", duration: "2h", cost: 0, rating: 4.9, emoji: "⛩️" },
      { id: "a2", time: "12:00", name: "Nakamise Shopping Street", type: "Shopping", duration: "1h", cost: 3000, rating: 4.6, emoji: "🛍️" },
      { id: "a3", time: "14:00", name: "teamLab Planets", type: "Art", duration: "3h", cost: 4500, rating: 5.0, emoji: "🎨" },
      { id: "a4", time: "18:30", name: "Shibuya Crossing & Scramble", type: "Sightseeing", duration: "1h", cost: 0, rating: 4.8, emoji: "🚶" },
      { id: "a5", time: "20:00", name: "Ramen at Ichiran", type: "Food", duration: "1.5h", cost: 1500, rating: 4.9, emoji: "🍜" },
    ],
  },
  {
    id: "d2", day: 2, date: "2024-04-02", city: "Tokyo", expanded: false,
    activities: [
      { id: "a6", time: "06:30", name: "Tsukiji Outer Market", type: "Food", duration: "2h", cost: 2000, rating: 4.7, emoji: "🐟" },
      { id: "a7", time: "10:00", name: "Meiji Shrine & Yoyogi Park", type: "Nature", duration: "2h", cost: 0, rating: 4.8, emoji: "🌳" },
      { id: "a8", time: "14:00", name: "Harajuku Takeshita Street", type: "Shopping", duration: "2h", cost: 5000, rating: 4.5, emoji: "🛍️" },
      { id: "a9", time: "18:00", name: "Shibuya Sky Observation", type: "Sightseeing", duration: "2h", cost: 3500, rating: 5.0, emoji: "🏙️" },
    ],
  },
  {
    id: "d3", day: 3, date: "2024-04-03", city: "Kyoto (Day Trip)", expanded: false,
    activities: [
      { id: "a10", time: "05:30", name: "Arashiyama Bamboo Grove", type: "Nature", duration: "2h", cost: 0, rating: 4.9, emoji: "🎋" },
      { id: "a11", time: "09:00", name: "Fushimi Inari Gates", type: "Cultural", duration: "3h", cost: 0, rating: 5.0, emoji: "⛩️" },
      { id: "a12", time: "14:00", name: "Gion District Walk", type: "Cultural", duration: "2h", cost: 0, rating: 4.8, emoji: "🏯" },
      { id: "a13", time: "18:00", name: "Tea Ceremony Experience", type: "Cultural", duration: "1.5h", cost: 2500, rating: 4.9, emoji: "🍵" },
    ],
  },
];

const TYPE_COLORS: Record<string, string> = {
  Cultural: "#a855f7",
  Food: "#f59e0b",
  Shopping: "#06b6d4",
  Art: "#ec4899",
  Sightseeing: "#6366f1",
  Nature: "#22c55e",
  Transport: "#94a3b8",
};

export function ItineraryBuilder() {
  const [days, setDays] = useState<Day[]>(INITIAL_DAYS);
  const [aiOptimizing, setAiOptimizing] = useState(false);
  const [view, setView] = useState<"timeline" | "calendar" | "map">("timeline");
  const [showMap, setShowMap] = useState(false);

  const toggleDay = (id: string) => {
    setDays((prev) => prev.map((d) => d.id === id ? { ...d, expanded: !d.expanded } : d));
  };

  const aiOptimize = async () => {
    setAiOptimizing(true);
    await new Promise((r) => setTimeout(r, 2000));
    setAiOptimizing(false);
  };

  const totalCost = days.flatMap((d) => d.activities).reduce((s, a) => s + a.cost, 0);
  const totalActivities = days.flatMap((d) => d.activities).length;

  // Extract map markers from activities
  const ACTIVITY_COORDS: Record<string, { lat: number; lng: number }> = {
    "Senso-ji Temple": { lat: 35.7148, lng: 139.7967 },
    "Nakamise Shopping Street": { lat: 35.7120, lng: 139.7967 },
    "teamLab Planets": { lat: 35.6695, lng: 139.7854 },
    "Shibuya Crossing & Scramble": { lat: 35.6595, lng: 139.7005 },
    "Ramen at Ichiran": { lat: 35.6938, lng: 139.7034 },
    "Tsukiji Outer Market": { lat: 35.6654, lng: 139.7707 },
    "Meiji Shrine & Yoyogi Park": { lat: 35.6763, lng: 139.6993 },
    "Harajuku Takeshita Street": { lat: 35.6702, lng: 139.7026 },
    "Shibuya Sky Observation": { lat: 35.6584, lng: 139.7016 },
    "Arashiyama Bamboo Grove": { lat: 35.0170, lng: 135.6724 },
    "Fushimi Inari Gates": { lat: 34.9671, lng: 135.7727 },
    "Gion District Walk": { lat: 35.0038, lng: 135.7753 },
    "Tea Ceremony Experience": { lat: 35.0116, lng: 135.7681 },
  };
  const mapMarkers = days.flatMap((day) =>
    day.activities.map((act) => ({
      lat: ACTIVITY_COORDS[act.name]?.lat ?? 35.6762 + (Math.random() - 0.5) * 0.05,
      lng: ACTIVITY_COORDS[act.name]?.lng ?? 139.6503 + (Math.random() - 0.5) * 0.05,
      label: act.name,
      type: act.type,
      emoji: act.emoji,
      time: act.time,
    }))
  );

  return (
    <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }} className="page-enter">
      {/* Header */}
      <div style={{ marginBottom: "24px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 900, color: "var(--text-primary)", marginBottom: "4px" }}>
            🗺️ <span className="gradient-text">Japan Cherry Blossom Trail</span>
          </h1>
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "13px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
              <Calendar size={13} /> Apr 1 – Apr 10, 2024
            </span>
            <span style={{ fontSize: "13px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
              <MapPin size={13} /> Tokyo · Kyoto · Osaka
            </span>
            <span style={{ fontSize: "13px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
              <Wallet size={13} /> {formatCurrency(200000)} budget
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={aiOptimize}
            disabled={aiOptimizing}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 18px", borderRadius: "12px", background: "var(--brand-gradient-vivid)", color: "white", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}
          >
            {aiOptimizing ? (
              <>
                <div style={{ width: "14px", height: "14px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", animation: "spin 0.7s linear infinite" }} />
                Optimizing...
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </>
            ) : (
              <><Sparkles size={14} /> AI Optimize</>
            )}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowMap((s) => !s)}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 18px", borderRadius: "12px", background: showMap ? "rgba(99,102,241,0.15)" : "var(--bg-card)", color: showMap ? "var(--brand-primary)" : "var(--text-secondary)", border: `1px solid ${showMap ? "rgba(99,102,241,0.4)" : "var(--border)"}`, cursor: "pointer", fontSize: "13px", fontWeight: 600 }}
          >
            <Map size={14} /> {showMap ? "Hide Map" : "Show Map"}
          </motion.button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Days", value: days.length, icon: "📅" },
          { label: "Activities", value: totalActivities, icon: "🎯" },
          { label: "Est. Cost", value: formatCurrency(totalCost), icon: "💰" },
          { label: "Cities", value: 3, icon: "🏙️" },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: "14px", textAlign: "center" }}>
            <div style={{ fontSize: "20px", marginBottom: "4px" }}>{s.icon}</div>
            <div style={{ fontWeight: 800, fontSize: "18px", color: "var(--text-primary)" }}>{s.value}</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Live Map Panel */}
      <AnimatePresence>
        {showMap && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid var(--border)", marginBottom: "4px" }}>
              <div style={{ padding: "12px 16px", background: "var(--bg-card)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Map size={15} color="var(--brand-primary)" />
                  <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)" }}>Route Map</span>
                  <span className="badge badge-primary" style={{ fontSize: "10px" }}>{mapMarkers.length} stops</span>
                </div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>All activities plotted</span>
              </div>
              <MapView markers={mapMarkers} height="360px" showRoute={true} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View toggle */}
      <div style={{ display: "flex", gap: "4px", padding: "4px", background: "var(--bg-secondary)", borderRadius: "12px", marginBottom: "24px", maxWidth: "300px" }}>
        {(["timeline", "calendar"] as const).map((v) => (
          <button key={v} onClick={() => setView(v)} style={{ flex: 1, padding: "7px 12px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "13px", background: view === v ? "var(--brand-gradient)" : "transparent", color: view === v ? "white" : "var(--text-secondary)", transition: "all 0.2s", textTransform: "capitalize" }}>
            {v === "timeline" ? "📋 Timeline" : "📅 Calendar"}
          </button>
        ))}
      </div>

      {/* Days */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {days.map((day, di) => (
          <motion.div key={day.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: di * 0.08 }}>
            {/* Day header */}
            <div
              onClick={() => toggleDay(day.id)}
              style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px 20px", borderRadius: "14px", background: "var(--bg-card)", border: "1px solid var(--border)", cursor: "pointer", transition: "all 0.2s" }}
            >
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "var(--brand-gradient)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "15px", flexShrink: 0 }}>
                {day.day}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)" }}>Day {day.day} — {day.city}</div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{day.date} · {day.activities.length} activities · {formatCurrency(day.activities.reduce((s, a) => s + a.cost, 0))}</div>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {day.activities.slice(0, 3).map((a) => (
                  <span key={a.id} style={{ fontSize: "18px" }}>{a.emoji}</span>
                ))}
                {day.expanded ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
              </div>
            </div>

            {/* Activities */}
            <AnimatePresence>
              {day.expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: "hidden" }}
                >
                  <div style={{ paddingLeft: "20px", paddingTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {day.activities.map((activity, ai) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: ai * 0.05 }}
                        style={{ display: "flex", gap: "14px", padding: "14px 16px", borderRadius: "12px", background: "var(--bg-primary)", border: "1px solid var(--border)", position: "relative" }}
                      >
                        {/* Timeline line */}
                        {ai < day.activities.length - 1 && (
                          <div style={{ position: "absolute", left: "34px", top: "52px", bottom: "-16px", width: "2px", background: "linear-gradient(to bottom, var(--brand-primary), transparent)" }} />
                        )}

                        <GripVertical size={16} color="var(--text-muted)" style={{ marginTop: "2px", cursor: "grab", flexShrink: 0 }} />

                        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `${TYPE_COLORS[activity.type] || "#6366f1"}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
                          {activity.emoji}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "4px" }}>
                            <h4 style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)" }}>{activity.name}</h4>
                            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexShrink: 0 }}>
                              {activity.rating && (
                                <span style={{ display: "flex", alignItems: "center", gap: "2px", fontSize: "12px", fontWeight: 600 }}>
                                  <Star size={11} fill="gold" color="gold" /> {activity.rating}
                                </span>
                              )}
                              <span style={{ fontWeight: 700, fontSize: "13px", color: activity.cost === 0 ? "#22c55e" : "var(--text-primary)" }}>
                                {activity.cost === 0 ? "Free" : formatCurrency(activity.cost)}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "3px" }}>
                              <Clock size={10} /> {activity.time} · {activity.duration}
                            </span>
                            <span className="badge" style={{ background: `${TYPE_COLORS[activity.type] || "#6366f1"}18`, color: TYPE_COLORS[activity.type] || "#6366f1", borderColor: `${TYPE_COLORS[activity.type] || "#6366f1"}25`, fontSize: "10px", padding: "2px 8px" }}>
                              {activity.type}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {/* Add activity */}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 16px", borderRadius: "12px", border: "2px dashed var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: "13px", marginBottom: "8px" }}
                    >
                      <Plus size={16} /> Add Activity or Place
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {/* Add day */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "20px", borderRadius: "14px", border: "2px dashed var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: "14px", fontWeight: 500 }}
          onClick={() => setDays((prev) => [...prev, {
            id: Date.now().toString(),
            day: prev.length + 1,
            date: `2024-04-0${prev.length + 1}`,
            city: "New City",
            activities: [],
            expanded: true,
          }])}
        >
          <Plus size={18} /> Add New Day
        </motion.button>
      </div>
    </div>
  );
}
