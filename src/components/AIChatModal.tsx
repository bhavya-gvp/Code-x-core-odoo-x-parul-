"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, MapPin, Wallet, Calendar, Users, ArrowRight, RefreshCw, CheckCircle } from "lucide-react";
import { tripsAPI } from "@/lib/api";

const SUGGESTIONS = [
  "Plan a peaceful 5-day Japan trip under ₹2 lakh",
  "Budget Goa trip with friends this weekend",
  "Romantic Bali honeymoon for 7 days",
  "Nature detox in Manali under ₹25000",
  "Solo backpacking Rajasthan for 3 days",
  "2-day trip near Ahmedabad under ₹3000",
];

const STEPS = [
  "Understanding your travel intent…",
  "Analyzing best destinations…",
  "Validating budget constraints…",
  "Building day-by-day itinerary…",
  "Calculating budget allocation…",
  "Generating AI insights…",
];

type MsgRole = "user" | "ai" | "result";
interface Msg { role: MsgRole; text?: string; data?: any; ts: number; }

interface Props { onClose: () => void; onApply: (d: any) => void; }

export function AIChatModal({ onClose, onApply }: Props) {
  const [msgs, setMsgs]         = useState<Msg[]>([{
    role: "ai",
    text: "Hi! I'm your AI travel planner ✨\n\nTell me about your dream trip — destination, budget, mood, duration — anything. I'll build a complete itinerary for you.",
    ts: Date.now(),
  }]);
  const [input, setInput]       = useState("");
  const [phase, setPhase]       = useState<"idle" | "thinking" | "generating">("idle");
  const [stepIdx, setStepIdx]   = useState(0);
  const [intent, setIntent]     = useState<any>(null);
  const bottomRef               = useRef<HTMLDivElement>(null);
  const textareaRef             = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);
  useEffect(() => { if (phase === "idle") textareaRef.current?.focus(); }, [phase]);

  // Animate thinking steps
  useEffect(() => {
    if (phase === "thinking" || phase === "generating") {
      const max = phase === "thinking" ? 3 : 6;
      if (stepIdx >= max) return;
      const t = setTimeout(() => setStepIdx(i => i + 1), 650);
      return () => clearTimeout(t);
    }
  }, [phase, stepIdx]);

  const push = (msg: Msg) => setMsgs(p => [...p, msg]);

  const buildAIReply = (parsed: any): string => {
    const dest  = parsed.destinations?.join(" & ") || "a great destination";
    const mood  = parsed.mood || "comfortable";
    const days  = parsed.days ? `${parsed.days} days` : "a few days";
    const bud   = parsed.budget ? `₹${Number(parsed.budget).toLocaleString("en-IN")}` : "your budget";
    const warn  = parsed.feasibility?.warnings?.[0] || "";
    const alts  = parsed.feasibility?.recommendedDestinations?.slice(0, 3).join(", ");

    let msg = `Got it ✨\n\nYou want a **${mood}** trip to **${dest}** for **${days}** within **${bud}**.\n\n`;
    if (warn) msg += `⚠️ ${warn}\n\n`;
    if (alts && alts !== dest) msg += `💡 Budget-perfect alternatives: ${alts}\n\n`;
    msg += `I'll optimize for:\n• ${mood} mood activities\n• Realistic daily budget of ₹${Math.round((parsed.budget||30000)/(parsed.days||3)).toLocaleString("en-IN")}/day\n• Low travel fatigue\n• Balanced scheduling\n\nGenerating your full itinerary now… 🗺️`;
    return msg;
  };

  const handleSend = useCallback(async () => {
    const q = input.trim();
    if (!q || phase !== "idle") return;
    setInput("");
    push({ role: "user", text: q, ts: Date.now() });
    setPhase("thinking");
    setStepIdx(0);

    try {
      await new Promise(r => setTimeout(r, 2200));
      const res: any = await tripsAPI.parsePrompt(q);
      const parsed = res.data;
      setIntent(parsed);

      push({ role: "ai", text: buildAIReply(parsed), ts: Date.now() });
      setPhase("generating");
      setStepIdx(0);

      // Derive dates
      let start = parsed.start_date;
      let end   = parsed.end_date;
      if (!start || !end) {
        const s = new Date(); s.setDate(s.getDate() + 14);
        const e = new Date(s); e.setDate(e.getDate() + (parsed.days || 3) - 1);
        start = s.toISOString().split("T")[0];
        end   = e.toISOString().split("T")[0];
      }

      await new Promise(r => setTimeout(r, 4000));
      const gen: any = await tripsAPI.generateTrip({
        destinations: parsed.destinations?.length ? parsed.destinations : ["Goa"],
        budget:       parsed.budget      || 30000,
        mood:         parsed.mood        || "Relax",
        travel_type:  parsed.travel_type || "Solo Adventure",
        travelers:    parsed.travelers   || 1,
        start_date:   start,
        end_date:     end,
        visibility:   "private",
      });

      push({ role: "result", data: gen.data, ts: Date.now() });
      setPhase("idle");
    } catch (err: any) {
      push({ role: "ai", text: `Sorry, something went wrong: ${err?.data?.message || err.message || "Please try again."}`, ts: Date.now() });
      setPhase("idle");
    }
  }, [input, phase]);

  const moodEmoji: Record<string, string> = {
    "Relax": "😌", "Adventure Rush": "⚡", "Nature Detox": "🌿",
    "Romantic Escape": "💕", "Social Trip": "🥂", "Burnout Recovery": "🧘",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
        transition={{ type: "spring", damping: 22, stiffness: 280 }}
        style={{ width: "100%", maxWidth: "620px", height: "82vh", display: "flex", flexDirection: "column", borderRadius: "24px", background: "var(--bg-card)", border: "1px solid rgba(99,102,241,0.3)", boxShadow: "0 0 80px rgba(99,102,241,0.2),0 32px 64px rgba(0,0,0,0.5)", overflow: "hidden" }}
      >
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", background: "linear-gradient(135deg,rgba(99,102,241,0.12),rgba(6,182,212,0.06))", display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          <motion.div animate={{ rotate: [0,15,-15,0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: "36px", height: "36px", borderRadius: "12px", background: "linear-gradient(135deg,#6366f1,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Sparkles size={16} color="white" />
          </motion.div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: "15px", color: "var(--text-primary)" }}>AI Travel Assistant</div>
            <div style={{ fontSize: "11px", color: "#22c55e", display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }} /> Online · Traveloop Intelligence Engine
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}>
            <X size={18} />
          </motion.button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {msgs.map((msg, i) => (
            <motion.div key={msg.ts + i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              {msg.role === "user" && (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ maxWidth: "78%", padding: "10px 14px", borderRadius: "18px 18px 4px 18px", background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "white", fontSize: "13px", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{msg.text}</div>
                </div>
              )}

              {msg.role === "ai" && (
                <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                  <div style={{ width: "30px", height: "30px", borderRadius: "10px", background: "linear-gradient(135deg,#6366f1,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
                    <Sparkles size={13} color="white" />
                  </div>
                  <div style={{ maxWidth: "82%", padding: "10px 14px", borderRadius: "4px 18px 18px 18px", background: "var(--bg-primary)", border: "1px solid var(--border)", fontSize: "13px", color: "var(--text-primary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {msg.text?.split("**").map((chunk, ci) =>
                      ci % 2 === 1 ? <strong key={ci}>{chunk}</strong> : chunk
                    )}
                  </div>
                </div>
              )}

              {msg.role === "result" && msg.data && (
                <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                  <div style={{ width: "30px", height: "30px", borderRadius: "10px", background: "linear-gradient(135deg,#22c55e,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
                    <CheckCircle size={13} color="white" />
                  </div>
                  <div style={{ flex: 1, padding: "14px", borderRadius: "4px 18px 18px 18px", background: "linear-gradient(135deg,rgba(99,102,241,0.08),rgba(6,182,212,0.05))", border: "1px solid rgba(99,102,241,0.2)" }}>
                    <div style={{ fontWeight: 800, fontSize: "15px", color: "var(--text-primary)", marginBottom: "8px" }}>
                      ✅ {msg.data.tripSummary?.title || "Your Trip is Ready!"}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                      {[
                        { label: "Days", value: msg.data.tripSummary?.totalDays, icon: <Calendar size={11} />, color: "#6366f1" },
                        { label: "Budget", value: `₹${Number(msg.data.budgetPlan?.total||0).toLocaleString("en-IN")}`, icon: <Wallet size={11} />, color: "#22c55e" },
                        { label: "Cities", value: msg.data.tripSummary?.cities, icon: <MapPin size={11} />, color: "#06b6d4" },
                      ].map(s => (
                        <div key={s.label} style={{ textAlign: "center", padding: "8px 6px", borderRadius: "8px", background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                          <div style={{ color: s.color, display: "flex", justifyContent: "center", marginBottom: "2px" }}>{s.icon}</div>
                          <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-primary)" }}>{s.value}</div>
                          <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                    {msg.data.insights?.slice(0, 2).map((ins: any, j: number) => (
                      <div key={j} style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "4px" }}>
                        {ins.icon} {ins.text}
                      </div>
                    ))}
                    <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                      {intent && (
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                          onClick={() => { onApply(intent); onClose(); }}
                          className="btn-secondary" style={{ flex: 1, fontSize: "11px", padding: "7px" }}>
                          Auto-fill Form
                        </motion.button>
                      )}
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={() => { window.location.href = "/trips"; }}
                        className="btn-primary" style={{ flex: 2, fontSize: "11px", padding: "7px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                        View Trips <ArrowRight size={12} />
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}

          {/* Thinking / Generating loader */}
          <AnimatePresence>
            {(phase === "thinking" || phase === "generating") && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "10px", background: "linear-gradient(135deg,#6366f1,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}>
                    <Sparkles size={13} color="white" />
                  </motion.div>
                </div>
                <div style={{ padding: "12px 14px", borderRadius: "4px 18px 18px 18px", background: "var(--bg-primary)", border: "1px solid var(--border)", minWidth: "240px" }}>
                  {STEPS.slice(0, phase === "thinking" ? 3 : 6).map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: i <= stepIdx ? 1 : 0.3 }}
                      style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: i < stepIdx ? "#22c55e" : i === stepIdx ? "var(--text-primary)" : "var(--text-muted)", marginBottom: i < 5 ? "4px" : 0 }}>
                      {i < stepIdx ? "✅" : i === stepIdx ? (
                        <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>⏳</motion.span>
                      ) : "○"} {s}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Suggestions (only on first message) */}
        {msgs.length === 1 && phase === "idle" && (
          <div style={{ padding: "0 16px 8px", display: "flex", gap: "6px", flexWrap: "wrap", flexShrink: 0 }}>
            {SUGGESTIONS.map(s => (
              <motion.button key={s} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setInput(s)}
                style={{ padding: "5px 10px", borderRadius: "16px", fontSize: "11px", border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-secondary)", cursor: "pointer", whiteSpace: "nowrap" }}>
                {s}
              </motion.button>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: "10px", alignItems: "flex-end", flexShrink: 0, background: "var(--bg-card)" }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Describe your dream trip…"
            rows={1}
            disabled={phase !== "idle"}
            style={{ flex: 1, padding: "10px 14px", borderRadius: "14px", border: "1px solid rgba(99,102,241,0.3)", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: "13px", resize: "none", outline: "none", fontFamily: "inherit", lineHeight: 1.5, opacity: phase !== "idle" ? 0.5 : 1 }}
          />
          <motion.button
            whileHover={{ scale: phase === "idle" && input.trim() ? 1.08 : 1 }}
            whileTap={{ scale: 0.92 }}
            onClick={handleSend}
            disabled={phase !== "idle" || !input.trim()}
            style={{ width: "40px", height: "40px", borderRadius: "12px", border: "none", background: input.trim() && phase === "idle" ? "linear-gradient(135deg,#6366f1,#06b6d4)" : "var(--border)", cursor: input.trim() && phase === "idle" ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Send size={16} color="white" />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
