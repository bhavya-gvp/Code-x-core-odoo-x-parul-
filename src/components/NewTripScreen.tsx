"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Sparkles, ArrowRight, Check, MapPin, Calendar, Wallet, Users, Image as ImageIcon, Globe, ChevronRight } from "lucide-react";
import { MOCK_DESTINATIONS, MOODS } from "@/data/mock";
import { useApp } from "@/context/AppContext";
import { Trip } from "@/types";
import { AIGenerationScreen } from "./AIGenerationScreen";
import { GeneratedItineraryView } from "./GeneratedItineraryView";
import { AIPlannerModal } from "./AIPlannerModal";

const STEPS = [
  { id: 1, title: "Basics", subtitle: "Name your adventure" },
  { id: 2, title: "Destinations", subtitle: "Where are you going?" },
  { id: 3, title: "Vibe & Budget", subtitle: "Set the mood" },
  { id: 4, title: "Companions", subtitle: "Who's coming?" },
  { id: 5, title: "Review", subtitle: "AI is building your trip" },
];

function StepIndicator({ step, current }: { step: typeof STEPS[0]; current: number }) {
  const done = step.id < current;
  const active = step.id === current;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{
        width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, flexShrink: 0,
        background: done ? "#22c55e" : active ? "var(--brand-gradient)" : "var(--bg-primary)",
        color: done || active ? "white" : "var(--text-muted)",
        border: `2px solid ${done ? "#22c55e" : active ? "transparent" : "var(--border)"}`,
        transition: "all 0.3s",
      }}>
        {done ? <Check size={14} /> : step.id}
      </div>
      <div style={{ display: "none" }} className="step-label">
        <div style={{ fontSize: "12px", fontWeight: 600, color: active ? "var(--brand-primary)" : "var(--text-muted)" }}>{step.title}</div>
      </div>
    </div>
  );
}

