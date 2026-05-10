"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Search, MapPin, Star, Users, Shield, TrendingUp, Heart, X } from "lucide-react";
import { MOCK_DESTINATIONS } from "@/data/mock";
import { Destination } from "@/types";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";

const REGIONS = ["All", "Asia", "Europe", "Africa", "South America", "North America", "Oceania"];
const CROWD_LEVELS = ["All", "low", "moderate", "high"];

function CityCard({ dest, onSelect }: { dest: Destination; onSelect: (d: Destination) => void }) {
  const [saved, setSaved] = useState(false);
  const crowdColors = { low: "#22c55e", moderate: "#f59e0b", high: "#ef4444" };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="destination-card"
      style={{ height: "280px", cursor: "pointer" }}
      onClick={() => onSelect(dest)}
    >
      <img src={dest.image} alt={dest.name} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0, transition: "transform 0.6s ease" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)" }} />

      {/* Top badges */}
      <div style={{ position: "absolute", top: "12px", left: "12px", right: "12px", display: "flex", gap: "6px", justifyContent: "space-between" }}>
        <span className="badge" style={{ background: "rgba(0,0,0,0.5)", color: "white", backdropFilter: "blur(10px)", fontSize: "10px" }}>
          🌡 {dest.temperature}°C
        </span>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); setSaved((s) => !s); }}
          style={{ background: "rgba(0,0,0,0.5)", border: "none", cursor: "pointer", borderRadius: "50%", width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)" }}
        >
          <Heart size={14} color={saved ? "#ef4444" : "white"} fill={saved ? "#ef4444" : "none"} />
        </motion.button>
      </div>

      {/* Bottom info */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 16px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "10px" }}>
          <div>
            <h3 style={{ fontWeight: 800, color: "white", fontSize: "20px", lineHeight: 1 }}>{dest.name}</h3>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "13px", display: "flex", alignItems: "center", gap: "3px", marginTop: "3px" }}>
              <MapPin size={11} /> {dest.country}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "3px", color: "gold", fontSize: "13px", fontWeight: 700 }}>
              <Star size={13} fill="gold" /> {dest.rating}
            </div>
            <div style={{ color: "rgba(255,255,255,0.65)", fontSize: "10px", marginTop: "2px" }}>
              {dest.bestSeason}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ background: "rgba(255,255,255,0.15)", color: "white", padding: "3px 8px", borderRadius: "10px", fontSize: "10px", display: "flex", alignItems: "center", gap: "3px", backdropFilter: "blur(10px)" }}>
            <Users size={9} style={{ color: crowdColors[dest.crowdLevel] }} />
            {dest.crowdLevel} crowd
          </span>
          <span style={{ background: "rgba(255,255,255,0.15)", color: "white", padding: "3px 8px", borderRadius: "10px", fontSize: "10px", display: "flex", alignItems: "center", gap: "3px", backdropFilter: "blur(10px)" }}>
            <Shield size={9} style={{ color: "#22c55e" }} />
            {dest.safetyScore}/100
          </span>
          <span style={{ background: "rgba(255,255,255,0.15)", color: "white", padding: "3px 8px", borderRadius: "10px", fontSize: "10px", backdropFilter: "blur(10px)" }}>
            ₹{dest.costIndex}/day est.
          </span>
        </div>

        {dest.trending && (
          <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "4px", color: "#a5b4fc", fontSize: "10px", fontWeight: 600 }}>
            <TrendingUp size={10} /> Trending Now
          </div>
        )}
      </div>
    </motion.div>
  );
}

