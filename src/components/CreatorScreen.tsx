"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Sparkles, Camera, MapPin, Clock, Star, Zap, Eye, Sun } from "lucide-react";
import { MOCK_DESTINATIONS } from "@/data/mock";

const GOLDEN_HOUR_SPOTS = [
  { name: "Fushimi Inari Gates", city: "Kyoto", time: "5:42 AM", type: "Sunrise", rating: 4.9, drone: true, instagram: "1.2M posts" },
  { name: "Arashiyama Bamboo", city: "Kyoto", time: "6:15 AM", type: "Sunrise", rating: 4.8, drone: false, instagram: "890K posts" },
  { name: "Shibuya Sky Deck", city: "Tokyo", time: "6:42 PM", type: "Sunset", rating: 4.9, drone: false, instagram: "2.1M posts" },
  { name: "Mount Fuji Viewpoint", city: "Fuji", time: "5:12 AM", type: "Sunrise", rating: 5.0, drone: true, instagram: "4.8M posts" },
];

const PHOTO_CATEGORIES = [
  { emoji: "🌅", label: "Golden Hour", count: 48, color: "#f59e0b" },
  { emoji: "📍", label: "Viral Spots", count: 124, color: "#6366f1" },
  { emoji: "🚁", label: "Drone-Friendly", count: 32, color: "#06b6d4" },
  { emoji: "☕", label: "Aesthetic Cafes", count: 89, color: "#a855f7" },
  { emoji: "🌃", label: "Night Photography", count: 56, color: "#1e40af" },
  { emoji: "🏛️", label: "Architecture", count: 71, color: "#22c55e" },
];

const REELS_PLANNER = [
  { day: "Day 1", shots: ["Arrival at Narita — airport shots", "Shibuya crossing transition reel", "Ramen shop ASMR moment"], views: "Est. 50K-200K views" },
  { day: "Day 2", shots: ["Senso-ji temple at dawn", "Street food tour vlog", "Mount Fuji sunset timelapse"], views: "Est. 200K-500K views" },
  { day: "Day 3", shots: ["Arashiyama bamboo solo walk", "Geisha district atmospheric b-roll", "Tea ceremony close-ups"], views: "Est. 100K-400K views" },
];

export function CreatorScreen() {
  const [activeTab, setActiveTab] = useState("spots");

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }} className="page-enter">
      {/* Hero */}
      <div style={{ borderRadius: "20px", padding: "32px", background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)", position: "relative", overflow: "hidden", marginBottom: "28px" }}>
        <div className="blob blob-1" style={{ width: "300px", height: "300px", top: "-80px", right: "0", opacity: 0.2 }} />
        <div className="blob blob-3" style={{ width: "200px", height: "200px", bottom: "-60px", left: "20%", opacity: 0.15 }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "5px 14px", borderRadius: "20px", background: "rgba(168,85,247,0.3)", border: "1px solid rgba(168,85,247,0.4)", marginBottom: "14px" }}>
            <Camera size={12} color="#a855f7" />
            <span style={{ fontSize: "11px", color: "#d8b4fe", fontWeight: 700 }}>CREATOR MODE</span>
          </div>
          <h1 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 900, color: "white", marginBottom: "10px" }}>
            Build <span style={{ background: "linear-gradient(90deg, #a855f7, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Viral Content</span><br />
            Plan <span style={{ background: "linear-gradient(90deg, #f59e0b, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Golden Moments</span>
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "14px" }}>AI-powered content planning for travel creators</p>
        </div>
      </div>

      {/* Photo categories */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px", marginBottom: "28px" }}>
        {PHOTO_CATEGORIES.map((cat, i) => (
          <motion.div
            key={cat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.07 }}
            whileHover={{ scale: 1.04, y: -2 }}
            style={{ padding: "18px 14px", borderRadius: "16px", background: "var(--bg-card)", border: "1px solid var(--border)", cursor: "pointer", textAlign: "center" }}
          >
            <div style={{ fontSize: "28px", marginBottom: "6px" }}>{cat.emoji}</div>
            <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-primary)", marginBottom: "2px" }}>{cat.label}</div>
            <div style={{ fontSize: "11px", color: cat.color, fontWeight: 600 }}>{cat.count} spots</div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", padding: "4px", background: "var(--bg-secondary)", borderRadius: "12px", marginBottom: "24px" }}>
        {["spots", "golden-hour", "reels"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "13px", background: activeTab === tab ? "var(--brand-gradient)" : "transparent", color: activeTab === tab ? "white" : "var(--text-secondary)", transition: "all 0.2s" }}>
            {tab === "spots" ? "📍 Viral Spots" : tab === "golden-hour" ? "🌅 Golden Hour" : "🎬 Reels Planner"}
          </button>
        ))}
      </div>

      {activeTab === "spots" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
          {MOCK_DESTINATIONS.map((dest, i) => (
            <motion.div
              key={dest.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="destination-card"
              style={{ height: "220px" }}
            >
              <img src={dest.image} alt={dest.name} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)" }} />
              <div style={{ position: "absolute", top: "10px", right: "10px", display: "flex", gap: "4px", flexDirection: "column" }}>
                <span className="badge" style={{ background: "rgba(168,85,247,0.85)", color: "white", fontSize: "9px" }}>
                  <Eye size={8} style={{ display: "inline", verticalAlign: "middle" }} /> {dest.popularityScore}K
                </span>
              </div>
              <div style={{ position: "absolute", bottom: "12px", left: "12px", right: "12px" }}>
                <div style={{ fontWeight: 700, color: "white", fontSize: "16px" }}>{dest.name}</div>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px", display: "flex", gap: "8px", marginTop: "4px" }}>
                  <span><Star size={10} fill="gold" color="gold" style={{ display: "inline", verticalAlign: "middle" }} /> {dest.rating}</span>
                  <span><MapPin size={10} style={{ display: "inline", verticalAlign: "middle" }} /> {dest.country}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === "golden-hour" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {GOLDEN_HOUR_SPOTS.map((spot, i) => (
            <motion.div
              key={spot.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card"
              style={{ padding: "20px" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: spot.type === "Sunrise" ? "linear-gradient(135deg, #f59e0b, #ec4899)" : "linear-gradient(135deg, #f97316, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Sun size={24} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <h3 style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)" }}>{spot.name}</h3>
                    {spot.drone && <span className="badge badge-primary" style={{ fontSize: "9px" }}>🚁 Drone OK</span>}
                  </div>
                  <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "3px" }}>
                      <MapPin size={11} /> {spot.city}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "3px" }}>
                      <Clock size={11} /> {spot.time} — {spot.type}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>📸 {spot.instagram}</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "gold" }}>
                  <Star size={14} fill="gold" />
                  <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)" }}>{spot.rating}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === "reels" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {REELS_PLANNER.map((day, i) => (
            <motion.div
              key={day.day}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card"
              style={{ padding: "20px" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                <div style={{ padding: "6px 14px", borderRadius: "20px", background: "var(--brand-gradient)", color: "white", fontSize: "13px", fontWeight: 700 }}>
                  {day.day}
                </div>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: "12px", color: "#a855f7", fontWeight: 600 }}>
                  <Zap size={11} style={{ display: "inline", verticalAlign: "middle" }} /> {day.views}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {day.shots.map((shot, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "10px", background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
                    <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--brand-gradient)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{j + 1}</span>
                    <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>{shot}</span>
                    <button style={{ marginLeft: "auto", background: "none", border: "1px solid var(--border)", borderRadius: "8px", padding: "3px 10px", color: "var(--text-secondary)", cursor: "pointer", fontSize: "11px" }}>Add</button>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
