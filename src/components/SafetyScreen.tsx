"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Shield, Phone, AlertTriangle, MapPin, Heart, Zap, ChevronRight } from "lucide-react";

const SAFETY_TIPS = [
  { icon: "🏥", title: "Nearest Hospital", detail: "Kyoto University Hospital — 2.4km away", action: "Navigate", color: "#ef4444" },
  { icon: "👮", title: "Nearest Police", detail: "Kyoto Central Police — 800m away", action: "Call", color: "#3b82f6" },
  { icon: "🚑", title: "Emergency", detail: "Dial 119 (Japan Emergency)", action: "Call Now", color: "#f59e0b" },
  { icon: "🏨", title: "Your Hotel", detail: "Hotel Gracery Shinjuku — Saved", action: "Navigate", color: "#22c55e" },
];

const SAFETY_ALERTS = [
  { type: "warning", message: "Shinjuku Kabukicho: Increased tourist scams reported. Stay alert.", area: "Tokyo" },
  { type: "info", message: "Golden Week (April 29 - May 6): Expect higher crowds at major temples.", area: "Kyoto" },
  { type: "safe", message: "Arashiyama is considered very safe. Great for solo/women travelers.", area: "Kyoto" },
];

const WOMEN_SAFE_SPOTS = [
  { name: "Nishiki Market", type: "Food & Shopping", safety: "Very Safe", rating: "98/100" },
  { name: "Fushimi Inari", type: "Attraction", safety: "Safe (go before 8am)", rating: "91/100" },
  { name: "Philosopher's Path", type: "Walk", safety: "Very Safe", rating: "97/100" },
  { name: "Gion District", type: "Cultural", safety: "Safe (avoid late night alone)", rating: "88/100" },
];

export function SafetyScreen() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div style={{ padding: "24px", maxWidth: "900px", margin: "0 auto" }} className="page-enter">
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 900, color: "var(--text-primary)", marginBottom: "6px" }}>
          AI <span className="gradient-text">Safety</span> Assistant
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Real-time safety intelligence for your current location</p>
      </div>

      {/* Emergency SOS banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ padding: "20px 24px", borderRadius: "16px", background: "linear-gradient(135deg, #ef4444, #dc2626)", marginBottom: "24px", display: "flex", alignItems: "center", gap: "16px" }}
      >
        <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Phone size={24} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: "16px", color: "white" }}>Emergency SOS</div>
          <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.85)", marginTop: "2px" }}>Location sharing is ON · Contacts notified in SOS</div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{ padding: "12px 24px", borderRadius: "12px", background: "white", color: "#ef4444", fontWeight: 800, fontSize: "15px", border: "none", cursor: "pointer" }}
        >
          🆘 SOS
        </motion.button>
      </motion.div>

      {/* Safety score */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        {[
          { label: "Safety Score", value: "87", sub: "Kyoto, Japan", color: "#22c55e", emoji: "🛡️" },
          { label: "Crowd Level", value: "High", sub: "Golden Week", color: "#f59e0b", emoji: "👥" },
          { label: "Medical", value: "Excellent", sub: "Hospital nearby", color: "#06b6d4", emoji: "🏥" },
          { label: "Women Safety", value: "98/100", sub: "Very safe city", color: "#ec4899", emoji: "👩" },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: "16px", textAlign: "center" }}>
            <div style={{ fontSize: "24px", marginBottom: "6px" }}>{s.emoji}</div>
            <div style={{ fontWeight: 800, fontSize: "18px", color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", marginTop: "2px" }}>{s.label}</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", padding: "4px", background: "var(--bg-secondary)", borderRadius: "12px", marginBottom: "24px" }}>
        {[
          { id: "overview", label: "Overview" },
          { id: "alerts", label: "Safety Alerts" },
          { id: "women", label: "Women Safety" },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "13px", background: activeTab === tab.id ? "var(--brand-gradient)" : "transparent", color: activeTab === tab.id ? "white" : "var(--text-secondary)", transition: "all 0.2s" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>Emergency Contacts & Services</h3>
          {SAFETY_TIPS.map((tip, i) => (
            <motion.div
              key={tip.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card"
              style={{ padding: "16px", display: "flex", alignItems: "center", gap: "14px" }}
            >
              <div style={{ fontSize: "28px" }}>{tip.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)" }}>{tip.title}</div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>{tip.detail}</div>
              </div>
              <button style={{ padding: "7px 14px", borderRadius: "10px", border: `1px solid ${tip.color}`, color: tip.color, background: `${tip.color}15`, cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>
                {tip.action}
              </button>
            </motion.div>
          ))}

          {/* Emergency contacts */}
          <div className="card" style={{ padding: "20px" }}>
            <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "14px" }}>My Emergency Contacts</h4>
            {[
              { name: "Mom (Sunita)", phone: "+91 98765 43210", relation: "Mother" },
              { name: "Rohan (Friend)", phone: "+91 87654 32109", relation: "Travel buddy" },
            ].map((contact) => (
              <div key={contact.name} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--brand-gradient)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "14px" }}>
                  {contact.name[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{contact.name}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{contact.phone} · {contact.relation}</div>
                </div>
                <button style={{ background: "none", border: "1px solid var(--border)", borderRadius: "8px", padding: "5px 12px", color: "var(--text-secondary)", cursor: "pointer", fontSize: "12px" }}>Call</button>
              </div>
            ))}
            <button className="btn-secondary" style={{ width: "100%", marginTop: "12px", fontSize: "13px" }}>+ Add Contact</button>
          </div>
        </div>
      )}

      {activeTab === "alerts" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {SAFETY_ALERTS.map((alert, i) => {
            const alertStyles = {
              warning: { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", icon: "⚠️", color: "#f59e0b" },
              info: { bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.3)", icon: "ℹ️", color: "#6366f1" },
              safe: { bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.3)", icon: "✅", color: "#22c55e" },
            };
            const style = alertStyles[alert.type as keyof typeof alertStyles];
            return (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }} style={{ padding: "16px 20px", borderRadius: "14px", background: style.bg, border: `1px solid ${style.border}`, display: "flex", gap: "12px" }}>
                <span style={{ fontSize: "20px" }}>{style.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: style.color, marginBottom: "4px" }}>{alert.area}</div>
                  <div style={{ fontSize: "13px", color: "var(--text-primary)", lineHeight: 1.5 }}>{alert.message}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {activeTab === "women" && (
        <div>
          <div style={{ padding: "16px", borderRadius: "14px", background: "rgba(236,72,153,0.08)", border: "1px solid rgba(236,72,153,0.2)", marginBottom: "20px", display: "flex", gap: "10px" }}>
            <Heart size={18} color="#ec4899" style={{ flexShrink: 0, marginTop: "2px" }} />
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              <strong style={{ color: "var(--text-primary)" }}>Women Safety Intelligence:</strong> AI-powered recommendations based on time of day, crowd levels, and community reports from female travelers.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {WOMEN_SAFE_SPOTS.map((spot, i) => (
              <motion.div key={spot.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }} className="card" style={{ padding: "16px", display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "linear-gradient(135deg, #ec4899, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Shield size={20} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)" }}>{spot.name}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>{spot.type} · {spot.safety}</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "#22c55e" }}>{spot.rating}</div>
                <ChevronRight size={16} color="var(--text-muted)" />
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
