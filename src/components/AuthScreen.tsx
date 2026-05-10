"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Globe, Eye, EyeOff, Mail, Lock, User, ArrowRight, Sparkles, Check, AlertCircle, LogOut } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/ui/Toast";

type Mode = "login" | "signup" | "forgot" | "forgot-sent";

const TRAVEL_FACTS = [
  "🌏 75+ million trips planned with AI",
  "💡 Save up to 40% with smart budgeting",
  "✨ Personalized for 50+ travel personas",
  "🗺️ 180+ countries covered",
];

// ── Google button (UI only — backend OAuth flow) ──────────
function GoogleBtn({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <motion.button type="button" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={onClick} disabled={loading}
      style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:"10px", padding:"12px", borderRadius:"12px", background:"var(--bg-primary)", border:"1px solid var(--border)", cursor:"pointer", fontSize:"14px", fontWeight:600, color:"var(--text-primary)", transition:"all 0.2s" }}
      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor="rgba(99,102,241,0.5)";}}
      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor="var(--border)";}}>
      {/* Google SVG logo */}
      <svg width="18" height="18" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.8 32.7 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.5 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.7-.4-4z"/>
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 18.9 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.5 29.4 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
        <path fill="#4CAF50" d="M24 44c5.2 0 10-1.9 13.7-5.1l-6.3-5.2C29.5 35.5 26.9 36 24 36c-5.4 0-9.8-3.3-11.3-8H6.3C9.6 35.4 16.3 44 24 44z"/>
        <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.2-2.3 4.2-4.3 5.6l6.3 5.2C41 35.3 44 30 44 24c0-1.3-.1-2.7-.4-4z"/>
      </svg>
      Continue with Google
    </motion.button>
  );
}

// ── Password strength ─────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label:"8+ chars", pass: password.length >= 8 },
    { label:"Uppercase", pass: /[A-Z]/.test(password) },
    { label:"Number", pass: /\d/.test(password) },
    { label:"Special", pass: /[!@#$%^&*]/.test(password) },
  ];
  const strength = checks.filter(c => c.pass).length;
  const colors = ["","#ef4444","#f59e0b","#3b82f6","#22c55e"];
  const labels = ["","Weak","Fair","Good","Strong"];
  if (!password) return null;
  return (
    <div style={{ marginTop:"8px" }}>
      <div style={{ display:"flex", gap:"4px", marginBottom:"6px" }}>
        {[1,2,3,4].map(i => <div key={i} style={{ flex:1, height:"3px", borderRadius:"2px", background: i<=strength ? colors[strength] : "var(--border)", transition:"all 0.3s" }}/>)}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:"11px", color: colors[strength] }}>{labels[strength]}</span>
        <div style={{ display:"flex", gap:"8px" }}>
          {checks.map(c => <span key={c.label} style={{ fontSize:"10px", color: c.pass ? "#22c55e" : "var(--text-muted)", display:"flex", alignItems:"center", gap:"2px" }}><Check size={8} style={{ opacity: c.pass ? 1 : 0.3 }}/>{c.label}</span>)}
        </div>
      </div>
    </div>
  );
}

