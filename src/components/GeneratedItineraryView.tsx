"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Calendar, Wallet, Zap, ChevronDown, ChevronUp, Clock, TrendingUp, AlertTriangle, CheckCircle, Star } from "lucide-react";

interface GeneratedItineraryViewProps {
  result: any;
  onCreateAnother: () => void;
}

const INSIGHT_COLORS: Record<string, string> = {
  destination: "#6366f1", budget: "#f59e0b", mood: "#a855f7",
  fatigue: "#ef4444", duration: "#06b6d4",
};

const TIME_COLORS: Record<string, { bg: string; color: string; emoji: string }> = {
  Morning:   { bg: "rgba(251,191,36,0.1)",  color: "#f59e0b", emoji: "🌅" },
  Afternoon: { bg: "rgba(99,102,241,0.1)",  color: "#6366f1", emoji: "☀️" },
  Evening:   { bg: "rgba(168,85,247,0.1)",  color: "#a855f7", emoji: "🌆" },
  Night:     { bg: "rgba(15,23,42,0.5)",    color: "#94a3b8", emoji: "🌙" },
};

export function GeneratedItineraryView({ result, onCreateAnother }: GeneratedItineraryViewProps) {
  const [expandedDay, setExpandedDay] = useState<number | null>(1);

  const { tripSummary, destinations, itinerary, budgetPlan, fatigueScore, fatigueLabel, insights } = result;

  const fatigueColor = fatigueScore < 30 ? "#22c55e" : fatigueScore < 60 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px" }}>

      {/* Hero banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          borderRadius: "24px", padding: "32px",
          background: "linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #06b6d4 100%)",
          marginBottom: "24px", position: "relative", overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "absolute", bottom: "-60px", left: "20px", width: "150px", height: "150px", borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, background: "rgba(255,255,255,0.2)", padding: "4px 10px", borderRadius: "20px", color: "white" }}>
              ✨ AI Generated
            </span>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>{tripSummary.mood}</span>
          </div>

          <h1 style={{ fontSize: "28px", fontWeight: 900, color: "white", marginBottom: "16px", lineHeight: 1.2 }}>
            {tripSummary.title}
          </h1>

          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            {[
              { icon: <Calendar size={14}/>, label: `${tripSummary.totalDays} days · ${tripSummary.totalNights} nights` },
              { icon: <MapPin size={14}/>,   label: `${tripSummary.cities} cities` },
              { icon: <Wallet size={14}/>,   label: `₹${Number(tripSummary.budget || budgetPlan?.total).toLocaleString("en-IN")} total` },
            ].map((m, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", color: "rgba(255,255,255,0.9)", fontSize: "13px" }}>
                {m.icon} {m.label}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px" }} className="gen-grid">
        <style>{`@media(max-width:768px){.gen-grid{grid-template-columns:1fr!important}}`}</style>

        {/* Left: Itinerary */}
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "16px" }}>
            📅 Day-by-Day Itinerary
          </h2>

          {itinerary?.map((day: any) => (
            <motion.div
              key={day.dayNumber}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: day.dayNumber * 0.04 }}
              style={{
                marginBottom: "12px", borderRadius: "16px",
                background: "var(--bg-card)", border: "1px solid var(--border)",
                overflow: "hidden",
              }}
            >
              {/* Day header */}
              <div
                onClick={() => setExpandedDay(expandedDay === day.dayNumber ? null : day.dayNumber)}
                style={{
                  padding: "14px 18px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "12px",
                  background: expandedDay === day.dayNumber ? "rgba(99,102,241,0.06)" : "transparent",
                }}
              >
                <div style={{
                  width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0,
                  background: "var(--brand-gradient)", display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, color: "white", fontSize: "14px",
                }}>
                  {day.dayNumber}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                    {day.theme}
                    {day.isArrival && <span style={{ marginLeft: "6px", fontSize: "11px", color: "#22c55e", fontWeight: 600 }}>✈ Arrival</span>}
                    {day.isDeparture && <span style={{ marginLeft: "6px", fontSize: "11px", color: "#ef4444", fontWeight: 600 }}>✈ Departure</span>}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                    {new Date(day.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} · {day.city}, {day.country}
                  </div>
                </div>
                <div style={{ color: "var(--text-muted)" }}>
                  {expandedDay === day.dayNumber ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                </div>
              </div>

              {/* Activities */}
              {expandedDay === day.dayNumber && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  style={{ borderTop: "1px solid var(--border)", padding: "14px 18px", display: "flex", flexDirection: "column", gap: "10px" }}
                >
                  {day.travelNote && (
                    <div style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", fontSize: "12px", color: "#06b6d4" }}>
                      🚌 {day.travelNote}
                    </div>
                  )}
                  {day.activities?.map((act: any, i: number) => {
                    const t = TIME_COLORS[act.time] || TIME_COLORS.Morning;
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                        <div style={{
                          padding: "4px 8px", borderRadius: "8px", fontSize: "11px", fontWeight: 700,
                          background: t.bg, color: t.color, whiteSpace: "nowrap", flexShrink: 0, marginTop: "2px",
                        }}>
                          {t.emoji} {act.time}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{act.label}</div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                            <Clock size={10} style={{ display: "inline", marginRight: "3px" }} />
                            {act.duration} min · Est. ₹{Number(act.estimatedCost).toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Right: Stats sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Budget Breakdown */}
          <div className="card" style={{ padding: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "16px" }}>
              💰 Budget Breakdown
            </h3>
            {budgetPlan?.breakdown && Object.entries(budgetPlan.breakdown).map(([cat, amount]: any) => {
              const pct = Math.round((amount / budgetPlan.total) * 100);
              const colors: any = { hotels: "#6366f1", food: "#f59e0b", transport: "#06b6d4", activities: "#22c55e", emergency: "#ef4444" };
              return (
                <div key={cat} style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)", textTransform: "capitalize" }}>{cat}</span>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>₹{Number(amount).toLocaleString("en-IN")}</span>
                  </div>
                  <div style={{ height: "4px", borderRadius: "4px", background: "var(--bg-primary)", overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      style={{ height: "100%", background: colors[cat] || "#94a3b8", borderRadius: "4px" }}
                    />
                  </div>
                </div>
              );
            })}
            <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Per day</span>
              <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--brand-primary)" }}>₹{Number(budgetPlan?.perDay).toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Fatigue Score */}
          <div className="card" style={{ padding: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "12px" }}>
              ⚡ Fatigue Score
            </h3>
            <div style={{ textAlign: "center", marginBottom: "12px" }}>
              <div style={{ fontSize: "48px", fontWeight: 900, color: fatigueColor }}>{fatigueScore}</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>/ 100</div>
            </div>
            <div style={{ height: "8px", borderRadius: "8px", background: "var(--bg-primary)", overflow: "hidden", marginBottom: "10px" }}>
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${fatigueScore}%` }}
                transition={{ duration: 1 }}
                style={{ height: "100%", background: fatigueColor, borderRadius: "8px" }}
              />
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", textAlign: "center" }}>{fatigueLabel}</p>
          </div>

          {/* Cities */}
          <div className="card" style={{ padding: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "12px" }}>🗺️ City Plan</h3>
            {destinations?.map((d: any, i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--brand-gradient)", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>{d.name}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{d.assignedDays} days · {d.country}</div>
                </div>
              </div>
            ))}
          </div>

          {/* AI Insights */}
          <div className="card" style={{ padding: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "12px" }}>🧠 AI Insights</h3>
            {insights?.map((ins: any, i: number) => (
              <div key={i} style={{ marginBottom: "10px", padding: "10px 12px", borderRadius: "10px", background: `${INSIGHT_COLORS[ins.type] || "#6366f1"}0f`, border: `1px solid ${INSIGHT_COLORS[ins.type] || "#6366f1"}22` }}>
                <div style={{ fontSize: "14px", marginBottom: "4px" }}>{ins.icon}</div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>{ins.text}</div>
              </div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={onCreateAnother}
            className="btn-primary"
            style={{ width: "100%" }}
          >
            ✨ Generate Another Trip
          </motion.button>
        </div>
      </div>
    </div>
  );
}
