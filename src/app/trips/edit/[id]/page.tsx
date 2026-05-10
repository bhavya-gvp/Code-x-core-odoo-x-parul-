"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { Sidebar, BottomNav, TopBar } from "@/components/Navigation";
import { AuthScreen } from "@/components/AuthScreen";
import { AIAssistant } from "@/components/AIAssistant";
import { ArrowLeft, Save, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { tripsAPI } from "@/lib/api";
import { MOODS } from "@/data/mock";

const TRAVEL_TYPES = ["Solo Adventure", "Couple Trip", "Family Trip", "Friend Group", "Work/Collab", "Backpacking"];
const VISIBILITIES = ["private", "friends", "public"];

interface TripForm {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  budget: string;
  mood: string;
  travel_type: string;
  visibility: string;
  travelers: string;
}

function EditTripScreen() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { trips, refreshTrips } = useApp();

  const [form, setForm] = useState<TripForm>({
    title: "", description: "", start_date: "", end_date: "",
    budget: "", mood: "", travel_type: "", visibility: "private", travelers: "1",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // ── Load trip data ─────────────────────────────────────────
  useEffect(() => {
    if (!id) return;

    const loadTrip = async () => {
      setLoading(true);
      setError(null);

      // 1. Try from context cache first (instant)
      const cached = trips.find((t) => t.id === id);
      if (cached) {
        populateForm(cached);
        setLoading(false);
        return;
      }

      // 2. Fetch from API
      try {
        const res: any = await tripsAPI.getTripById(id);
        if (res?.data) {
          populateForm(res.data);
        } else {
          setNotFound(true);
        }
      } catch (err: any) {
        if (err?.status === 404) {
          setNotFound(true);
        } else {
          setError("Failed to load trip. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadTrip();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const populateForm = (trip: any) => {
    setForm({
      title:       trip.title        || "",
      description: trip.description  || "",
      start_date:  (trip.start_date  || trip.startDate || "").split("T")[0],
      end_date:    (trip.end_date    || trip.endDate   || "").split("T")[0],
      budget:      String(trip.budget || ""),
      mood:        trip.mood         || "",
      travel_type: trip.travel_type  || trip.travelType || "",
      visibility:  trip.visibility   || "private",
      travelers:   String(trip.travelers || 1),
    });
  };

  const update = (field: keyof TripForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // ── Save handler ────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.title.trim()) { setError("Trip title is required."); return; }
    if (!form.start_date)   { setError("Start date is required."); return; }
    if (!form.end_date)     { setError("End date is required."); return; }
    if (new Date(form.end_date) < new Date(form.start_date)) {
      setError("End date must be after start date."); return;
    }

    setSaving(true);
    setError(null);
    try {
      await tripsAPI.updateTrip(id, {
        title:       form.title,
        description: form.description,
        start_date:  form.start_date,
        end_date:    form.end_date,
        budget:      Number(form.budget),
        mood:        form.mood,
        travel_type: form.travel_type,
        visibility:  form.visibility,
        travelers:   Number(form.travelers),
      });
      setSuccess(true);
      await refreshTrips();
      setTimeout(() => router.push("/trips"), 1200);
    } catch (err: any) {
      setError(err?.data?.message || "Failed to save trip. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── States ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "16px" }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <Loader2 size={40} color="var(--brand-primary)" />
        </motion.div>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Loading trip details…</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "16px", padding: "24px", textAlign: "center" }}>
        <div style={{ fontSize: "48px" }}>🗺️</div>
        <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)" }}>Trip Not Found</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>This trip doesn't exist or you don't have access to it.</p>
        <Link href="/trips">
          <button className="btn-primary" style={{ marginTop: "8px" }}>← Back to Trips</button>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "720px", margin: "0 auto" }} className="page-enter">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
        <Link href="/trips">
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            style={{ width: "40px", height: "40px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-secondary)" }}
          >
            <ArrowLeft size={18} />
          </motion.button>
        </Link>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 900, color: "var(--text-primary)", marginBottom: "4px" }}>
            ✏️ Edit <span className="gradient-text">Trip</span>
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Update your trip details below</p>
        </div>
      </div>

      {/* Feedback banners */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            style={{ padding: "12px 16px", borderRadius: "10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
            <AlertCircle size={16} /> {error}
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ padding: "12px 16px", borderRadius: "10px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
            <CheckCircle size={16} /> Trip updated! Redirecting…
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form card */}
      <div className="card" style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* Title */}
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>Trip Title *</label>
          <input
            className="input"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. Tokyo Adventure 2025"
            style={{ width: "100%" }}
          />
        </div>

        {/* Description */}
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>Description</label>
          <textarea
            className="input"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Describe your trip…"
            rows={3}
            style={{ width: "100%", resize: "vertical" }}
          />
        </div>

        {/* Dates */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>Start Date *</label>
            <input type="date" className="input" value={form.start_date} onChange={(e) => update("start_date", e.target.value)} style={{ width: "100%" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>End Date *</label>
            <input type="date" className="input" value={form.end_date} onChange={(e) => update("end_date", e.target.value)} style={{ width: "100%" }} />
          </div>
        </div>

        {/* Budget + Travelers */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>Total Budget (₹)</label>
            <input type="number" className="input" value={form.budget} onChange={(e) => update("budget", e.target.value)} placeholder="200000" min="0" style={{ width: "100%" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>Travelers</label>
            <input type="number" className="input" value={form.travelers} onChange={(e) => update("travelers", e.target.value)} placeholder="1" min="1" max="50" style={{ width: "100%" }} />
          </div>
        </div>

        {/* Mood */}
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "10px" }}>Trip Mood</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {MOODS.map((m) => (
              <motion.button
                key={m.id} type="button"
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => update("mood", form.mood === m.label ? "" : m.label)}
                style={{
                  padding: "8px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                  border: `1px solid ${form.mood === m.label ? m.color : "var(--border)"}`,
                  background: form.mood === m.label ? m.color + "22" : "var(--bg-primary)",
                  color: form.mood === m.label ? m.color : "var(--text-secondary)",
                  transition: "all 0.2s",
                }}
              >
                {m.emoji} {m.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Travel Type */}
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>Travel Style</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {TRAVEL_TYPES.map((t) => (
              <motion.button
                key={t} type="button"
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => update("travel_type", form.travel_type === t ? "" : t)}
                style={{
                  padding: "8px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                  border: `1px solid ${form.travel_type === t ? "var(--brand-primary)" : "var(--border)"}`,
                  background: form.travel_type === t ? "rgba(99,102,241,0.15)" : "var(--bg-primary)",
                  color: form.travel_type === t ? "var(--brand-primary)" : "var(--text-secondary)",
                  transition: "all 0.2s",
                }}
              >
                {t}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Visibility */}
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>Visibility</label>
          <div style={{ display: "flex", gap: "8px" }}>
            {VISIBILITIES.map((v) => (
              <motion.button
                key={v} type="button"
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => update("visibility", v)}
                style={{
                  flex: 1, padding: "10px", borderRadius: "10px", fontSize: "12px", fontWeight: 600, cursor: "pointer", textTransform: "capitalize",
                  border: `1px solid ${form.visibility === v ? "var(--brand-primary)" : "var(--border)"}`,
                  background: form.visibility === v ? "rgba(99,102,241,0.15)" : "var(--bg-primary)",
                  color: form.visibility === v ? "var(--brand-primary)" : "var(--text-secondary)",
                  transition: "all 0.2s",
                }}
              >
                {v === "private" ? "🔒" : v === "friends" ? "👥" : "🌐"} {v}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "12px", paddingTop: "8px", borderTop: "1px solid var(--border)" }}>
          <Link href="/trips" style={{ flex: 1 }}>
            <button className="btn-secondary" style={{ width: "100%" }}>Cancel</button>
          </Link>
          <motion.button
            whileHover={{ scale: saving ? 1 : 1.02 }}
            whileTap={{ scale: saving ? 1 : 0.98 }}
            onClick={handleSave}
            disabled={saving || success}
            className="btn-primary"
            style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: saving ? 0.8 : 1 }}
          >
            {saving ? (
              <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><Loader2 size={16} /></motion.div> Saving…</>
            ) : success ? (
              <><CheckCircle size={16} /> Saved!</>
            ) : (
              <><Save size={16} /> Save Changes</>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export default function EditTripPage() {
  const { isAuthenticated } = useApp();
  if (!isAuthenticated) return <AuthScreen />;
  return (
    <div className="sidebar-layout">
      <Sidebar />
      <div className="main-content">
        <TopBar />
        <motion.main initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ paddingBottom: "80px" }}>
          <EditTripScreen />
        </motion.main>
        <BottomNav />
        <AIAssistant />
      </div>
    </div>
  );
}
