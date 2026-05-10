"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Loader2, MapPin, Wallet, Calendar, Users, Wand2, AlertTriangle, CheckCircle, ArrowRight, RefreshCw } from "lucide-react";
import { tripsAPI } from "@/lib/api";

// ── Suggested prompts ───────────────────────────────────────
const SUGGESTIONS = [
  "Plan a peaceful 5-day Japan trip under ₹2 lakh",
  "Budget Goa trip with friends for a weekend",
  "Romantic Bali honeymoon for 7 days",
  "Nature detox in Manali for 4 days under ₹25000",
  "Solo backpacking trip to Rajasthan for 3 days",
  "Family Kerala trip for 6 days with ₹80000 budget",
  "Cheap 2-day trip near Ahmedabad",
  "Adventure Ladakh trip for 8 days",
];

const GENERATION_STEPS = [
  { icon: "🔍", label: "Parsing your travel intent…" },
  { icon: "🗺️", label: "Analyzing destinations…" },
  { icon: "💰", label: "Validating budget constraints…" },
  { icon: "📅", label: "Structuring itinerary…" },
  { icon: "⚡", label: "Assigning activities…" },
  { icon: "✨", label: "Generating AI insights…" },
];

interface ParsedIntent {
  destinations: string[];
  budget: number;
  mood: string;
  travel_type: string;
  travelers: number;
  start_date: string | null;
  end_date: string | null;
  days: number;
  confidence: number;
  feasibility: {
    valid: boolean;
    warnings: string[];
    budgetTier: string;
    recommendedDestinations: string[];
    infeasibleDestinations: string[];
  } | null;
  raw: string;
}

interface AIPlannerModalProps {
  onClose: () => void;
  onApply: (intent: ParsedIntent) => void;
}

