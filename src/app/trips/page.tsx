"use client";
import { useApp } from "@/context/AppContext";
import { Sidebar, BottomNav, TopBar } from "@/components/Navigation";
import { AIAssistant } from "@/components/AIAssistant";
import { motion } from "framer-motion";
import { AuthScreen } from "@/components/AuthScreen";
import { MOCK_TRIPS, MOODS } from "@/data/mock";
import { formatCurrency } from "@/lib/utils";
import { Calendar, Wallet, Plus } from "lucide-react";
import Link from "next/link";

function TripsScreen() {
  const { trips } = useApp();
  const allTrips = [...trips, ...MOCK_TRIPS].filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i);

  const statusColors: Record<string, string> = { planning: "#f59e0b", upcoming: "#6366f1", completed: "#22c55e", ongoing: "#06b6d4" };

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }} className="page-enter">
      <div style={{ marginBottom: "28px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 900, color: "var(--text-primary)", marginBottom: "6px" }}>
            My <span className="gradient-text">Trips</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>All your adventures, planned and completed</p>
        </div>
        <Link href="/trips/new">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Plus size={16} /> New Trip
          </motion.button>
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Total Trips", value: allTrips.length, color: "#6366f1" },
          { label: "Planning", value: allTrips.filter(t => t.status === "planning").length, color: "#f59e0b" },
          { label: "Completed", value: allTrips.filter(t => t.status === "completed").length, color: "#22c55e" },
          { label: "Countries", value: 18, color: "#a855f7" },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: "16px", textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: "24px", color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
        {allTrips.map((trip, i) => {
          const spentAmount = (trip as any).spentAmount ?? (trip as any).spent_amount ?? (trip as any).actual_spent ?? 0;
          const progress = spentAmount > 0 ? Math.round((spentAmount / trip.budget) * 100) : 0;
          return (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="trip-card"
              style={{ cursor: "pointer" }}
            >
              <div style={{ height: "180px", overflow: "hidden", position: "relative" }}>
                <img src={trip.coverImage} alt={trip.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }} />
                <div style={{ position: "absolute", top: "12px", left: "12px" }}>
                  <span className="badge" style={{ background: statusColors[trip.status] + "cc", color: "white", borderColor: "transparent", textTransform: "capitalize" }}>
                    {trip.status}
                  </span>
                </div>
                {trip.mood && (
                  <div style={{ position: "absolute", top: "12px", right: "12px" }}>
                    <span style={{ fontSize: "20px" }}>{MOODS.find(m => m.label === trip.mood)?.emoji}</span>
                  </div>
                )}
                <div style={{ position: "absolute", bottom: "12px", left: "12px" }}>
                  <div style={{ fontWeight: 800, color: "white", fontSize: "18px", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>{trip.title}</div>
                </div>
              </div>
              <div style={{ padding: "16px" }}>
                <div style={{ display: "flex", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "3px" }}>
                    <Calendar size={11} /> {trip.startDate}
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "3px" }}>
                    <Wallet size={11} /> {formatCurrency(trip.budget)}
                  </span>
                </div>
                {spentAmount > 0 && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Budget</span>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)" }}>{progress}%</span>
                    </div>
                    <div className="progress-track" style={{ height: "4px" }}>
                      <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%`, background: progress > 90 ? "#ef4444" : undefined }} />
                    </div>
                  </div>
                )}
                <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
                  <Link href="/itinerary" style={{ flex: 1 }}>
                    <button className="btn-secondary" style={{ width: "100%", fontSize: "12px", padding: "8px" }}>View Itinerary</button>
                  </Link>
                  <button className="btn-primary" style={{ flex: 1, fontSize: "12px", padding: "8px" }}>Edit Trip</button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default function TripsPage() {
  const { isAuthenticated } = useApp();
  if (!isAuthenticated) return <AuthScreen />;
  return (
    <div className="sidebar-layout">
      <Sidebar />
      <div className="main-content">
        <TopBar />
        <motion.main initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ paddingBottom: "80px" }}>
          <TripsScreen />
        </motion.main>
        <BottomNav />
        <AIAssistant />
      </div>
    </div>
  );
}