export function NewTripScreen() {
  const { addTrip, setActiveTab } = useApp();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<any>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [showAIPlanner, setShowAIPlanner] = useState(false);
  const [form, setForm] = useState({
    title: "",
    startDate: "",
    endDate: "",
    budget: "",
    mood: "",
    description: "",
    visibility: "private",
    destinations: [] as string[],
    travelType: "",
    travelers: "1",
  });

  const TRAVEL_TYPES = ["Solo Adventure", "Couple Trip", "Family Trip", "Friend Group", "Work/Collab", "Backpacking"];

  const handleNext = async () => {
    if (step < STEPS.length) {
      setStep((s) => s + 1);
    } else {
      // Trigger AI generation
      setGenerating(true);
    }
  };

  const toggleDestination = (name: string) => {
    setForm((f) => ({
      ...f,
      destinations: f.destinations.includes(name) ? f.destinations.filter((d) => d !== name) : [...f.destinations, name],
    }));
  };

  // Apply AI-parsed intent to form fields
  const applyAIIntent = (intent: any) => {
    setForm(prev => ({
      ...prev,
      destinations: intent.destinations?.length ? intent.destinations : prev.destinations,
      budget:       intent.budget      ? String(intent.budget) : prev.budget,
      mood:         intent.mood        || prev.mood,
      travelType:   intent.travel_type || prev.travelType,
      travelers:    intent.travelers   ? String(intent.travelers) : prev.travelers,
      startDate:    intent.start_date  || prev.startDate,
      endDate:      intent.end_date    || prev.endDate,
    }));
    // Jump to step 2 (destinations) to let user review
    setStep(2);
  };

  // Show AI generation loading screen
  if (generating && !generatedResult) {
    return (
      <AIGenerationScreen
        tripParams={{
          destinations: form.destinations.length > 0 ? form.destinations : ["Bali"],
          mood:       form.mood || "Relax",
          budget:     Number(form.budget) || 100000,
          start_date: form.startDate || new Date().toISOString().split("T")[0],
          end_date:   form.endDate || new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
          travelers:  Number(form.travelers) || 1,
        }}
        onComplete={(result) => { setGeneratedResult(result); setGenerating(false); }}
        onError={(err) => { setGenError(err); setGenerating(false); setStep(STEPS.length); }}
      />
    );
  }

  // Show generated itinerary
  if (generatedResult) {
    return (
      <GeneratedItineraryView
        result={generatedResult}
        onCreateAnother={() => { setGeneratedResult(null); setStep(1); setForm({ title: "", startDate: "", endDate: "", budget: "", mood: "", description: "", visibility: "private", destinations: [], travelType: "", travelers: "1" }); }}
      />
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "700px", margin: "0 auto" }} className="page-enter">
      {/* AI Planner Modal */}
      <AnimatePresence>
        {showAIPlanner && (
          <AIPlannerModal
            onClose={() => setShowAIPlanner(false)}
            onApply={applyAIIntent}
          />
        )}
      </AnimatePresence>

      <div style={{ marginBottom: "32px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 900, color: "var(--text-primary)", marginBottom: "6px" }}>
            ✈️ Create New <span className="gradient-text">Trip</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>AI will build your perfect itinerary</p>
        </div>

        {/* ✨ Generate With AI button */}
        <motion.button
          whileHover={{ scale: 1.04, boxShadow: "0 0 24px rgba(99,102,241,0.5)" }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setShowAIPlanner(true)}
          style={{
            padding: "10px 18px", borderRadius: "14px", border: "none",
            background: "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)",
            color: "white", fontWeight: 700, fontSize: "13px",
            cursor: "pointer", display: "flex", alignItems: "center", gap: "7px",
            boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
            transition: "all 0.2s",
          }}
        >
          <motion.span
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{ display: "flex" }}
          >
            <Sparkles size={15} />
          </motion.span>
          Generate With AI
        </motion.button>
      </div>

      {/* Step indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "36px" }}>
        {STEPS.map((s, i) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center" }}>
            <StepIndicator step={s} current={step} />
            {i < STEPS.length - 1 && (
              <div style={{ width: "40px", height: "2px", background: step > s.id ? "#22c55e" : "var(--border)", transition: "background 0.3s", marginLeft: "4px", marginRight: "4px" }} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
        >
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "8px" }}>Trip Title *</label>
                <input className="input" placeholder="e.g., Japan Cherry Blossom Adventure" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} style={{ fontSize: "16px" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "8px" }}>
                    <Calendar size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} /> Start Date
                  </label>
                  <input className="input" type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "8px" }}>
                    <Calendar size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} /> End Date
                  </label>
                  <input className="input" type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "8px" }}>
                  <Wallet size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} /> Total Budget (₹)
                </label>
                <input className="input" type="number" placeholder="e.g., 150000" value={form.budget} onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "8px" }}>Description (Optional)</label>
                <textarea className="input" placeholder="What's the story behind this trip?" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} style={{ minHeight: "80px", resize: "vertical" }} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>Pick your destinations</h3>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>You can add multiple cities for a multi-city trip</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
                {MOCK_DESTINATIONS.map((dest) => {
                  const selected = form.destinations.includes(dest.name);
                  return (
                    <motion.div
                      key={dest.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => toggleDestination(dest.name)}
                      style={{ borderRadius: "14px", overflow: "hidden", height: "150px", cursor: "pointer", position: "relative", border: `2px solid ${selected ? "var(--brand-primary)" : "transparent"}`, transition: "all 0.2s" }}
                    >
                      <img src={dest.image} alt={dest.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <div style={{ position: "absolute", inset: 0, background: selected ? "rgba(99,102,241,0.4)" : "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }} />
                      {selected && (
                        <div style={{ position: "absolute", top: "8px", right: "8px", width: "24px", height: "24px", borderRadius: "50%", background: "var(--brand-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Check size={13} color="white" />
                        </div>
                      )}
                      <div style={{ position: "absolute", bottom: "10px", left: "10px" }}>
                        <div style={{ fontWeight: 700, color: "white", fontSize: "14px" }}>{dest.name}</div>
                        <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "11px" }}>{dest.country}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              {form.destinations.length > 0 && (
                <div style={{ marginTop: "16px", padding: "12px 16px", borderRadius: "10px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "13px", color: "var(--brand-primary)", fontWeight: 600 }}>Selected:</span>
                  {form.destinations.map((d) => (
                    <span key={d} className="tag">{d}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div>
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "14px" }}>What&apos;s the vibe?</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "10px" }}>
                  {MOODS.map((mood) => (
                    <motion.button
                      key={mood.id}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setForm((f) => ({ ...f, mood: mood.label }))}
                      className={`mood-btn ${form.mood === mood.label ? "active" : ""}`}
                    >
                      <span style={{ fontSize: "26px" }}>{mood.emoji}</span>
                      <span style={{ fontWeight: 600, fontSize: "12px" }}>{mood.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "14px" }}>Who&apos;s traveling?</h3>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {TRAVEL_TYPES.map((type) => (
                    <button key={type} onClick={() => setForm((f) => ({ ...f, travelType: type }))} style={{ padding: "8px 16px", borderRadius: "20px", border: `1px solid ${form.travelType === type ? "var(--brand-primary)" : "var(--border)"}`, background: form.travelType === type ? "rgba(99,102,241,0.1)" : "var(--bg-card)", color: form.travelType === type ? "var(--brand-primary)" : "var(--text-secondary)", cursor: "pointer", fontSize: "13px", fontWeight: 500, transition: "all 0.2s" }}>
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "10px" }}>Visibility</h3>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[
                    { id: "private", label: "🔒 Private", desc: "Only you" },
                    { id: "friends", label: "👥 Friends", desc: "Collaborators" },
                    { id: "public", label: "🌐 Public", desc: "Community" },
                  ].map((v) => (
                    <button key={v.id} onClick={() => setForm((f) => ({ ...f, visibility: v.id }))} style={{ flex: 1, padding: "12px 8px", borderRadius: "12px", border: `1px solid ${form.visibility === v.id ? "var(--brand-primary)" : "var(--border)"}`, background: form.visibility === v.id ? "rgba(99,102,241,0.1)" : "var(--bg-card)", color: "var(--text-primary)", cursor: "pointer", fontSize: "12px", fontWeight: form.visibility === v.id ? 700 : 400, textAlign: "center" }}>
                      <div>{v.label}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "2px" }}>{v.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>Invite companions</h3>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>Collaborate and plan together in real-time</p>
              <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                <input className="input" placeholder="Enter email or username..." style={{ flex: 1 }} />
                <button className="btn-primary" style={{ padding: "10px 20px", whiteSpace: "nowrap" }}>Invite</button>
              </div>
              <div style={{ padding: "20px", borderRadius: "14px", background: "var(--bg-primary)", border: "1px solid var(--border)", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
                <Users size={32} style={{ margin: "0 auto 10px", opacity: 0.5 }} />
                <p>No companions added yet.</p>
                <p style={{ fontSize: "12px", marginTop: "4px" }}>You can also add them after creating the trip.</p>
              </div>
              <button className="btn-secondary" style={{ width: "100%", marginTop: "14px", fontSize: "13px" }}>Continue Solo →</button>
            </div>
          )}

          {step === 5 && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              {loading ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "var(--brand-gradient)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                    <Sparkles size={36} color="white" className="float" />
                  </div>
                  <h3 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
                    AI is building your trip...
                  </h3>
                  <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Optimizing routes, budget, and itinerary</p>
                  <div className="ai-typing" style={{ justifyContent: "center", display: "flex", marginTop: "16px" }}>
                    <span /><span /><span />
                  </div>
                </motion.div>
              ) : (
                <div>
                  <h3 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px" }}>Review Your Trip</h3>
                  <div className="card" style={{ padding: "20px", textAlign: "left" }}>
                    {[
                      { label: "Title", value: form.title || "My New Trip", icon: "✈️" },
                      { label: "Dates", value: `${form.startDate || "TBD"} → ${form.endDate || "TBD"}`, icon: "📅" },
                      { label: "Budget", value: form.budget ? `₹${parseInt(form.budget).toLocaleString()}` : "TBD", icon: "💰" },
                      { label: "Destinations", value: form.destinations.join(", ") || "Not selected", icon: "📍" },
                      { label: "Mood", value: form.mood || "Not selected", icon: "😊" },
                      { label: "Visibility", value: form.visibility, icon: "🌐" },
                    ].map((item) => (
                      <div key={item.label} style={{ display: "flex", gap: "12px", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                        <span>{item.icon}</span>
                        <span style={{ fontSize: "13px", color: "var(--text-muted)", minWidth: "90px" }}>{item.label}</span>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", flex: 1 }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div style={{ display: "flex", gap: "12px", marginTop: "36px" }}>
        {step > 1 && (
          <button onClick={() => setStep((s) => s - 1)} className="btn-secondary" style={{ flex: 1 }}>← Back</button>
        )}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNext}
          disabled={loading}
          className="btn-primary"
          style={{ flex: 2, padding: "13px", fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
        >
          {step === STEPS.length ? (
            loading ? "Creating..." : <>Create Trip <Sparkles size={16} /></>
          ) : (
            <>Continue <ChevronRight size={16} /></>
          )}
        </motion.button>
      </div>
    </div>
  );
}
