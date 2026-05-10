/**
 * features/budget/types.ts — Budget domain types
 */

export interface Expense {
  id: string;
  trip_id: string;
  category: string;
  amount: number;
  currency: string;
  description: string;
  expense_date: string;
  receipt_url?: string;
  added_by_name?: string;
  created_at: string;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  expense_count: number;
  average: number;
  minimum: number;
  maximum: number;
}

export interface TimelineEntry {
  date: string;
  daily_total: number;
  transaction_count: number;
}

export interface BudgetOptimizerReport {
  summary: {
    totalBudget: number;
    totalSpent: number;
    remaining: number;
    percentUsed: number;
    healthScore: number;
    healthLabel: "Excellent" | "Good" | "Needs Attention" | "Critical";
  };
  projection: {
    dailyBurnRate: number;
    daysRemaining: number;
    projectedTotal: number;
    willExceedBudget: boolean;
    projectedOverrun: number;
  };
  categoryAnalysis: Array<{
    category: string;
    spent: number;
    spentPercent: number;
    status: "good" | "over" | "under";
    potentialSaving: number;
  }>;
  suggestions: Array<{
    category: string;
    title: string;
    description: string;
    potentialSaving: number;
    impact: "high" | "medium" | "low";
  }>;
  totalPotentialSaving: number;
}