function DestinationModal({ dest, onClose }: { dest: Destination; onClose: () => void }) {
  const { success } = useToast();
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "20px" }}
      onClick={onClose}>
      <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: "600px", borderRadius: "24px", overflow: "hidden", background: "var(--bg-secondary)", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ height: "240px", position: "relative" }}>
          <img src={dest.image} alt={dest.name} style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={e => { (e.currentTarget.parentElement as HTMLElement).style.background = "linear-gradient(135deg,#6366f1,#06b6d4)"; e.currentTarget.style.display="none"; }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)" }} />
          <button onClick={onClose} style={{ position: "absolute", top: "16px", right: "16px", background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}><X size={18} /></button>
          <div style={{ position: "absolute", bottom: "16px", left: "20px" }}>
            <h2 style={{ color: "white", fontSize: "28px", fontWeight: 900 }}>{dest.name}</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px" }}>{dest.country} · {dest.region}</p>
          </div>
        </div>
        <div style={{ padding: "24px" }}>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.7, marginBottom: "20px" }}>{dest.description}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "20px" }}>
            {[
              { label: "Rating", value: `⭐ ${dest.rating}` },
              { label: "Temperature", value: `🌡 ${dest.temperature}°C` },
              { label: "Safety", value: `🛡 ${dest.safetyScore}/100` },
              { label: "Cost/day", value: `₹${dest.costIndex}k est.` },
              { label: "Best Season", value: `🌤 ${dest.bestSeason}` },
              { label: "Crowd Level", value: `👥 ${dest.crowdLevel}` },
            ].map(stat => (
              <div key={stat.label} style={{ padding: "12px", borderRadius: "10px", background: "var(--bg-primary)", border: "1px solid var(--border)", textAlign: "center" }}>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "2px" }}>{stat.value}</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{stat.label}</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "10px" }}>Top Activities</h4>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {dest.activities.map(a => <span key={a} className="tag">{a}</span>)}
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <Link href={`/trips/new?destination=${encodeURIComponent(dest.name)}`} style={{ flex: 1 }} onClick={onClose}>
              <button className="btn-primary" style={{ width: "100%", fontSize: "14px" }}>✈️ Plan Trip Here</button>
            </Link>
            <button className="btn-secondary" style={{ flex: 1, fontSize: "14px" }}
              onClick={() => { success(`${dest.name} added to wishlist! ❤️`); onClose(); }}>
              🔖 Add to Wishlist
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function DiscoverScreen() {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("All");
  const [selectedDest, setSelectedDest] = useState<Destination | null>(null);

  const filtered = MOCK_DESTINATIONS.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.country.toLowerCase().includes(search.toLowerCase());
    const matchRegion = region === "All" || d.region === region;
    return matchSearch && matchRegion;
  });

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }} className="page-enter">
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 900, color: "var(--text-primary)", marginBottom: "6px" }}>
          Discover <span className="gradient-text">Destinations</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>AI-curated destinations matching your travel personality</p>
      </div>

      {/* Search + filters */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            className="input"
            placeholder="Search destinations, countries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: "42px" }}
          />
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              style={{ padding: "8px 16px", borderRadius: "20px", border: `1px solid ${region === r ? "var(--brand-primary)" : "var(--border)"}`, background: region === r ? "rgba(99,102,241,0.12)" : "var(--bg-card)", color: region === r ? "var(--brand-primary)" : "var(--text-secondary)", cursor: "pointer", fontSize: "12px", fontWeight: 500, transition: "all 0.2s" }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div style={{ marginBottom: "16px", color: "var(--text-muted)", fontSize: "13px" }}>
        {filtered.length} destinations found
      </div>

      {/* Grid */}
      <motion.div
        layout
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}
      >
        <AnimatePresence>
          {filtered.map((dest) => (
            <CityCard key={dest.id} dest={dest} onSelect={setSelectedDest} />
          ))}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔍</div>
          <p style={{ fontSize: "16px", fontWeight: 600 }}>No destinations found</p>
          <p style={{ fontSize: "13px" }}>Try adjusting your search or filters</p>
        </div>
      )}

      <AnimatePresence>
        {selectedDest && <DestinationModal dest={selectedDest} onClose={() => setSelectedDest(null)} />}
      </AnimatePresence>
    </div>
  );
}
