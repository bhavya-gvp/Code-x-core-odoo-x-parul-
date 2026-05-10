"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Plus, Pencil, Trash2, MapPin, Calendar, Smile, X, Check } from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string;
  mood: string;
  location?: string;
  date: string;
  color: string;
}

const MOODS = ["😊 Happy", "😍 Amazed", "😌 Peaceful", "🥹 Emotional", "🤩 Excited", "😴 Tired", "🤔 Reflective"];
const COLORS = ["#6366f1", "#06b6d4", "#a855f7", "#f59e0b", "#22c55e", "#ec4899", "#ef4444"];

const INITIAL_NOTES: Note[] = [
  {
    id: "n1",
    title: "Arashiyama Bamboo Grove",
    content: "Woke up at 5:30am to catch the grove before crowds. The silence at dawn was absolute — just wind through bamboo and distant temple bells. This is why I travel. No photo does it justice.",
    mood: "😌 Peaceful",
    location: "Kyoto, Japan",
    date: "2024-04-05",
    color: "#22c55e",
  },
  {
    id: "n2",
    title: "Losing myself in Tokyo",
    content: "Got completely lost in Shibuya for 3 hours with no plan. Found a tiny vinyl record shop, a ramen spot that had no English menu, and a vending machine that sold hot coffee in a can. Best 3 hours of the trip.",
    mood: "😍 Amazed",
    location: "Tokyo, Japan",
    date: "2024-04-02",
    color: "#6366f1",
  },
  {
    id: "n3",
    title: "The night train to Osaka",
    content: "Watching rural Japan slide past at 200km/h as the sun sets over rice fields. An elderly man shared his bento box with me. We couldn't speak a word of each other's language. Still the warmest moment of this trip.",
    mood: "🥹 Emotional",
    location: "Shinkansen — Tokyo to Osaka",
    date: "2024-04-07",
    color: "#ec4899",
  },
];

function NoteCard({ note, onEdit, onDelete }: { note: Note; onEdit: (n: Note) => void; onDelete: (id: string) => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="card"
      style={{ padding: "20px", borderTop: `3px solid ${note.color}`, cursor: "pointer" }}
      whileHover={{ y: -2 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
        <h3 style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)", flex: 1, marginRight: "8px" }}>{note.title}</h3>
        <div style={{ display: "flex", gap: "6px" }}>
          <button onClick={() => onEdit(note)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}>
            <Pencil size={13} />
          </button>
          <button onClick={() => onDelete(note.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: "4px" }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "14px", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {note.content}
      </p>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "3px" }}>
          <Calendar size={11} /> {note.date}
        </span>
        {note.location && (
          <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "3px" }}>
            <MapPin size={11} /> {note.location}
          </span>
        )}
        <span style={{ fontSize: "12px" }}>{note.mood}</span>
      </div>
    </motion.div>
  );
}

export function JournalScreen() {
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [form, setForm] = useState({ title: "", content: "", mood: MOODS[0], location: "", color: COLORS[0] });

  const openEditor = (note?: Note) => {
    if (note) {
      setEditingNote(note);
      setForm({ title: note.title, content: note.content, mood: note.mood, location: note.location || "", color: note.color });
    } else {
      setEditingNote(null);
      setForm({ title: "", content: "", mood: MOODS[0], location: "", color: COLORS[0] });
    }
    setShowEditor(true);
  };

  const saveNote = () => {
    if (!form.title || !form.content) return;
    if (editingNote) {
      setNotes((prev) => prev.map((n) => n.id === editingNote.id ? { ...n, ...form } : n));
    } else {
      setNotes((prev) => [{ id: Date.now().toString(), ...form, date: new Date().toISOString().split("T")[0] }, ...prev]);
    }
    setShowEditor(false);
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }} className="page-enter">
      <div style={{ marginBottom: "28px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 900, color: "var(--text-primary)", marginBottom: "6px" }}>
            Travel <span className="gradient-text">Journal</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Capture your stories, moments, and memories</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => openEditor()} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Plus size={16} /> New Entry
        </motion.button>
      </div>

      {/* Timeline header */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", overflowX: "auto", paddingBottom: "4px" }}>
        {["All Entries", "Japan 2024", "Bali 2024", "Europe 2023"].map((filter, i) => (
          <button key={filter} style={{ padding: "7px 16px", borderRadius: "20px", border: `1px solid ${i === 0 ? "var(--brand-primary)" : "var(--border)"}`, background: i === 0 ? "rgba(99,102,241,0.1)" : "var(--bg-card)", color: i === 0 ? "var(--brand-primary)" : "var(--text-secondary)", cursor: "pointer", fontSize: "12px", fontWeight: 500, whiteSpace: "nowrap" }}>
            {filter}
          </button>
        ))}
      </div>

      {/* Notes grid */}
      <motion.div layout style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
        <AnimatePresence>
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} onEdit={openEditor} onDelete={(id) => setNotes((prev) => prev.filter((n) => n.id !== id))} />
          ))}
        </AnimatePresence>

        {/* Add card */}
        <motion.div
          onClick={() => openEditor()}
          whileHover={{ scale: 1.02 }}
          className="card"
          style={{ padding: "30px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", cursor: "pointer", border: "2px dashed var(--border)", background: "transparent", minHeight: "180px" }}
        >
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--brand-gradient)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Plus size={22} color="white" />
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary)" }}>Write a New Memory</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Capture this moment forever</div>
          </div>
        </motion.div>
      </motion.div>

      {/* Editor modal */}
      <AnimatePresence>
        {showEditor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{ width: "100%", maxWidth: "560px", borderRadius: "24px", background: "var(--bg-secondary)", border: "1px solid var(--border)", overflow: "hidden" }}
            >
              <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
                  {editingNote ? "Edit Entry" : "New Journal Entry"}
                </h3>
                <button onClick={() => setShowEditor(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "14px", maxHeight: "65vh", overflowY: "auto" }}>
                <input className="input" placeholder="Title — What happened?" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} style={{ fontSize: "16px", fontWeight: 600 }} />
                
                <textarea
                  className="input"
                  placeholder="Write your story... Let the memories flow."
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  style={{ minHeight: "150px", resize: "vertical", lineHeight: 1.7 }}
                />

                <input className="input" placeholder="📍 Location (optional)" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />

                {/* Mood selector */}
                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px", marginBottom: "8px" }}>
                    <Smile size={12} /> How were you feeling?
                  </label>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {MOODS.map((m) => (
                      <button key={m} onClick={() => setForm((f) => ({ ...f, mood: m }))} style={{ padding: "5px 12px", borderRadius: "16px", border: `1px solid ${form.mood === m ? "var(--brand-primary)" : "var(--border)"}`, background: form.mood === m ? "rgba(99,102,241,0.1)" : "transparent", cursor: "pointer", fontSize: "13px", transition: "all 0.2s" }}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color picker */}
                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600, marginBottom: "8px", display: "block" }}>Card Color</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {COLORS.map((c) => (
                      <button key={c} onClick={() => setForm((f) => ({ ...f, color: c }))} style={{ width: "28px", height: "28px", borderRadius: "50%", background: c, border: `3px solid ${form.color === c ? "var(--text-primary)" : "transparent"}`, cursor: "pointer", transition: "all 0.2s" }} />
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", paddingTop: "8px" }}>
                  <button onClick={() => setShowEditor(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                  <button onClick={saveNote} className="btn-primary" style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                    <Check size={16} /> Save Entry
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