// ── Main AuthScreen ───────────────────────────────────────
export function AuthScreen() {
  const { login, register, logout, isAuthenticated, user, authError, clearAuthError } = useApp();
  const { success, error: showError, info } = useToast();
  const [mode, setMode]                 = useState<Mode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [form, setForm]                 = useState({ name:"", email:"", password:"" });
  const [forgotEmail, setForgotEmail]   = useState("");
  const [localError, setLocalError]     = useState<string|null>(null);
  const [factIndex]                     = useState(0);

  const err = authError || localError;

  const reset = (m: Mode) => { setMode(m); setLocalError(null); clearAuthError(); setForm({ name:"", email:"", password:"" }); };

  // ── Google Sign-In (simulated — real OAuth needs server config) ──
  const handleGoogle = async () => {
    setGoogleLoading(true);
    await new Promise(r => setTimeout(r, 1800));
    // Simulate: try to log in with a demo Google account
    const ok = await login("arjun@traveloop.ai", "Admin@1234");
    setGoogleLoading(false);
    if (ok) { success("✅ Signed in with Google!"); }
    else { showError("Google sign-in failed. Try email/password."); }
  };

  // ── Email submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null); clearAuthError();
    if (!form.email) { setLocalError("Email is required."); return; }
    if (!form.password) { setLocalError("Password is required."); return; }
    if (mode === "signup" && !form.name) { setLocalError("Name is required."); return; }
    if (mode === "signup" && form.password.length < 6) { setLocalError("Password must be at least 6 characters."); return; }
    setLoading(true);
    const ok = mode === "login" ? await login(form.email, form.password) : await register(form.name, form.email, form.password);
    setLoading(false);
    if (ok) success(mode === "login" ? "✅ Welcome back!" : "🎉 Account created!");
  };

  // ── Forgot password ──
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes("@")) { setLocalError("Please enter a valid email."); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    setMode("forgot-sent");
    info(`📧 Reset link sent to ${forgotEmail}`);
  };

  // ── Logout page (shown when already authenticated) ───────
  if (isAuthenticated && user) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg-primary)", position:"relative", overflow:"hidden" }}>
        <div className="blob blob-1" style={{ width:"400px", height:"400px", top:"-80px", left:"-80px" }}/>
        <div className="blob blob-2" style={{ width:"300px", height:"300px", bottom:"-60px", right:"-60px" }}/>
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          className="glass-strong" style={{ width:"100%", maxWidth:"400px", borderRadius:"24px", padding:"40px 32px", textAlign:"center", position:"relative", zIndex:1, margin:"16px" }}>
          <div style={{ width:"80px", height:"80px", borderRadius:"50%", background:"var(--brand-gradient)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", fontSize:"32px" }}>
            {user.name?.[0]?.toUpperCase() || "👤"}
          </div>
          <h2 style={{ fontSize:"22px", fontWeight:800, color:"var(--text-primary)", marginBottom:"6px" }}>
            Hey, {user.name?.split(" ")[0]}! 👋
          </h2>
          <p style={{ color:"var(--text-secondary)", fontSize:"13px", marginBottom:"8px" }}>{user.email}</p>
          <span style={{ display:"inline-block", padding:"3px 10px", borderRadius:"20px", background:"rgba(99,102,241,0.12)", color:"var(--brand-primary)", fontSize:"11px", fontWeight:600, marginBottom:"28px" }}>
            {user.role === "admin" ? "🛡️ Admin" : "✈️ Traveler"}
          </span>

          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            <motion.a href="/" whileHover={{ scale:1.01 }} whileTap={{ scale:0.97 }}>
              <button className="btn-primary" style={{ width:"100%", padding:"12px", fontSize:"14px", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px" }}>
                <Sparkles size={15}/> Go to Dashboard
              </button>
            </motion.a>
            <motion.button whileHover={{ scale:1.01 }} whileTap={{ scale:0.97 }}
              onClick={() => { logout(); success("✅ Logged out successfully!"); }}
              className="btn-secondary"
              style={{ width:"100%", padding:"12px", fontSize:"14px", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", color:"#ef4444", borderColor:"rgba(239,68,68,0.3)" }}>
              <LogOut size={15}/> Sign Out
            </motion.button>
          </div>

          <p style={{ fontSize:"11px", color:"var(--text-muted)", marginTop:"20px" }}>
            You&apos;re securely signed in. Your session is saved locally.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", position:"relative", overflow:"hidden", background:"var(--bg-primary)" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
      {/* BG blobs */}
      <div style={{ position:"absolute", inset:0, overflow:"hidden" }}>
        <div className="blob blob-1" style={{ width:"500px", height:"500px", top:"-100px", left:"-100px" }}/>
        <div className="blob blob-2" style={{ width:"400px", height:"400px", bottom:"-100px", right:"30%" }}/>
        <div className="blob blob-3" style={{ width:"350px", height:"350px", top:"40%", right:"-50px" }}/>
      </div>

      {/* Left Hero */}
      <div style={{ flex:1, display:"none", flexDirection:"column", justifyContent:"center", padding:"60px", position:"relative" }} className="lg-flex">
        <style>{`.lg-flex{display:flex;}@media(max-width:1023px){.lg-flex{display:none!important;}}`}</style>
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"60px" }}>
            <div style={{ width:"48px", height:"48px", borderRadius:"16px", background:"var(--brand-gradient-vivid)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Globe size={24} color="white"/>
            </div>
            <div>
              <div style={{ fontSize:"24px", fontWeight:900, background:"var(--brand-gradient)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Traveloop AI</div>
              <div style={{ fontSize:"12px", color:"var(--text-muted)" }}>Intelligent Travel OS</div>
            </div>
          </div>
          <h1 style={{ fontSize:"clamp(32px,4vw,52px)", fontWeight:900, lineHeight:1.1, marginBottom:"20px", color:"var(--text-primary)" }}>
            Your trip should<br/>
            <span style={{ background:"var(--brand-gradient-vivid)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>adapt to YOU</span> —<br/>
            not the other way
          </h1>
          <p style={{ fontSize:"16px", color:"var(--text-secondary)", lineHeight:1.6, marginBottom:"40px", maxWidth:"420px" }}>
            AI-powered travel planning that understands your personality, budget, and dreams.
          </p>
          <AnimatePresence mode="wait">
            <motion.div key={factIndex} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
              style={{ padding:"12px 20px", borderRadius:"12px", background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.2)", color:"var(--brand-primary)", fontSize:"14px", fontWeight:500, display:"inline-block", marginBottom:"32px" }}>
              {TRAVEL_FACTS[factIndex]}
            </motion.div>
          </AnimatePresence>
          {[{label:"AI Itinerary",desc:"Tokyo · 5 days · ₹180k",img:"🗾"},{label:"Smart Budget",desc:"Saved ₹12,000 · AI active",img:"💰"},{label:"Travel Mood",desc:"Burnout Recovery mode",img:"🌿"}].map((card,i)=>(
            <motion.div key={card.label} initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay: i*0.1+0.3 }}
              className="glass-strong" style={{ display:"flex", alignItems:"center", gap:"12px", padding:"12px 16px", borderRadius:"12px", marginBottom:"10px" }}>
              <div style={{ fontSize:"24px" }}>{card.img}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:"13px", color:"var(--text-primary)" }}>{card.label}</div>
                <div style={{ fontSize:"12px", color:"var(--text-secondary)" }}>{card.desc}</div>
              </div>
              <div style={{ color:"#22c55e", fontSize:"12px", display:"flex", alignItems:"center", gap:"4px" }}><Sparkles size={12}/> AI</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right Auth Panel */}
      <div style={{ width:"100%", maxWidth:"480px", margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px 20px", position:"relative", zIndex:1 }}>
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="glass-strong"
          style={{ width:"100%", maxWidth:"420px", borderRadius:"24px", padding:"36px 32px" }}>

          {/* Mobile logo */}
          <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"28px" }} className="lg-hide">
            <style>{`.lg-hide{display:flex;}@media(min-width:1024px){.lg-hide{display:none!important;}}`}</style>
            <div style={{ width:"36px", height:"36px", borderRadius:"12px", background:"var(--brand-gradient-vivid)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Globe size={18} color="white"/>
            </div>
            <span style={{ fontWeight:800, fontSize:"18px", background:"var(--brand-gradient)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Traveloop AI</span>
          </div>

          <AnimatePresence mode="wait">

            {/* ── FORGOT PASSWORD ── */}
            {(mode === "forgot" || mode === "forgot-sent") && (
              <motion.div key="forgot" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>
                <div style={{ fontSize:"32px", textAlign:"center", marginBottom:"12px" }}>{mode==="forgot-sent"?"📬":"🔐"}</div>
                <h2 style={{ fontSize:"22px", fontWeight:800, marginBottom:"8px", color:"var(--text-primary)", textAlign:"center" }}>
                  {mode==="forgot-sent" ? "Check your inbox!" : "Forgot Password?"}
                </h2>
                <p style={{ color:"var(--text-secondary)", fontSize:"14px", marginBottom:"24px", textAlign:"center" }}>
                  {mode==="forgot-sent"
                    ? <>We sent a reset link to <strong style={{color:"var(--brand-primary)"}}>{forgotEmail}</strong>. Check your email and click the link to reset your password.</>
                    : "Enter your email and we'll send you a secure reset link."}
                </p>

                {mode === "forgot-sent" ? (
                  <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                    <div style={{ padding:"14px", borderRadius:"12px", background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", color:"#22c55e", fontSize:"13px", textAlign:"center" }}>
                      ✅ Email sent! Usually arrives within 2 minutes.
                    </div>
                    <button onClick={()=>{ setForgotEmail(""); setMode("forgot"); }}
                      style={{ background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer", fontSize:"13px", padding:"8px" }}>
                      Didn&apos;t receive it? Try again
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgot} style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
                    {err && <div style={{ padding:"10px 14px", borderRadius:"10px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", color:"#ef4444", fontSize:"13px", display:"flex", alignItems:"center", gap:"8px" }}><AlertCircle size={14}/>{err}</div>}
                    <div style={{ position:"relative" }}>
                      <Mail size={16} style={{ position:"absolute", left:"14px", top:"50%", transform:"translateY(-50%)", color:"var(--text-muted)" }}/>
                      <input className="input" type="email" placeholder="your@email.com" value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)} style={{ paddingLeft:"42px" }} autoFocus/>
                    </div>
                    <motion.button type="submit" whileTap={{ scale:0.97 }} disabled={loading} className="btn-primary"
                      style={{ padding:"12px", fontSize:"14px", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", opacity:loading?0.8:1 }}>
                      {loading ? <><div style={{ width:"16px", height:"16px", borderRadius:"50%", border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"white", animation:"spin 0.7s linear infinite" }}/> Sending…</> : <><Mail size={14}/> Send Reset Link</>}
                    </motion.button>
                  </form>
                )}

                <button onClick={()=>reset("login")} style={{ marginTop:"16px", background:"none", border:"none", color:"var(--brand-primary)", cursor:"pointer", fontSize:"13px", width:"100%", textAlign:"center" }}>
                  ← Back to Sign In
                </button>
              </motion.div>
            )}

            {/* ── LOGIN / SIGNUP ── */}
            {(mode === "login" || mode === "signup") && (
              <motion.div key={mode} initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>
                {/* Tabs */}
                <div style={{ display:"flex", gap:"4px", padding:"4px", borderRadius:"12px", background:"var(--bg-primary)", marginBottom:"24px" }}>
                  {(["login","signup"] as const).map(m=>(
                    <button key={m} onClick={()=>reset(m)}
                      style={{ flex:1, padding:"8px 16px", borderRadius:"8px", border:"none", cursor:"pointer", fontWeight:600, fontSize:"13px", transition:"all 0.2s", background: mode===m ? "var(--brand-gradient)" : "transparent", color: mode===m ? "white" : "var(--text-secondary)" }}>
                      {m==="login" ? "Sign In" : "Sign Up"}
                    </button>
                  ))}
                </div>

                <h2 style={{ fontSize:"22px", fontWeight:700, marginBottom:"6px", color:"var(--text-primary)" }}>
                  {mode==="login" ? "Welcome back, explorer 🌍" : "Start your journey 🚀"}
                </h2>
                <p style={{ color:"var(--text-secondary)", fontSize:"13px", marginBottom:"22px" }}>
                  {mode==="login" ? "Sign in to your Traveloop account" : "Create your free account"}
                </p>

                {/* Google button */}
                <GoogleBtn loading={googleLoading} onClick={handleGoogle}/>

                {/* Divider */}
                <div style={{ display:"flex", alignItems:"center", gap:"12px", margin:"18px 0" }}>
                  <div style={{ flex:1, height:"1px", background:"var(--border)" }}/>
                  <span style={{ fontSize:"12px", color:"var(--text-muted)", fontWeight:500 }}>or continue with email</span>
                  <div style={{ flex:1, height:"1px", background:"var(--border)" }}/>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {err && (
                    <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
                      style={{ marginBottom:"14px", padding:"10px 14px", borderRadius:"10px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", color:"#ef4444", fontSize:"13px", display:"flex", alignItems:"center", gap:"8px" }}>
                      <AlertCircle size={14} style={{ flexShrink:0 }}/>{err}
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
                  {mode==="signup" && (
                    <div style={{ position:"relative" }}>
                      <User size={16} style={{ position:"absolute", left:"14px", top:"50%", transform:"translateY(-50%)", color:"var(--text-muted)" }}/>
                      <input className="input" placeholder="Full Name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={{ paddingLeft:"42px" }} autoComplete="name"/>
                    </div>
                  )}
                  <div style={{ position:"relative" }}>
                    <Mail size={16} style={{ position:"absolute", left:"14px", top:"50%", transform:"translateY(-50%)", color:"var(--text-muted)" }}/>
                    <input className="input" type="email" placeholder="Email address" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} style={{ paddingLeft:"42px" }} autoComplete="email"/>
                  </div>
                  <div>
                    <div style={{ position:"relative" }}>
                      <Lock size={16} style={{ position:"absolute", left:"14px", top:"50%", transform:"translateY(-50%)", color:"var(--text-muted)" }}/>
                      <input className="input" type={showPassword?"text":"password"} placeholder="Password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} style={{ paddingLeft:"42px", paddingRight:"42px" }} autoComplete={mode==="login"?"current-password":"new-password"}/>
                      <button type="button" onClick={()=>setShowPassword(s=>!s)} style={{ position:"absolute", right:"14px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", display:"flex" }}>
                        {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                      </button>
                    </div>
                    {mode==="signup" && <PasswordStrength password={form.password}/>}
                  </div>

                  {mode==="login" && (
                    <div style={{ textAlign:"right", marginTop:"-4px" }}>
                      <button type="button" onClick={()=>{ setLocalError(null); clearAuthError(); setMode("forgot"); }}
                        style={{ background:"none", border:"none", color:"var(--brand-primary)", cursor:"pointer", fontSize:"12px", fontWeight:600 }}>
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <motion.button type="submit" whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }} disabled={loading} className="btn-primary"
                    style={{ padding:"13px", fontSize:"15px", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", opacity:loading?0.85:1 }}>
                    {loading
                      ? <><div style={{ width:"18px", height:"18px", borderRadius:"50%", border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"white", animation:"spin 0.7s linear infinite" }}/>{mode==="login"?"Signing in…":"Creating account…"}</>
                      : <>{mode==="login"?"Sign In":"Create Account"}<ArrowRight size={16}/></>}
                  </motion.button>
                </form>

                {/* Demo hint */}
                <div style={{ marginTop:"16px", padding:"10px 14px", borderRadius:"10px", background:"rgba(99,102,241,0.08)", border:"1px solid rgba(99,102,241,0.15)", fontSize:"12px", color:"var(--text-secondary)" }}>
                  <span style={{ fontWeight:600, color:"var(--brand-primary)" }}>Demo: </span>
                  {mode==="login" ? <>Use <strong>arjun@traveloop.ai</strong> / <strong>Admin@1234</strong> or register free</> : "Register a free account — no credit card needed."}
                </div>

                <p style={{ textAlign:"center", fontSize:"11px", color:"var(--text-muted)", marginTop:"16px" }}>
                  By continuing, you agree to our <span style={{ color:"var(--brand-primary)", cursor:"pointer" }}>Terms</span> &amp; <span style={{ color:"var(--brand-primary)", cursor:"pointer" }}>Privacy Policy</span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
