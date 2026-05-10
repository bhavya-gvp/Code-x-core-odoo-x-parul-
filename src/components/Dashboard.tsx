"use client";

import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, MapPin, Wallet, Calendar, Star, ArrowRight, Sparkles, Wind, Droplets, Eye, Clock, DollarSign } from "lucide-react";
import { MOCK_DESTINATIONS, MOCK_TRIPS, AI_RECOMMENDATIONS, MOCK_USER, BUDGET_CATEGORIES, MOODS } from "@/data/mock";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import Link from "next/link";
import { CurrencyConverter } from "./CurrencyConverter";

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.07 } } };

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string }) {
  return (
    <motion.div variants={fadeUp} className="stat-card" style={{ position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "-10px", right: "-10px", width: "80px", height: "80px", borderRadius: "50%", background: color, opacity: 0.08 }} />
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: color + "22", display: "flex", alignItems: "center", justifyContent: "center", color: color }}>
          {icon}
        </div>
        <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "4px" }}>{value}</div>
      <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{sub}</div>
    </motion.div>
  );
}

function WeatherWidget({ city, temp, condition, humidity, wind }: { city: string; temp: number; condition: string; humidity: number; wind: number }) {
  return (
    <div className="weather-widget">
      <div style={{ position: "absolute", top: "10px", right: "10px", fontSize: "48px", opacity: 0.3 }}>☀️</div>
      <div style={{ fontSize: "11px", fontWeight: 600, opacity: 0.8, marginBottom: "4px" }}>{city}</div>
      <div style={{ fontSize: "42px", fontWeight: 900, lineHeight: 1 }}>{temp}°C</div>
      <div style={{ fontSize: "13px", opacity: 0.85, marginTop: "4px" }}>{condition}</div>
      <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", opacity: 0.8 }}>
          <Droplets size={12} /> {humidity}%
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", opacity: 0.8 }}>
          <Wind size={12} /> {wind} km/h
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { user, trips, isLoadingTrips } = useApp();
  const [activeMood, setActiveMood]       = useState<string | null>(null);
  const [showCurrency, setShowCurrency]   = useState(false);
  const totalBudget = BUDGET_CATEGORIES.reduce((s, c) => s + c.allocated, 0);
  const totalSpent  = BUDGET_CATEGORIES.reduce((s, c) => s + c.spent, 0);

  // Dynamic greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const greetingEmoji = hour < 12 ? "🌅" : hour < 17 ? "☀️" : "🌙";
  const firstName = user?.name?.split(" ")[0] || "Traveler";

  const upcomingTrips = trips.filter(t => t.status === "planning" || t.status === "upcoming");
  const completedTrips = trips.filter(t => t.status === "completed");

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }} className="page-enter">
      <AnimatePresence>{showCurrency && <CurrencyConverter onClose={() => setShowCurrency(false)} />}</AnimatePresence>

      {/* Welcome hero */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        style={{ borderRadius: "24px", padding: "32px", background: "linear-gradient(135deg, #0f1629 0%, #1a1040 50%, #0a2040 100%)", border: "1px solid rgba(99,102,241,0.2)", marginBottom: "28px", position: "relative", overflow: "hidden" }}>
        <div className="blob blob-1" style={{ width: "300px", height: "300px", top: "-80px", right: "-40px", opacity: 0.15 }} />
        <div className="blob blob-2" style={{ width: "200px", height: "200px", bottom: "-60px", left: "30%", opacity: 0.1 }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "5px 12px", borderRadius: "20px", background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)", marginBottom: "12px" }}>
                <Sparkles size={12} color="#6366f1" />
                <span style={{ fontSize: "11px", color: "#a5b4fc", fontWeight: 600 }}>AI-Powered Companion</span>
              </div>
              <h1 style={{ fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 900, color: "white", marginBottom: "8px" }}>
                {greeting}, {firstName}! {greetingEmoji}
              </h1>
              <p style={{ color: "#94a3b8", fontSize: "14px", maxWidth: "480px", lineHeight: 1.6 }}>
                {isLoadingTrips ? "Loading your trips…" : upcomingTrips.length > 0
                  ? <><strong style={{ color: "#a5b4fc" }}>{upcomingTrips.length} upcoming trip{upcomingTrips.length > 1 ? "s" : ""}</strong> ready to explore. Your AI planner is ready.</>  
                  : "Start planning your next adventure with AI — just type a destination."}
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => setShowCurrency(true)}
                style={{ padding: "9px 14px", borderRadius: "12px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "5px", fontWeight: 600 }}>
                <DollarSign size={13} /> Currency
              </motion.button>
              <Link href="/trips/new">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                  <Sparkles size={14} /> Plan New Trip
                </motion.button>
              </Link>
              <Link href="/discover">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-secondary" style={{ fontSize: "13px" }}>Explore</motion.button>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "28px" }}
      >
        <StatCard icon={<MapPin size={18} />} label="Countries Visited" value="18" sub="+3 this year" color="#6366f1" />
        <StatCard icon={<Calendar size={18} />} label="Total Trips" value="24" sub="2 planned" color="#06b6d4" />
        <StatCard icon={<Wallet size={18} />} label="Budget Saved" value="₹48K" sub="vs last year" color="#a855f7" />
        <StatCard icon={<Star size={18} />} label="Avg Trip Rating" value="4.8" sub="By your reviews" color="#f59e0b" />
        <StatCard icon={<TrendingUp size={18} />} label="AI Insights" value="47" sub="Recommendations" color="#22c55e" />
      </motion.div>

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "24px" }} className="dashboard-grid">
        <style>{`@media (max-width: 1100px) { .dashboard-grid { grid-template-columns: 1fr !important; } }`}</style>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* AI Recommendations */}
          <div>
            <div className="section-header">
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>AI Recommendations</h2>
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Personalized for your travel style</p>
              </div>
              <a href="/discover" style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--brand-primary)", fontSize: "13px", fontWeight: 500, textDecoration: "none" }}>
                View All <ArrowRight size={14} />
              </a>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
              {AI_RECOMMENDATIONS.map((rec, i) => (
                <motion.div
                  key={rec.id}
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  transition={{ delay: i * 0.1 }}
                  className="card"
                  style={{ padding: "18px", cursor: "pointer" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                    <span className="badge badge-primary">{rec.type}</span>
                    <span style={{ fontSize: "11px", color: "#22c55e", fontWeight: 600 }}>{rec.confidence}% match</span>
                  </div>
                  <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>{rec.title}</h3>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "12px" }}>{rec.description}</p>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {rec.tags.map((tag) => (
                      <span key={tag} className="tag" style={{ fontSize: "10px" }}>{tag}</span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Trending destinations */}
          <div>
            <div className="section-header">
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>Trending Destinations</h2>
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>AI-curated based on real-time trends</p>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
              {MOCK_DESTINATIONS.filter((d) => d.trending).map((dest, i) => (
                <motion.div
                  key={dest.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="destination-card"
                  style={{ height: "220px" }}
                >
                  <img src={dest.image} alt={dest.name} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)" }} />
                  <div style={{ position: "absolute", top: "10px", right: "10px" }}>
                    <span className="badge" style={{ background: "rgba(99,102,241,0.9)", color: "white", fontSize: "10px" }}>
                      🔥 Trending
                    </span>
                  </div>
                  <div style={{ position: "absolute", bottom: "12px", left: "12px", right: "12px" }}>
                    <div style={{ fontWeight: 700, color: "white", fontSize: "16px" }}>{dest.name}</div>
                    <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                      <MapPin size={10} /> {dest.country}
                      <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "2px" }}>
                        <Star size={10} fill="gold" color="gold" /> {dest.rating}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Mood-based planning */}
          <div>
            <div className="section-header">
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>How are you feeling?</h2>
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Let AI plan around your current mood</p>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px" }}>
              {MOODS.map((mood) => (
                <motion.button
                  key={mood.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`mood-btn ${activeMood === mood.id ? "active" : ""}`}
                  onClick={() => setActiveMood(activeMood === mood.id ? null : mood.id)}
                  style={{ borderColor: activeMood === mood.id ? mood.color : undefined }}
                >
                  <span style={{ fontSize: "28px" }}>{mood.emoji}</span>
                  <span style={{ fontWeight: 600, fontSize: "12px" }}>{mood.label}</span>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.3 }}>{mood.description}</span>
                </motion.button>
              ))}
            </div>
            {activeMood && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                style={{ marginTop: "16px", padding: "16px", borderRadius: "12px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <Sparkles size={16} color="var(--brand-primary)" />
                  <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary)" }}>AI is adapting your recommendations...</span>
                </div>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  Based on your <strong>{MOODS.find((m) => m.id === activeMood)?.label}</strong> mood, I recommend: 
                  calm coastal towns, flexible schedules, zero check-in deadlines, and zero tourist crowds. ✨
                </p>
                <button className="btn-primary" style={{ marginTop: "12px", padding: "8px 20px", fontSize: "13px" }}>
                  Show Mood-Based Destinations
                </button>
              </motion.div>
            )}
          </div>

          {/* Recent Trips */}
          <div>
            <div className="section-header">
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>My Trips</h2>
              <a href="/trips" style={{ color: "var(--brand-primary)", fontSize: "13px", fontWeight: 500, textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                View All <ArrowRight size={14} />
              </a>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {MOCK_TRIPS.map((trip, i) => {
                const progress = Math.round((trip.spentAmount / trip.budget) * 100);
                const statusColors: Record<string, string> = { planning: "#f59e0b", upcoming: "#6366f1", completed: "#22c55e", ongoing: "#06b6d4" };
                return (
                  <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="trip-card"
                    style={{ display: "flex", gap: "16px", padding: "16px", cursor: "pointer" }}
                  >
                    <div style={{ width: "80px", height: "80px", borderRadius: "12px", overflow: "hidden", flexShrink: 0 }}>
                      <img src={trip.coverImage} alt={trip.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "4px" }}>
                        <h3 style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{trip.title}</h3>
                        <span className="badge" style={{ background: statusColors[trip.status] + "22", color: statusColors[trip.status], borderColor: statusColors[trip.status] + "44", flexShrink: 0, textTransform: "capitalize" }}>
                          {trip.status}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "12px", marginBottom: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "3px" }}>
                          <Calendar size={11} /> {trip.startDate}
                        </span>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "3px" }}>
                          <Wallet size={11} /> {formatCurrency(trip.budget)}
                        </span>
                        {trip.mood && (
                          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                            {MOODS.find((m) => m.label === trip.mood)?.emoji} {trip.mood}
                          </span>
                        )}
                      </div>
                      {trip.spentAmount > 0 && (
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Budget Used</span>
                            <span style={{ fontSize: "11px", color: progress > 90 ? "#ef4444" : "var(--text-secondary)", fontWeight: 600 }}>{progress}%</span>
                          </div>
                          <div className="progress-track">
                            <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%`, background: progress > 90 ? "#ef4444" : undefined }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Weather widgets */}
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>Weather Forecast</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <WeatherWidget city="Mumbai (Home)" temp={32} condition="Hot & Humid" humidity={78} wind={12} />
              <div className="weather-widget" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, opacity: 0.8, marginBottom: "4px" }}>Kyoto (Upcoming)</div>
                <div style={{ fontSize: "36px", fontWeight: 900, lineHeight: 1 }}>22°C</div>
                <div style={{ fontSize: "13px", opacity: 0.85, marginTop: "4px" }}>🌸 Perfect Sakura Weather</div>
                <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
                  <span style={{ fontSize: "11px", opacity: 0.8, display: "flex", alignItems: "center", gap: "3px" }}><Droplets size={11} /> 55%</span>
                  <span style={{ fontSize: "11px", opacity: 0.8, display: "flex", alignItems: "center", gap: "3px" }}><Wind size={11} /> 8 km/h</span>
                  <span style={{ fontSize: "11px", opacity: 0.8, display: "flex", alignItems: "center", gap: "3px" }}><Eye size={11} /> Clear</span>
                </div>
              </div>
            </div>
          </div>

          {/* Budget snapshot */}
          <div className="card" style={{ padding: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px" }}>Budget Snapshot</h3>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Total Budget</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>{formatCurrency(totalBudget)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Spent</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#22c55e" }}>{formatCurrency(totalSpent)}</span>
              </div>
              <div className="progress-track" style={{ height: "8px" }}>
                <div className="progress-fill" style={{ width: `${Math.round((totalSpent / totalBudget) * 100)}%` }} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{Math.round((totalSpent / totalBudget) * 100)}% used</span>
              </div>
            </div>
            {BUDGET_CATEGORIES.map((cat) => (
              <div key={cat.name} style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{cat.name}</span>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{formatCurrency(cat.spent)}</span>
                </div>
                <div className="progress-track" style={{ height: "4px" }}>
                  <div style={{ height: "100%", borderRadius: "2px", width: `${Math.min(Math.round((cat.spent / cat.allocated) * 100), 100)}%`, background: cat.color, transition: "width 0.6s ease" }} />
                </div>
              </div>
            ))}
            <a href="/budget">
              <button className="btn-secondary" style={{ width: "100%", marginTop: "12px", fontSize: "13px" }}>
                View Full Budget Analysis →
              </button>
            </a>
          </div>

          {/* User achievements */}
          <div className="card" style={{ padding: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "14px" }}>Your Achievements</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {MOCK_USER.achievements.map((badge) => (
                <div key={badge} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", borderRadius: "10px", background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "20px" }}>{badge.split(" ")[0]}</div>
                  <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{badge.split(" ").slice(1).join(" ")}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="card" style={{ padding: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "14px" }}>Quick Actions</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {[
                { label: "New Trip", emoji: "✈️", href: "/trips/new" },
                { label: "Add Expense", emoji: "💸", href: "/budget" },
                { label: "Write Note", emoji: "📝", href: "/journal" },
                { label: "Check List", emoji: "📦", href: "/packing" },
              ].map((action) => (
                <a key={action.label} href={action.href}>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} style={{ width: "100%", padding: "12px 8px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--bg-primary)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", transition: "all 0.2s" }}>
                    <span style={{ fontSize: "20px" }}>{action.emoji}</span>
                    <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-secondary)" }}>{action.label}</span>
                  </motion.button>
                </a>
              ))}
            </div>
          </div>

          {/* AI Tip */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{ padding: "16px", borderRadius: "16px", background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.1))", border: "1px solid rgba(99,102,241,0.25)" }}
          >
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--brand-gradient)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Sparkles size={14} color="white" />
              </div>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "4px" }}>AI Travel Tip</div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  <Clock size={10} style={{ display: "inline", verticalAlign: "middle" }} /> Booking Japan flights 6 weeks early saves 28% on average. 
                  Your trip is in 23 days — consider booking now!
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
