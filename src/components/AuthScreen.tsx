"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Globe, Eye, EyeOff, Mail, Lock, User, ArrowRight, Sparkles, Check, AlertCircle } from "lucide-react";
import { useApp } from "@/context/AppContext";

const TRAVEL_FACTS = [
  "🌏 75+ million trips planned with AI",
  "💡 Save up to 40% with smart budgeting",
  "✨ Personalized for 50+ travel personas",
  "🗺️ 180+ countries covered",
];

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ chars", pass: password.length >= 8 },
    { label: "Uppercase", pass: /[A-Z]/.test(password) },
    { label: "Number", pass: /\d/.test(password) },
    { label: "Special", pass: /[!@#$%^&*]/.test(password) },
  ];
  const strength = checks.filter((c) => c.pass).length;
  const colors = ["", "#ef4444", "#f59e0b", "#3b82f6", "#22c55e"];
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  if (!password) return null;
  return (
    <div style={{ marginTop: "8px" }}>
      <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ flex: 1, height: "3px", borderRadius: "2px", background: i <= strength ? colors[strength] : "var(--border)", transition: "all 0.3s" }} />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "11px", color: colors[strength] }}>{labels[strength]}</span>
        <div style={{ display: "flex", gap: "8px" }}>
          {checks.map((c) => (
            <span key={c.label} style={{ fontSize: "10px", color: c.pass ? "#22c55e" : "var(--text-muted)", display: "flex", alignItems: "center", gap: "2px" }}>
              <Check size={8} style={{ opacity: c.pass ? 1 : 0.3 }} /> {c.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AuthScreen() {
  const { login, register, authError, clearAuthError } = useApp();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [factIndex, setFactIndex] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);
  const [forgotSent, setForgotSent] = useState(false);

  // Rotate travel facts
  useState(() => {
    const interval = setInterval(() => setFactIndex((p) => (p + 1) % TRAVEL_FACTS.length), 3000);
    return () => clearInterval(interval);
  });

  const displayError = authError || localError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();

    if (!form.email) { setLocalError("Email is required."); return; }
    if (!form.password) { setLocalError("Password is required."); return; }
    if (mode === "signup" && !form.name) { setLocalError("Name is required."); return; }
    if (mode === "signup" && form.password.length < 6) {
      setLocalError("Password must be at least 6 characters."); return;
    }

    setLoading(true);
    let ok = false;
    if (mode === "login") {
      ok = await login(form.email, form.password);
    } else {
      ok = await register(form.name, form.email, form.password);
    }
    setLoading(false);
    if (!ok) {
      // authError is already set in context
    }
  };

  const switchMode = (m: "login" | "signup") => {
    setMode(m);
    setLocalError(null);
    clearAuthError();
    setForm({ name: "", email: "", password: "" });
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", position: "relative", overflow: "hidden", background: "var(--bg-primary)" }}>
      {/* Animated background */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <div className="blob blob-1" style={{ width: "500px", height: "500px", top: "-100px", left: "-100px" }} />
        <div className="blob blob-2" style={{ width: "400px", height: "400px", bottom: "-100px", right: "30%" }} />
        <div className="blob blob-3" style={{ width: "350px", height: "350px", top: "40%", right: "-50px" }} />
      </div>

      {/* Left Hero Panel */}
      <div style={{ flex: 1, display: "none", flexDirection: "column", justifyContent: "center", padding: "60px", position: "relative", minHeight: "100vh" }} className="lg-flex">
        <style>{`.lg-flex { display: flex; } @media (max-width: 1023px) { .lg-flex { display: none !important; } }`}</style>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "60px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "16px", background: "var(--brand-gradient-vivid)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Globe size={24} color="white" />
            </div>
            <div>
              <div style={{ fontSize: "24px", fontWeight: 900, background: "var(--brand-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Traveloop AI</div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Intelligent Travel OS</div>
            </div>
          </div>
          <h1 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 900, lineHeight: 1.1, marginBottom: "20px", color: "var(--text-primary)" }}>
            Your trip should<br />
            <span style={{ background: "var(--brand-gradient-vivid)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>adapt to YOU</span> —<br />
            not the other way
          </h1>
          <p style={{ fontSize: "16px", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "40px", maxWidth: "420px" }}>
            AI-powered travel planning that understands your personality, budget, and dreams. Build real itineraries — backed by a real database.
          </p>
          <AnimatePresence mode="wait">
            <motion.div
              key={factIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ padding: "12px 20px", borderRadius: "12px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", color: "var(--brand-primary)", fontSize: "14px", fontWeight: 500, display: "inline-block", marginBottom: "32px" }}
            >
              {TRAVEL_FACTS[factIndex]}
            </motion.div>
          </AnimatePresence>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "380px" }}>
            {[
              { label: "AI Itinerary", desc: "Tokyo · 5 days · ₹180k — real-time generated", img: "🗾" },
              { label: "Smart Budget", desc: "Saved ₹12,000 · AI optimizer active", img: "💰" },
              { label: "Travel Mood", desc: "Burnout Recovery mode personalized", img: "🌿" },
            ].map((card, i) => (
              <motion.div key={card.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 + 0.3 }} className="glass-strong" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "12px" }}>
                <div style={{ fontSize: "24px" }}>{card.img}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)" }}>{card.label}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{card.desc}</div>
                </div>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px", color: "#22c55e", fontSize: "12px" }}>
                  <Sparkles size={12} /> AI
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Auth Panel */}
      <div style={{ width: "100%", maxWidth: "480px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 20px", position: "relative", zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-strong" style={{ width: "100%", maxWidth: "420px", borderRadius: "24px", padding: "36px 32px" }}>

          {/* Mobile logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "28px" }} className="lg-hide">
            <style>{`.lg-hide { display: flex; } @media (min-width: 1024px) { .lg-hide { display: none !important; } }`}</style>
            <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "var(--brand-gradient-vivid)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Globe size={18} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: "18px", background: "var(--brand-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Traveloop AI</span>
          </div>

          {/* Mode Tabs */}
          <div style={{ display: "flex", gap: "4px", padding: "4px", borderRadius: "12px", background: "var(--bg-primary)", marginBottom: "28px" }}>
            {(["login", "signup"] as const).map((m) => (
              <button key={m} onClick={() => switchMode(m)} style={{ flex: 1, padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "13px", transition: "all 0.2s", background: mode === m ? "var(--brand-gradient)" : "transparent", color: mode === m ? "white" : "var(--text-secondary)" }}>
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {mode === "forgot" ? (
              <motion.div key="forgot" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px", color: "var(--text-primary)" }}>Reset Password</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "24px" }}>We&apos;ll send a reset link to your email</p>
                {forgotSent ? (
                  <div style={{ padding: "16px", borderRadius: "12px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e", fontSize: "14px", marginBottom: "16px" }}>
                    ✅ Reset link sent! Check your inbox.
                  </div>
                ) : (
                  <>
                    <div style={{ position: "relative", marginBottom: "16px" }}>
                      <Mail size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                      <input className="input" placeholder="your@email.com" style={{ paddingLeft: "42px" }} />
                    </div>
                    <button className="btn-primary" style={{ width: "100%", padding: "12px" }} onClick={() => setForgotSent(true)}>Send Reset Link</button>
                  </>
                )}
                <button onClick={() => setMode("login")} style={{ marginTop: "12px", background: "none", border: "none", color: "var(--brand-primary)", cursor: "pointer", fontSize: "13px", width: "100%" }}>← Back to Sign In</button>
              </motion.div>
            ) : (
              <motion.form key={mode} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleSubmit}>
                <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "6px", color: "var(--text-primary)" }}>
                  {mode === "login" ? "Welcome back, explorer 🌍" : "Start your journey 🚀"}
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "24px" }}>
                  {mode === "login" ? "Sign in to your Traveloop account" : "Create your account — it's free"}
                </p>

                {/* Error banner */}
                <AnimatePresence>
                  {displayError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ marginBottom: "16px", padding: "12px 14px", borderRadius: "10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}
                    >
                      <AlertCircle size={14} style={{ flexShrink: 0 }} />
                      {displayError}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {mode === "signup" && (
                    <div style={{ position: "relative" }}>
                      <User size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                      <input id="auth-name" className="input" placeholder="Full Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={{ paddingLeft: "42px" }} autoComplete="name" />
                    </div>
                  )}
                  <div style={{ position: "relative" }}>
                    <Mail size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input id="auth-email" className="input" type="email" placeholder="Email address" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} style={{ paddingLeft: "42px" }} autoComplete="email" />
                  </div>
                  <div>
                    <div style={{ position: "relative" }}>
                      <Lock size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                      <input id="auth-password" className="input" type={showPassword ? "text" : "password"} placeholder="Password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} style={{ paddingLeft: "42px", paddingRight: "42px" }} autoComplete={mode === "login" ? "current-password" : "new-password"} />
                      <button type="button" onClick={() => setShowPassword((s) => !s)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {mode === "signup" && <PasswordStrength password={form.password} />}
                  </div>

                  {mode === "login" && (
                    <div style={{ textAlign: "right" }}>
                      <button type="button" onClick={() => setMode("forgot")} style={{ background: "none", border: "none", color: "var(--brand-primary)", cursor: "pointer", fontSize: "12px" }}>
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading}
                    className="btn-primary"
                    style={{ padding: "13px", fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", opacity: loading ? 0.85 : 1 }}
                  >
                    {loading ? (
                      <>
                        <div style={{ width: "18px", height: "18px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", animation: "spin 0.7s linear infinite" }} />
                        {mode === "login" ? "Signing in..." : "Creating account..."}
                      </>
                    ) : (
                      <>
                        {mode === "login" ? "Sign In" : "Create Account"}
                        <ArrowRight size={16} />
                      </>
                    )}
                  </motion.button>
                </div>

                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

                {/* Demo hint */}
                <div style={{ marginTop: "16px", padding: "10px 14px", borderRadius: "10px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", fontSize: "12px", color: "var(--text-secondary)" }}>
                  <span style={{ fontWeight: 600, color: "var(--brand-primary)" }}>Demo mode:</span> Register a free account — no credit card required.
                  {mode === "login" && <> Or use <strong>arjun@traveloop.ai</strong> / <strong>Admin@1234</strong></>}
                </div>

                <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)", marginTop: "20px" }}>
                  By continuing, you agree to our{" "}
                  <span style={{ color: "var(--brand-primary)", cursor: "pointer" }}>Terms</span> &amp;{" "}
                  <span style={{ color: "var(--brand-primary)", cursor: "pointer" }}>Privacy Policy</span>
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
