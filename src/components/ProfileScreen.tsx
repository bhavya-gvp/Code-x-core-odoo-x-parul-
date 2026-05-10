"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { MapPin, Globe, Users, Camera, Star, Edit2, Settings, Award, TrendingUp } from "lucide-react";
import { MOCK_USER, MOCK_TRIPS, PERSONALITY_TYPES } from "@/data/mock";
import { formatCurrency } from "@/lib/utils";

export function ProfileScreen() {
  const [activeTab, setActiveTab] = useState("trips");
  const personality = PERSONALITY_TYPES.find((p) => p.id === "creator");

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }} className="page-enter">
      {/* Cover + Avatar */}
      <div style={{ position: "relative", height: "200px", background: "linear-gradient(135deg, #6366f1, #06b6d4, #a855f7)", borderRadius: "0 0 24px 24px", overflow: "hidden" }}>
        <div className="blob blob-1" style={{ width: "300px", height: "300px", top: "-100px", right: "10%", opacity: 0.2 }} />
        <div className="blob blob-2" style={{ width: "200px", height: "200px", bottom: "-80px", left: "20%", opacity: 0.15 }} />
        <button style={{ position: "absolute", top: "16px", right: "16px", background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "10px", padding: "8px 14px", color: "white", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", backdropFilter: "blur(10px)" }}>
          <Camera size={13} /> Change Cover
        </button>
      </div>

      <div style={{ padding: "0 24px" }}>
        {/* Avatar + info */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: "-40px", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "16px" }}>
            <div style={{ position: "relative" }}>
              <img
                src={MOCK_USER.avatar}
                alt={MOCK_USER.name}
                style={{ width: "88px", height: "88px", borderRadius: "50%", border: "4px solid var(--bg-primary)", background: "var(--bg-secondary)" }}
              />
              <button style={{ position: "absolute", bottom: "4px", right: "4px", width: "26px", height: "26px", borderRadius: "50%", background: "var(--brand-gradient)", border: "2px solid var(--bg-primary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Edit2 size={11} color="white" />
              </button>
            </div>
            <div style={{ paddingBottom: "8px" }}>
              <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary)" }}>{MOCK_USER.name}</h1>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{MOCK_USER.bio}</p>
            </div>
          </div>
          <button className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
            <Settings size={14} /> Edit Profile
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
          {[
            { label: "Trips", value: MOCK_USER.tripsCount },
            { label: "Countries", value: MOCK_USER.countriesVisited },
            { label: "Followers", value: "12.4K" },
            { label: "Following", value: MOCK_USER.followingCount },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center", padding: "16px", borderRadius: "12px", background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div style={{ fontWeight: 800, fontSize: "20px", color: "var(--text-primary)" }}>{s.value}</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Personality card */}
        {personality && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ padding: "20px", borderRadius: "16px", background: `linear-gradient(135deg, ${personality.color}18, ${personality.color}08)`, border: `1px solid ${personality.color}30`, marginBottom: "24px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ fontSize: "40px" }}>{personality.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px" }}>YOUR AI TRAVEL PERSONALITY</div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: personality.color, marginBottom: "4px" }}>{personality.label}</div>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{personality.description}</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "12px" }}>
              {personality.traits.map((t) => (
                <span key={t} style={{ padding: "4px 10px", borderRadius: "16px", background: `${personality.color}18`, color: personality.color, fontSize: "11px", fontWeight: 500 }}>
                  {t}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Achievements */}
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Award size={18} color="var(--brand-primary)" /> Achievements
          </h3>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {[
              { emoji: "🌏", label: "Globe Trotter", sub: "18+ countries" },
              { emoji: "📸", label: "Insta Pro", sub: "10K+ photos" },
              { emoji: "🎒", label: "Backpacker", sub: "Budget master" },
              { emoji: "🌅", label: "Sunrise Chaser", sub: "Early riser" },
              { emoji: "✍️", label: "Storyteller", sub: "50+ journal entries" },
              { emoji: "💰", label: "Budget Genius", sub: "Saved ₹1L+" },
            ].map((a) => (
              <div key={a.label} style={{ padding: "12px 16px", borderRadius: "12px", background: "var(--bg-card)", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "22px" }}>{a.emoji}</span>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>{a.label}</div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{a.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Travel stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "24px" }}>
          {[
            { label: "Total Distance", value: "127,400 km", icon: "✈️", color: "#6366f1" },
            { label: "Total Spent", value: formatCurrency(680000), icon: "💸", color: "#a855f7" },
            { label: "Nights Abroad", value: "312 nights", icon: "🌙", color: "#06b6d4" },
            { label: "Photos Taken", value: "24,800+", icon: "📷", color: "#f59e0b" },
          ].map((s) => (
            <div key={s.label} className="card" style={{ padding: "16px" }}>
              <div style={{ fontSize: "22px", marginBottom: "6px" }}>{s.icon}</div>
              <div style={{ fontWeight: 800, fontSize: "18px", color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", padding: "4px", background: "var(--bg-secondary)", borderRadius: "12px", marginBottom: "20px" }}>
          {["trips", "saved", "community"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "13px", background: activeTab === tab ? "var(--brand-gradient)" : "transparent", color: activeTab === tab ? "white" : "var(--text-secondary)", transition: "all 0.2s", textTransform: "capitalize" }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Trips */}
        {activeTab === "trips" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "14px", paddingBottom: "100px" }}>
            {MOCK_TRIPS.map((trip) => (
              <motion.div key={trip.id} whileHover={{ y: -4 }} className="card" style={{ overflow: "hidden" }}>
                <div style={{ height: "130px", overflow: "hidden" }}>
                  <img src={trip.coverImage} alt={trip.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ padding: "14px" }}>
                  <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-primary)", marginBottom: "4px" }}>{trip.title}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{trip.startDate} · {formatCurrency(trip.budget)}</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === "saved" && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔖</div>
            <p style={{ fontWeight: 600, fontSize: "15px" }}>No saved trips yet</p>
            <p style={{ fontSize: "13px" }}>Explore the community and save inspiring itineraries</p>
          </div>
        )}
      </div>
    </div>
  );
}
