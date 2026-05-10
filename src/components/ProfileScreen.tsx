"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import { MapPin, Globe, Camera, Star, Edit2, Settings, Award, X, Check, Save } from "lucide-react";
import { MOCK_USER, MOCK_TRIPS, PERSONALITY_TYPES } from "@/data/mock";
import { formatCurrency } from "@/lib/utils";
import { useApp } from "@/context/AppContext";

function Toast({ msg }: { msg: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
      style={{ position: "fixed", bottom: "90px", left: "50%", transform: "translateX(-50%)", zIndex: 9999, padding: "10px 20px", borderRadius: "30px", background: "rgba(34,197,94,0.95)", color: "white", fontWeight: 600, fontSize: "13px", display: "flex", alignItems: "center", gap: "7px", boxShadow: "0 8px 24px rgba(0,0,0,0.3)", whiteSpace: "nowrap" }}>
      ✅ {msg}
    </motion.div>
  );
}

export function ProfileScreen() {
  const { user } = useApp();
  const [activeTab, setActiveTab]   = useState("trips");
  const [avatarSrc, setAvatarSrc]   = useState(MOCK_USER.avatar);
  const [coverStyle, setCoverStyle] = useState("linear-gradient(135deg, #6366f1, #06b6d4, #a855f7)");
  const [showEditModal, setShowEditModal] = useState(false);
  const [toast, setToast]           = useState("");
  const [profile, setProfile]       = useState({ name: MOCK_USER.name, bio: MOCK_USER.bio || "Travel enthusiast & storyteller", country: "India" });
  const [editForm, setEditForm]     = useState({ ...profile });
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef  = useRef<HTMLInputElement>(null);
  const personality    = PERSONALITY_TYPES.find(p => p.id === "creator");

  const showMsg = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showMsg("Image too large (max 5MB)"); return; }
    const reader = new FileReader();
    reader.onload = ev => { setAvatarSrc(ev.target?.result as string); showMsg("Profile photo updated!"); };
    reader.readAsDataURL(file);
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setCoverStyle(`url(${ev.target?.result}) center/cover`); showMsg("Cover photo updated!"); };
    reader.readAsDataURL(file);
  };

  const saveProfile = () => {
    setProfile({ ...editForm });
    setShowEditModal(false);
    showMsg("Profile saved successfully!");
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }} className="page-enter">
      <AnimatePresence>{toast && <Toast msg={toast} />}</AnimatePresence>

      {/* Hidden file inputs */}
      <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
      <input ref={coverInputRef}  type="file" accept="image/*" style={{ display: "none" }} onChange={handleCoverChange} />

      {/* Cover */}
      <div style={{ position: "relative", height: "200px", background: coverStyle, borderRadius: "0 0 24px 24px", overflow: "hidden" }}>
        <div className="blob blob-1" style={{ width: "300px", height: "300px", top: "-100px", right: "10%", opacity: 0.2 }} />
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          onClick={() => coverInputRef.current?.click()}
          style={{ position: "absolute", top: "16px", right: "16px", background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "10px", padding: "8px 14px", color: "white", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", backdropFilter: "blur(10px)" }}>
          <Camera size={13} /> Change Cover
        </motion.button>
      </div>

      <div style={{ padding: "0 24px" }}>
        {/* Avatar + info row */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: "-40px", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "16px" }}>
            <div style={{ position: "relative" }}>
              <img src={avatarSrc} alt={profile.name}
                style={{ width: "88px", height: "88px", borderRadius: "50%", border: "4px solid var(--bg-primary)", background: "var(--bg-secondary)", objectFit: "cover" }}
                onError={e => { e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${profile.name}`; }}
              />
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={() => avatarInputRef.current?.click()}
                style={{ position: "absolute", bottom: "4px", right: "4px", width: "26px", height: "26px", borderRadius: "50%", background: "var(--brand-gradient)", border: "2px solid var(--bg-primary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Edit2 size={11} color="white" />
              </motion.button>
            </div>
            <div style={{ paddingBottom: "8px" }}>
              <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary)" }}>{profile.name}</h1>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{profile.bio}</p>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => { setEditForm({ ...profile }); setShowEditModal(true); }}
            className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
            <Settings size={14} /> Edit Profile
          </motion.button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
          {[
            { label: "Trips", value: MOCK_USER.tripsCount },
            { label: "Countries", value: MOCK_USER.countriesVisited },
            { label: "Followers", value: "12.4K" },
            { label: "Following", value: MOCK_USER.followingCount },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center", padding: "16px", borderRadius: "12px", background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div style={{ fontWeight: 800, fontSize: "20px", color: "var(--text-primary)" }}>{s.value}</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Personality */}
        {personality && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ padding: "20px", borderRadius: "16px", background: `linear-gradient(135deg,${personality.color}18,${personality.color}08)`, border: `1px solid ${personality.color}30`, marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ fontSize: "40px" }}>{personality.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px" }}>YOUR AI TRAVEL PERSONALITY</div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: personality.color, marginBottom: "4px" }}>{personality.label}</div>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{personality.description}</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "12px" }}>
              {personality.traits.map(t => (
                <span key={t} style={{ padding: "4px 10px", borderRadius: "16px", background: `${personality.color}18`, color: personality.color, fontSize: "11px", fontWeight: 500 }}>{t}</span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Achievements */}
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Award size={18} color="var(--brand-primary)" /> Achievements
          </h3>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {[
              { emoji: "🌏", label: "Globe Trotter", sub: "18+ countries" },
              { emoji: "📸", label: "Insta Pro", sub: "10K+ photos" },
              { emoji: "🎒", label: "Backpacker", sub: "Budget master" },
              { emoji: "🌅", label: "Sunrise Chaser", sub: "Early riser" },
              { emoji: "✍️", label: "Storyteller", sub: "50+ journals" },
              { emoji: "💰", label: "Budget Genius", sub: "Saved ₹1L+" },
            ].map(a => (
              <motion.div key={a.label} whileHover={{ scale: 1.04, y: -2 }}
                style={{ padding: "12px 16px", borderRadius: "12px", background: "var(--bg-card)", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "8px", cursor: "default" }}>
                <span style={{ fontSize: "22px" }}>{a.emoji}</span>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>{a.label}</div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{a.sub}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Travel stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "14px", marginBottom: "24px" }}>
          {[
            { label: "Total Distance", value: "127,400 km", icon: "✈️", color: "#6366f1" },
            { label: "Total Spent", value: formatCurrency(680000), icon: "💸", color: "#a855f7" },
            { label: "Nights Abroad", value: "312 nights", icon: "🌙", color: "#06b6d4" },
            { label: "Photos Taken", value: "24,800+", icon: "📷", color: "#f59e0b" },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: "16px" }}>
              <div style={{ fontSize: "22px", marginBottom: "6px" }}>{s.icon}</div>
              <div style={{ fontWeight: 800, fontSize: "18px", color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", padding: "4px", background: "var(--bg-secondary)", borderRadius: "12px", marginBottom: "20px" }}>
          {["trips", "saved", "community"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ flex: 1, padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "13px", background: activeTab === tab ? "var(--brand-gradient)" : "transparent", color: activeTab === tab ? "white" : "var(--text-secondary)", transition: "all 0.2s", textTransform: "capitalize" }}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "trips" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: "14px", paddingBottom: "100px" }}>
            {MOCK_TRIPS.map(trip => (
              <motion.div key={trip.id} whileHover={{ y: -4 }} className="card" style={{ overflow: "hidden" }}>
                <div style={{ height: "130px", overflow: "hidden", background: "linear-gradient(135deg,#6366f1,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px" }}>
                  {trip.coverImage
                    ? <img src={trip.coverImage} alt={trip.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.currentTarget.parentElement as any).textContent = "🌴"; }} />
                    : "🌴"}
                </div>
                <div style={{ padding: "14px" }}>
                  <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-primary)", marginBottom: "4px" }}>{trip.title}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{trip.startDate} · {formatCurrency(trip.budget)}</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === "saved" && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔖</div>
            <p style={{ fontWeight: 600, fontSize: "15px" }}>No saved trips yet</p>
            <p style={{ fontSize: "13px" }}>Explore the community and save inspiring itineraries</p>
          </div>
        )}

        {activeTab === "community" && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🌍</div>
            <p style={{ fontWeight: 600, fontSize: "15px" }}>No community posts yet</p>
            <p style={{ fontSize: "13px" }}>Share your first travel story with the community</p>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 5000, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
            onClick={e => e.target === e.currentTarget && setShowEditModal(false)}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
              style={{ width: "100%", maxWidth: "460px", borderRadius: "24px", background: "var(--bg-card)", border: "1px solid var(--border)", overflow: "hidden" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 800, fontSize: "16px", color: "var(--text-primary)" }}>✏️ Edit Profile</span>
                <button onClick={() => setShowEditModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
              </div>
              <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Display Name</label>
                  <input className="input" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Bio</label>
                  <textarea className="input" value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                    placeholder="Tell the world about yourself…" rows={3} style={{ resize: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Country</label>
                  <input className="input" value={editForm.country} onChange={e => setEditForm(f => ({ ...f, country: e.target.value }))} placeholder="Your country" />
                </div>
                <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
                  <button onClick={() => setShowEditModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={saveProfile} className="btn-primary"
                    style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                    <Save size={14} /> Save Changes
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
