/**
 * useBudget — Custom hook for expense and budget management
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { budgetAPI } from "@/lib/api";

interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  expense_date: string;
  currency?: string;
}

interface CategoryBreakdown {
  category: string;
  total: number;
  expense_count: number;
  average: number;
}

interface BudgetOptimizationReport {
  summary: {
    totalBudget: number;
    totalSpent: number;
    remaining: number;
    percentUsed: number;
    healthScore: number;
    healthLabel: string;
  };
  projection: {
    dailyBurnRate: number;
    daysRemaining: number;
    projectedTotal: number;
    willExceedBudget: boolean;
  };
  suggestions: Array<{
    category: string;
    title: string;
    description: string;
    potentialSaving: number;
    impact: "high" | "medium" | "low";
  }>;
  totalPotentialSaving: number;
}

interface UseBudgetReturn {
  expenses: Expense[];
  breakdown: CategoryBreakdown[];
  timeline: any[];
  report: BudgetOptimizationReport | null;
  loading: boolean;
  optimizing: boolean;
  error: string | null;
  addExpense: (data: Partial<Expense>) => Promise<Expense | null>;
  deleteExpense: (id: string) => Promise<boolean>;
  runOptimizer: () => Promise<void>;
  refresh: () => void;
}

export function useBudget(tripId: string | null | undefined): UseBudgetReturn {
  const [expenses, setExpenses]   = useState<Expense[]>([]);
  const [breakdown, setBreakdown] = useState<CategoryBreakdown[]>([]);
  const [timeline, setTimeline]   = useState<any[]>([]);
  const [report, setReport]       = useState<BudgetOptimizationReport | null>(null);
  const [loading, setLoading]     = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [rev, setRev]             = useState(0);

  // ── Load expenses ────────────────────────────────────
  useEffect(() => {
    if (!tripId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res: any = await budgetAPI.getExpenses(tripId);
        if (cancelled) return;
        const d = res.data?.data || res.data || {};
        setExpenses(d.expenses || []);
        setBreakdown(d.category_breakdown || []);
        setTimeline(d.timeline || []);
      } catch (err: any) {
        if (!cancelled) setError(err.response?.data?.message || "Failed to load expenses.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [tripId, rev]);

  // ── Add expense ──────────────────────────────────────
  const addExpense = useCallback(async (data: Partial<Expense>): Promise<Expense | null> => {
    try {
      const res: any = await budgetAPI.addExpense({ trip_id: tripId, ...data });
      const newExp: Expense = res.data?.data || res.data;
      setExpenses((prev) => [newExp, ...prev]);
      // Trigger full refresh for breakdown/timeline
      setRev((r) => r + 1);
      return newExp;
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add expense.");
      return null;
    }
  }, [tripId]);

  // ── Delete expense ───────────────────────────────────
  const deleteExpense = useCallback(async (id: string): Promise<boolean> => {
    try {
      await budgetAPI.deleteExpense(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      setRev((r) => r + 1);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete expense.");
      return false;
    }
  }, []);

  // ── Run optimizer (pure backend engine — no external API) ──
  const runOptimizer = useCallback(async () => {
    if (!tripId) return;
    setOptimizing(true);
    try {
      const res: any = await budgetAPI.getAIOptimization(tripId);
      setReport(res.data?.data || res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Optimizer unavailable.");
    } finally {
      setOptimizing(false);
    }
  }, [tripId]);

  const refresh = useCallback(() => setRev((r) => r + 1), []);

  return {
    expenses, breakdown, timeline, report,
    loading, optimizing, error,
    addExpense, deleteExpense, runOptimizer, refresh,
  };
}

export default useBudget;
