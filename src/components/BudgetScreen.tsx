"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Sparkles, TrendingDown, Wallet, PlusCircle, X, RefreshCw, Loader2 } from "lucide-react";
import { BUDGET_CATEGORIES } from "@/data/mock";
import { formatCurrency } from "@/lib/utils";
import { budgetAPI } from "@/lib/api";
import { useApp } from "@/context/AppContext";

interface Expense {
  id: string; category: string; amount: number; description: string;
  expense_date?: string; date?: string;
}
interface AISuggestion {
  title: string; description: string; potential_saving: number; impact: string; category?: string;
}

const CAT_COLORS: Record<string, string> = {
  Flights: "#6366f1", Hotels: "#06b6d4", Food: "#a855f7",
  Transport: "#f59e0b", Activities: "#ef4444", Shopping: "#22c55e",
};
const CAT_EMOJIS: Record<string, string> = {
  Flights: "✈️", Hotels: "🏨", Food: "🍜", Transport: "🚇",
  Activities: "🎭", Shopping: "🛍️", Other: "💳",
};
const DAILY_SPEND = [
  { day: "Mon", amount: 3200 }, { day: "Tue", amount: 5800 }, { day: "Wed", amount: 2100 },
  { day: "Thu", amount: 8900 }, { day: "Fri", amount: 4200 }, { day: "Sat", amount: 12000 },
  { day: "Sun", amount: 6500 },
];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fmt = (v: any) => formatCurrency(Number(v));