export function AIPlannerModal({ onClose, onApply }: AIPlannerModalProps) {
  const [prompt, setPrompt]             = useState("");
  const [phase, setPhase]               = useState<"input" | "parsing" | "review" | "generating" | "done">("input");
  const [stepIndex, setStepIndex]       = useState(0);
  const [intent, setIntent]             = useState<ParsedIntent | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [generatedTrip, setGeneratedTrip] = useState<any>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // ── Animate generation steps ────────────────────────────
  useEffect(() => {
    if (phase !== "parsing" && phase !== "generating") return;
    const steps = phase === "generating" ? GENERATION_STEPS : GENERATION_STEPS.slice(0, 3);
    if (stepIndex >= steps.length) return;
    const timer = setTimeout(() => setStepIndex(i => i + 1), 700);
    return () => clearTimeout(timer);
  }, [phase, stepIndex]);

  // ── Step 1: Parse prompt ────────────────────────────────
  const handleParse = useCallback(async () => {
    if (!prompt.trim() || phase !== "input") return;
    setError(null);
    setPhase("parsing");
    setStepIndex(0);

    try {
      await new Promise(r => setTimeout(r, 2100)); // allow animation
      const res: any = await tripsAPI.parsePrompt(prompt);
      setIntent(res.data);
      setPhase("review");
    } catch (e: any) {
      setError(e?.data?.message || "Could not parse prompt. Try rephrasing.");
      setPhase("input");
    }
  }, [prompt, phase]);

  // ── Step 2: Generate full trip ──────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!intent) return;
    setPhase("generating");
    setStepIndex(0);
    setError(null);

    // Derive dates if not provided
    let start = intent.start_date;
    let end   = intent.end_date;
    if (!start || !end) {
      const s = new Date(); s.setDate(s.getDate() + 14);
      const e = new Date(s); e.setDate(e.getDate() + (intent.days || 3) - 1);
      start = s.toISOString().split("T")[0];
      end   = e.toISOString().split("T")[0];
    }

    try {
      await new Promise(r => setTimeout(r, 4200)); // allow steps to animate
      const res: any = await tripsAPI.generateTrip({
        destinations: intent.destinations,
        budget:       intent.budget,
        mood:         intent.mood,
        travel_type:  intent.travel_type,
        travelers:    intent.travelers,
        start_date:   start,
        end_date:     end,
        visibility:   "private",
      });
      setGeneratedTrip(res.data);
      setPhase("done");
    } catch (e: any) {
      setError(e?.data?.message || "Generation failed. Please try again.");
      setPhase("review");
    }
  }, [intent]);

  // ── Step 3: Apply to form ───────────────────────────────
  const handleApply = () => {
    if (intent) onApply(intent);
    onClose();
  };

  const handleSuggestion = (s: string) => { setPrompt(s); };

  const moodEmoji: Record<string,string> = {
    "Relax":"😌","Adventure Rush":"⚡","Nature Detox":"🌿",
    "Romantic Escape":"💕","Social Trip":"🥂","Burnout Recovery":"🧘"
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 24 }}
        transition={{ type: "spring", damping: 22, stiffness: 300 }}
        style={{
          width: "100%", maxWidth: "640px",
          borderRadius: "24px",
          background: "var(--bg-card)",
          border: "1px solid rgba(99,102,241,0.3)",
          boxShadow: "0 0 60px rgba(99,102,241,0.2), 0 24px 48px rgba(0,0,0,0.4)",
          overflow: "hidden",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* ── Header ── */}
        <div style={{
          padding: "20px 24px 16px", borderBottom: "1px solid var(--border)",
          background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(6,182,212,0.06))",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              style={{
                width: "38px", height: "38px", borderRadius: "12px",
                background: "linear-gradient(135deg, #6366f1, #06b6d4)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Sparkles size={18} color="white" />
            </motion.div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "16px", color: "var(--text-primary)" }}>AI Trip Planner</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Powered by Traveloop Intelligence Engine</div>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}>
            <X size={20} />
          </motion.button>
        </div>

        <div style={{ padding: "24px" }}>

          {/* ════ PHASE: INPUT ════ */}
          {phase === "input" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "16px", lineHeight: 1.6 }}>
                Describe your dream trip in plain English. I'll extract the details and build a full itinerary.
              </p>

              {/* Prompt input */}
              <div style={{ position: "relative", marginBottom: "16px" }}>
                <textarea
                  ref={inputRef}
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleParse(); } }}
                  placeholder="e.g. Plan a peaceful 5-day Japan trip under ₹2 lakh for a couple..."
                  rows={3}
                  style={{
                    width: "100%", padding: "14px 50px 14px 16px",
                    borderRadius: "14px", resize: "none",
                    border: "1px solid rgba(99,102,241,0.4)",
                    background: "var(--bg-primary)",
                    color: "var(--text-primary)", fontSize: "14px", lineHeight: 1.6,
                    outline: "none", fontFamily: "inherit",
                    boxShadow: "0 0 0 0 rgba(99,102,241,0)",
                    transition: "box-shadow 0.2s",
                  }}
                  onFocus={e => { e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.2)"; }}
                  onBlur={e => { e.target.style.boxShadow = "0 0 0 0 rgba(99,102,241,0)"; }}
                />
                <motion.button
                  whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                  onClick={handleParse}
                  disabled={prompt.trim().length < 3}
                  style={{
                    position: "absolute", right: "10px", bottom: "10px",
                    width: "34px", height: "34px", borderRadius: "10px",
                    background: prompt.trim().length >= 3 ? "linear-gradient(135deg,#6366f1,#06b6d4)" : "var(--border)",
                    border: "none", cursor: prompt.trim().length >= 3 ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s",
                  }}
                >
                  <Send size={14} color="white" />
                </motion.button>
              </div>

              {error && (
                <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", fontSize: "13px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <AlertTriangle size={14} /> {error}
                </div>
              )}

              {/* Suggestions */}
              <div style={{ marginBottom: "4px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Try these</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {SUGGESTIONS.map(s => (
                    <motion.button key={s} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => handleSuggestion(s)}
                      style={{
                        padding: "6px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 500,
                        border: "1px solid var(--border)", background: "var(--bg-primary)",
                        color: "var(--text-secondary)", cursor: "pointer", transition: "all 0.15s",
                        textAlign: "left",
                      }}
                    >{s}</motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ════ PHASE: PARSING / GENERATING ════ */}
          {(phase === "parsing" || phase === "generating") && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ textAlign: "center", padding: "20px 0" }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                style={{ display: "inline-flex", marginBottom: "20px",
                  width: "56px", height: "56px", borderRadius: "50%",
                  background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                  alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 30px rgba(99,102,241,0.4)" }}
              >
                <Sparkles size={24} color="white" />
              </motion.div>

              <div style={{ fontWeight: 700, fontSize: "16px", color: "var(--text-primary)", marginBottom: "6px" }}>
                {phase === "parsing" ? "Understanding your request…" : "Building your itinerary…"}
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "28px" }}>
                This takes just a moment
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", textAlign: "left" }}>
                {GENERATION_STEPS.slice(0, phase === "parsing" ? 3 : 6).map((step, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: i <= stepIndex ? 1 : 0.25, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px",
                      borderRadius: "10px",
                      background: i < stepIndex ? "rgba(34,197,94,0.08)" : i === stepIndex ? "rgba(99,102,241,0.08)" : "transparent",
                      border: `1px solid ${i < stepIndex ? "rgba(34,197,94,0.2)" : i === stepIndex ? "rgba(99,102,241,0.2)" : "transparent"}`,
                    }}>
                    <span style={{ fontSize: "16px" }}>{step.icon}</span>
                    <span style={{ fontSize: "13px", color: i <= stepIndex ? "var(--text-primary)" : "var(--text-muted)", flex: 1 }}>{step.label}</span>
                    {i < stepIndex && <CheckCircle size={14} color="#22c55e" />}
                    {i === stepIndex && <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><Loader2 size={14} color="#6366f1" /></motion.div>}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ════ PHASE: REVIEW ════ */}
          {phase === "review" && intent && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <CheckCircle size={16} color="#22c55e" />
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                  Intent understood ({intent.confidence}% confidence)
                </span>
                <motion.button whileHover={{ scale: 1.05 }} onClick={() => { setPhase("input"); setIntent(null); }}
                  style={{ marginLeft: "auto", background: "none", border: "1px solid var(--border)", borderRadius: "8px", padding: "4px 10px", fontSize: "11px", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                  <RefreshCw size={11} /> Re-type
                </motion.button>
              </div>

              {/* Parsed prompt pill */}
              <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px", fontStyle: "italic" }}>
                "{intent.raw}"
              </div>

              {/* Extracted fields grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                {[
                  { icon: <MapPin size={13} />, label: "Destinations", value: intent.destinations?.join(", ") || "Auto-selected", color: "#6366f1" },
                  { icon: <Wallet size={13} />, label: "Budget", value: intent.budget ? `₹${intent.budget.toLocaleString("en-IN")}` : "Auto", color: "#22c55e" },
                  { icon: <Calendar size={13} />, label: "Duration", value: intent.days ? `${intent.days} days` : "Flexible", color: "#06b6d4" },
                  { icon: <Users size={13} />, label: "Travelers", value: String(intent.travelers || 1), color: "#a855f7" },
                  { icon: <span style={{ fontSize: "13px" }}>{moodEmoji[intent.mood] || "✈️"}</span>, label: "Mood", value: intent.mood || "Relax", color: "#f59e0b" },
                  { icon: <Wand2 size={13} />, label: "Style", value: intent.travel_type || "Solo Adventure", color: "#ec4899" },
                ].map(({ icon, label, value, color }) => (
                  <div key={label} style={{ padding: "10px 12px", borderRadius: "10px", background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", color, marginBottom: "3px" }}>
                      {icon}
                      <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</span>
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Warnings */}
              {intent.feasibility?.warnings?.map((w, i) => (
                <div key={i} style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", fontSize: "12px", marginBottom: "8px", display: "flex", gap: "8px" }}>
                  <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: "1px" }} /> {w}
                </div>
              ))}

              {/* Recommended alternatives if infeasible */}
              {(intent.feasibility?.recommendedDestinations?.length ?? 0) > 0 && (
                <div style={{ marginBottom: "14px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>Budget-appropriate options</div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {intent.feasibility!.recommendedDestinations.map(d => (
                      <span key={d} className="tag" style={{ cursor: "pointer", fontSize: "11px" }} onClick={() => setIntent(prev => prev ? { ...prev, destinations: [d] } : prev)}>{d}</span>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", fontSize: "13px", marginBottom: "14px", display: "flex", gap: "8px" }}>
                  <AlertTriangle size={14} /> {error}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
                <button onClick={handleApply} className="btn-secondary" style={{ flex: 1, fontSize: "13px" }}>
                  Auto-fill Form Only
                </button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleGenerate} className="btn-primary"
                  style={{ flex: 2, fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  <Sparkles size={14} /> Generate Full Itinerary
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ════ PHASE: DONE ════ */}
          {phase === "done" && generatedTrip && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</motion.div>
                <div style={{ fontWeight: 800, fontSize: "18px", color: "var(--text-primary)", marginBottom: "6px" }}>
                  {generatedTrip.tripSummary?.title || "Your Trip is Ready!"}
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  {generatedTrip.tripSummary?.totalDays} days · {generatedTrip.tripSummary?.cities} cities · {generatedTrip.tripSummary?.travelers} traveler(s)
                </div>
              </div>

              {/* Quick stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px", marginBottom: "16px" }}>
                {[
                  { label: "Budget", value: `₹${Number(generatedTrip.budgetPlan?.total || 0).toLocaleString("en-IN")}`, color: "#22c55e" },
                  { label: "Fatigue", value: `${generatedTrip.fatigueScore}/100`, color: generatedTrip.fatigueScore > 60 ? "#ef4444" : "#6366f1" },
                  { label: "Insights", value: `${generatedTrip.insights?.length || 0} tips`, color: "#f59e0b" },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: "center", padding: "12px 8px", borderRadius: "10px", background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
                    <div style={{ fontWeight: 800, fontSize: "16px", color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Insights */}
              {generatedTrip.insights?.slice(0, 2).map((ins: any, i: number) => (
                <div key={i} style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px", lineHeight: 1.5, display: "flex", gap: "8px" }}>
                  <span>{ins.icon}</span> <span>{ins.text}</span>
                </div>
              ))}

              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <button onClick={onClose} className="btn-secondary" style={{ flex: 1, fontSize: "13px" }}>Close</button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => { window.location.href = "/trips"; }}
                  className="btn-primary"
                  style={{ flex: 2, fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  View My Trips <ArrowRight size={14} />
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
