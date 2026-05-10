"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Check, Plus, Trash2, Sparkles, Package, Laptop, FileText, Shirt } from "lucide-react";
import { PackingItem } from "@/types";
import { PACKING_ITEMS_TEMPLATE } from "@/data/mock";

const CATEGORY_ICONS = {
  Clothing: <Shirt size={16} />,
  Electronics: <Laptop size={16} />,
  Essentials: <Package size={16} />,
  Documents: <FileText size={16} />,
  Other: <Package size={16} />,
};

const CATEGORY_COLORS = {
  Clothing: "#6366f1",
  Electronics: "#06b6d4",
  Essentials: "#a855f7",
  Documents: "#f59e0b",
  Other: "#94a3b8",
};

function generateId() { return Math.random().toString(36).substr(2, 9); }

function initItems(): PackingItem[] {
  const items: PackingItem[] = [];
  Object.entries(PACKING_ITEMS_TEMPLATE).forEach(([cat, names]) => {
    names.forEach((name) => {
      items.push({ id: generateId(), name, category: cat as PackingItem["category"], packed: Math.random() > 0.5 });
    });
  });
  return items;
}

export function PackingScreen() {
  const [items, setItems] = useState<PackingItem[]>(initItems);
  const [newItem, setNewItem] = useState("");
  const [newCat, setNewCat] = useState<PackingItem["category"]>("Essentials");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [aiLoading, setAiLoading] = useState(false);

  const categories = ["All", "Clothing", "Electronics", "Essentials", "Documents"];
  const filtered = activeCategory === "All" ? items : items.filter((i) => i.category === activeCategory);
  const packedCount = items.filter((i) => i.packed).length;
  const progress = Math.round((packedCount / items.length) * 100);

  const toggle = (id: string) => setItems((prev) => prev.map((i) => i.id === id ? { ...i, packed: !i.packed } : i));
  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
  const addItem = () => {
    if (!newItem.trim()) return;
    setItems((prev) => [...prev, { id: generateId(), name: newItem, category: newCat, packed: false }]);
    setNewItem("");
  };

  const aiSuggest = async () => {
    setAiLoading(true);
    await new Promise((r) => setTimeout(r, 1800));
    const suggestions = [
      { id: generateId(), name: "Portable WiFi Device", category: "Electronics" as PackingItem["category"], packed: false },
      { id: generateId(), name: "Travel Neck Pillow", category: "Essentials" as PackingItem["category"], packed: false },
      { id: generateId(), name: "IC Suica Card (Japan)", category: "Documents" as PackingItem["category"], packed: false },
    ];
    setItems((prev) => [...prev, ...suggestions]);
    setAiLoading(false);
  };

  return (
    <div style={{ padding: "24px", maxWidth: "900px", margin: "0 auto" }} className="page-enter">
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 900, color: "var(--text-primary)", marginBottom: "6px" }}>
          Smart <span className="gradient-text">Packing List</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>AI-generated based on your destination and trip type</p>
      </div>

      {/* Progress */}
      <div className="card" style={{ padding: "24px", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "16px", color: "var(--text-primary)" }}>Packing Progress</div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>{packedCount} of {items.length} items packed</div>
          </div>
          <div style={{ fontWeight: 900, fontSize: "32px", background: "var(--brand-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{progress}%</div>
        </div>
        <div className="progress-track" style={{ height: "10px" }}>
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        {progress === 100 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "6px", color: "#22c55e", fontWeight: 600, fontSize: "13px" }}>
            <Check size={16} /> All packed! You&apos;re ready to go! 🎉
          </motion.div>
        )}
      </div>

      {/* Category stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        {(["Clothing", "Electronics", "Essentials", "Documents"] as const).map((cat) => {
          const catItems = items.filter((i) => i.category === cat);
          const catPacked = catItems.filter((i) => i.packed).length;
          return (
            <div key={cat} className="card" style={{ padding: "16px", cursor: "pointer", borderColor: activeCategory === cat ? "var(--brand-primary)" : undefined }} onClick={() => setActiveCategory(activeCategory === cat ? "All" : cat)}>
              <div style={{ color: CATEGORY_COLORS[cat], marginBottom: "6px" }}>{CATEGORY_ICONS[cat]}</div>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)" }}>{cat}</div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{catPacked}/{catItems.length}</div>
              <div className="progress-track" style={{ height: "4px", marginTop: "8px" }}>
                <div style={{ height: "100%", borderRadius: "2px", background: CATEGORY_COLORS[cat], width: `${catItems.length ? Math.round((catPacked / catItems.length) * 100) : 0}%`, transition: "width 0.4s" }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Suggest */}
      <motion.div
        className="card"
        style={{ padding: "16px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "16px", cursor: "pointer", background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(6,182,212,0.05))", borderColor: "rgba(99,102,241,0.25)" }}
        whileHover={{ scale: 1.01 }}
        onClick={aiSuggest}
      >
        <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "var(--brand-gradient)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Sparkles size={20} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)" }}>AI Packing Suggestions</div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Get smart suggestions based on Japan, April weather, and your travel style</div>
        </div>
        {aiLoading ? (
          <div style={{ width: "24px", height: "24px", borderRadius: "50%", border: "2px solid var(--brand-primary)", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <span style={{ color: "var(--brand-primary)", fontSize: "12px", fontWeight: 600 }}>Suggest →</span>
        )}
      </motion.div>

      {/* Add item */}
      <div className="card" style={{ padding: "16px", marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <select className="input" value={newCat} onChange={(e) => setNewCat(e.target.value as PackingItem["category"])} style={{ maxWidth: "140px" }}>
            {["Clothing", "Electronics", "Essentials", "Documents", "Other"].map((c) => <option key={c}>{c}</option>)}
          </select>
          <input className="input" placeholder="Add item..." value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addItem()} style={{ flex: 1 }} />
          <button onClick={addItem} className="btn-primary" style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      {/* Category filter tabs */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "16px", overflowX: "auto" }}>
        {categories.map((c) => (
          <button key={c} onClick={() => setActiveCategory(c)} style={{ padding: "6px 14px", borderRadius: "16px", border: `1px solid ${activeCategory === c ? "var(--brand-primary)" : "var(--border)"}`, background: activeCategory === c ? "rgba(99,102,241,0.1)" : "var(--bg-card)", color: activeCategory === c ? "var(--brand-primary)" : "var(--text-secondary)", cursor: "pointer", fontSize: "12px", fontWeight: 500, whiteSpace: "nowrap" }}>
            {c}
          </button>
        ))}
      </div>

      {/* Items */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <AnimatePresence>
          {filtered.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 16px",
                borderRadius: "12px",
                background: item.packed ? "rgba(34,197,94,0.05)" : "var(--bg-card)",
                border: `1px solid ${item.packed ? "rgba(34,197,94,0.2)" : "var(--border)"}`,
                transition: "all 0.2s",
              }}
            >
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => toggle(item.id)}
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "8px",
                  border: `2px solid ${item.packed ? "#22c55e" : "var(--border)"}`,
                  background: item.packed ? "#22c55e" : "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.2s",
                }}
              >
                {item.packed && <Check size={13} color="white" />}
              </motion.button>

              <div style={{ color: CATEGORY_COLORS[item.category], flexShrink: 0 }}>
                {CATEGORY_ICONS[item.category]}
              </div>

              <span style={{ flex: 1, fontSize: "14px", color: item.packed ? "var(--text-muted)" : "var(--text-primary)", textDecoration: item.packed ? "line-through" : "none", transition: "all 0.2s" }}>
                {item.name}
              </span>

              <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "8px", background: CATEGORY_COLORS[item.category] + "18", color: CATEGORY_COLORS[item.category] }}>
                {item.category}
              </span>

              <button onClick={() => remove(item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px", opacity: 0.5, transition: "opacity 0.2s" }}>
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
