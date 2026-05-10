"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PlusCircle, DollarSign } from "lucide-react";
import { EXPENSE_CATEGORIES, CATEGORY_META } from "@/lib/constants";
import type { Expense } from "../types";

interface ExpenseFormProps {
  tripId: string;
  onAdd: (data: Partial<Expense>) => Promise<Expense | null>;
  loading?: boolean;
}

const today = new Date().toISOString().split("T")[0];

export function ExpenseForm({ tripId, onAdd, loading = false }: ExpenseFormProps) {
  const [form, setForm] = useState({
    category: "Food",
    amount: "",
    description: "",
    expense_date: today,
    currency: "INR",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.description || !form.expense_date) {
      setError("Amount, description, and date are required.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const result = await onAdd({
      trip_id:      tripId,
      category:     form.category,
      amount:       Number(form.amount),
      description:  form.description,
      expense_date: form.expense_date,
      currency:     form.currency,
    });
    setSubmitting(false);
    if (result) {
      setForm({ category: "Food", amount: "", description: "", expense_date: today, currency: "INR" });
    }
  };

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {error && (
        <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", fontSize: "13px" }}>
          {error}
        </div>
      )}

      {/* Category selector */}
      <div>
        <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "8px" }}>Category</label>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {EXPENSE_CATEGORIES.map((cat) => {
            const meta = CATEGORY_META[cat] || { emoji: "💳", color: "#94a3b8" };
            const selected = form.category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => set("category", cat)}
                style={{
                  padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 600,
                  border: `1px solid ${selected ? meta.color : "var(--border)"}`,
                  background: selected ? `${meta.color}22` : "var(--bg-card)",
                  color: selected ? meta.color : "var(--text-secondary)",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                {meta.emoji} {cat}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>Amount (₹) *</label>
          <input
            className="input"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
            required
          />
        </div>
        <div>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>Date *</label>
          <input
            className="input"
            type="date"
            value={form.expense_date}
            onChange={(e) => set("expense_date", e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>Description *</label>
        <input
          className="input"
          type="text"
          placeholder="e.g., Dinner at local restaurant"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          required
          maxLength={500}
        />
      </div>

      <motion.button
        type="submit"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        disabled={submitting || loading}
        className="btn-primary"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
      >
        <PlusCircle size={16} />
        {submitting ? "Adding..." : "Add Expense"}
      </motion.button>
    </form>
  );
}