export function BudgetScreen() {
  const { currentTrip } = useApp();
  const tripId = currentTrip?.id;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [breakdown, setBreakdown] = useState<{ category: string; total: number }[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [aiReport, setAiReport] = useState<any>(null);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [newExpense, setNewExpense] = useState({ category: "Food", amount: "", description: "" });

  // Computed totals
  const totalBudget = currentTrip?.budget ? parseFloat(String(currentTrip.budget)) : BUDGET_CATEGORIES.reduce((s, c) => s + c.allocated, 0);
  const totalSpent = breakdown.length > 0
    ? breakdown.reduce((s, c) => s + parseFloat(String(c.total)), 0)
    : expenses.reduce((s, e) => s + parseFloat(String(e.amount)), 0);
  const remaining = totalBudget - totalSpent;
  const healthScore = Math.max(0, Math.round((remaining / totalBudget) * 100));

  const pieData = breakdown.length > 0
    ? breakdown.map((b) => ({ name: b.category, value: parseFloat(String(b.total)), color: CAT_COLORS[b.category] || "#6366f1" }))
    : [{ name: "No data", value: 100, color: "#334155" }];

  // Load expenses from backend
  const loadExpenses = async () => {
    if (!tripId) return;
    setLoading(true);
    try {
      const res: any = await budgetAPI.getExpenses(tripId);
      setExpenses(res.data?.expenses || []);
      setBreakdown(res.data?.category_breakdown || []);
    } catch {
      // Fallback to demo data when backend not connected
      setExpenses([
        { id: "e1", category: "Flights", amount: 72000, description: "Mumbai → Tokyo return", expense_date: "2024-04-01" },
        { id: "e2", category: "Hotels", amount: 22000, description: "Hotel Gracery Shinjuku (2 nights)", expense_date: "2024-04-01" },
        { id: "e3", category: "Food", amount: 3200, description: "Ramen at Ichiran", expense_date: "2024-04-02" },
        { id: "e4", category: "Transport", amount: 1800, description: "JR Pass top-up", expense_date: "2024-04-02" },
        { id: "e5", category: "Activities", amount: 4500, description: "teamLab Planets", expense_date: "2024-04-03" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const runAIOptimizer = async () => {
    if (!tripId) return;
    setAiLoading(true);
    try {
      const res: any = await budgetAPI.getAIOptimization(tripId);
      setAiReport(res.data);
      setAiSuggestions(res.data?.suggestions || []);
    } catch {
      setAiSuggestions([
        { title: "Use local transport", description: "Switch from taxi to metro between Shinjuku and Shibuya — same travel time, huge savings.", potential_saving: 4200, impact: "high" },
        { title: "Book hotel 2 weeks earlier", description: "Kyoto hotels are 23% cheaper when booked 14+ days before check-in.", potential_saving: 8000, impact: "high" },
        { title: "Eat at local stalls", description: "Japanese convenience store food is 80% cheaper than tourist restaurants.", potential_saving: 2500, impact: "medium" },
        { title: "Combine day trips", description: "Combine Arashiyama + Fushimi Inari on the same day to save transport costs.", potential_saving: 1800, impact: "low" },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const addExpense = async () => {
    if (!newExpense.description || !newExpense.amount) return;
    try {
      if (tripId) {
        await budgetAPI.addExpense({ trip_id: tripId, ...newExpense, amount: parseFloat(newExpense.amount), expense_date: new Date().toISOString().split("T")[0] });
        loadExpenses();
      } else {
        setExpenses((prev) => [{ id: Date.now().toString(), ...newExpense, amount: parseFloat(newExpense.amount), expense_date: new Date().toISOString().split("T")[0] }, ...prev]);
      }
    } catch { /* fallback */ }
    setNewExpense({ category: "Food", amount: "", description: "" });
    setShowAddExpense(false);
  };

  const deleteExpense = async (id: string) => {
    try {
      if (tripId) await budgetAPI.deleteExpense(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch { setExpenses((prev) => prev.filter((e) => e.id !== id)); }
  };

  useEffect(() => { loadExpenses(); }, [tripId]);


  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }} className="page-enter">
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 900, color: "var(--text-primary)", marginBottom: "6px" }}>
          Budget <span className="gradient-text">Intelligence</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>AI-powered financial analysis for smarter travel</p>
      </div>

      {/* Overview cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        {[
          { label: "Total Budget", value: formatCurrency(totalBudget), sub: "For this trip", color: "#6366f1", icon: "💼" },
          { label: "Spent", value: formatCurrency(totalSpent), sub: `${Math.round((totalSpent / totalBudget) * 100)}% used`, color: "#ef4444", icon: "💸" },
          { label: "Remaining", value: formatCurrency(remaining), sub: "Still available", color: "#22c55e", icon: "💰" },
          { label: "Daily Average", value: formatCurrency(Math.round(totalSpent / 7)), sub: "Per day spent", color: "#a855f7", icon: "📊" },
          { label: "Budget Health", value: `${healthScore}%`, sub: healthScore > 60 ? "✅ On Track" : "⚠️ Watch Out", color: healthScore > 60 ? "#22c55e" : "#f59e0b", icon: "❤️" },
        ].map((card) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="stat-card"
          >
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>{card.icon}</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: card.color, marginBottom: "4px" }}>{card.value}</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>{card.label}</div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>{card.sub}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }} className="budget-grid">
        <style>{`@media (max-width: 768px) { .budget-grid { grid-template-columns: 1fr !important; } }`}</style>

        {/* Pie chart */}
        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "20px" }}>Expense Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={fmt} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {pieData.map((cat) => (
              <div key={cat.name} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
                <span style={{ fontSize: "12px", color: "var(--text-secondary)", flex: 1 }}>{cat.name}</span>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{formatCurrency(cat.value)}</span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{totalSpent > 0 ? Math.round((cat.value / totalSpent) * 100) : 0}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily spend chart */}
        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "20px" }}>Daily Spending</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={DAILY_SPEND}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip formatter={fmt} />
              <Bar dataKey="amount" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Budget categories */}
      <div className="card" style={{ padding: "24px", marginBottom: "24px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "20px" }}>Budget vs Spend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={BUDGET_CATEGORIES} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickFormatter={(v) => `₹${v / 1000}k`} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "var(--text-secondary)" }} width={80} axisLine={false} tickLine={false} />
            <Tooltip formatter={fmt} />
            <Bar dataKey="allocated" fill="rgba(99,102,241,0.2)" radius={[0, 6, 6, 0]} name="Budget" />
            <Bar dataKey="spent" fill="url(#spendGradient)" radius={[0, 6, 6, 0]} name="Spent" />
            <defs>
              <linearGradient id="spendGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* AI Suggestions */}
      <div style={{ marginBottom: "24px" }}>
        <div className="section-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={18} color="var(--brand-primary)" />
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>AI Budget Optimizer</h3>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {aiSuggestions.length > 0 && (
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Potential savings: <strong style={{ color: "#22c55e" }}>{formatCurrency(aiSuggestions.reduce((s, a) => s + (a.potential_saving || 0), 0))}</strong></span>
            )}
            <button onClick={runAIOptimizer} disabled={aiLoading} className="btn-secondary" style={{ padding: "7px 14px", fontSize: "12px", display: "flex", alignItems: "center", gap: "5px" }}>
              {aiLoading ? <><span style={{ width: "12px", height: "12px", borderRadius: "50%", border: "2px solid var(--border)", borderTopColor: "var(--brand-primary)", animation: "spin 0.7s linear infinite", display: "inline-block" }} /> Analyzing...</> : <><RefreshCw size={12} /> Run AI Analysis</>}
            </button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
        {(aiSuggestions.length > 0 ? aiSuggestions : []).map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card"
              style={{ padding: "18px" }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <div style={{ fontSize: "24px" }}>{s.category ? (CAT_EMOJIS[s.category] || "💡") : "💡"}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                    <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>{s.title}</h4>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#22c55e", flexShrink: 0, marginLeft: "8px" }}>{formatCurrency(s.potential_saving || 0)}</span>
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "8px" }}>{s.description}</p>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <span className={`badge ${s.impact === "high" ? "badge-danger" : s.impact === "medium" ? "badge-warning" : "badge-success"}`}>{s.impact} impact</span>
                    <TrendingDown size={12} color="#22c55e" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {aiSuggestions.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "32px", color: "var(--text-muted)", fontSize: "14px" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>🤖</div>
              Click <strong>Run AI Analysis</strong> to get personalized budget optimization suggestions
            </div>
          )}
        </div>
      </div>

      {/* Expense log */}
      <div className="card" style={{ padding: "24px" }}>
        <div className="section-header">
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>Expense Log</h3>
          <button onClick={() => setShowAddExpense(true)} className="btn-primary" style={{ padding: "8px 16px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
            <PlusCircle size={14} /> Add Expense
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", border: "2px solid var(--border)", borderTopColor: "var(--brand-primary)", animation: "spin 0.7s linear infinite", margin: "0 auto 8px" }} />
              Loading expenses...
            </div>
          ) : expenses.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)", fontSize: "14px" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>💸</div>
              No expenses recorded yet. Add your first expense!
            </div>
          ) : expenses.map((exp) => (
            <div key={exp.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderRadius: "10px", background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "20px" }}>{CAT_EMOJIS[exp.category] || "💳"}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{exp.description}</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{exp.category} · {exp.expense_date || exp.date}</div>
              </div>
              <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "14px" }}>{formatCurrency(exp.amount)}</div>
              <button onClick={() => deleteExpense(exp.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}><X size={14} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Add expense modal */}
      <AnimatePresence>
        {showAddExpense && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ width: "100%", maxWidth: "400px", borderRadius: "20px", background: "var(--bg-secondary)", border: "1px solid var(--border)", padding: "28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>Add Expense</h3>
                <button onClick={() => setShowAddExpense(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={20} /></button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <select className="input" value={newExpense.category} onChange={(e) => setNewExpense((f) => ({ ...f, category: e.target.value }))}>
                  {["Flights", "Hotels", "Food", "Transport", "Activities", "Shopping", "Other"].map((c) => <option key={c}>{c}</option>)}
                </select>
                <input className="input" type="number" placeholder="Amount (₹)" value={newExpense.amount} onChange={(e) => setNewExpense((f) => ({ ...f, amount: e.target.value }))} />
                <input className="input" placeholder="Description" value={newExpense.description} onChange={(e) => setNewExpense((f) => ({ ...f, description: e.target.value }))} />
                <button onClick={addExpense} className="btn-primary" style={{ padding: "12px", marginTop: "8px" }}>Add Expense</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
