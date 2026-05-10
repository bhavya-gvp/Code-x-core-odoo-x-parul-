/**
 * features/trips/types.ts — Trip domain types
 */

export interface Trip {
  id: string;
  title: string;
  description?: string;
  cover_image?: string;
  start_date: string;
  end_date: string;
  budget: number;
  spent_amount?: number;
  actual_spent?: number;
  mood?: string;
  travel_type?: string;
  status: "planning" | "upcoming" | "ongoing" | "completed";
  visibility: "private" | "friends" | "public";
  cities?: TripCity[];
  collaborator_count?: number;
  budget_summary?: BudgetSummary;
  author_name?: string;
  author_image?: string;
  days_count?: number;
  activities_count?: number;
  created_at: string;
}

export interface TripCity {
  id: string;
  city_name: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  order_index: number;
}

export interface BudgetSummary {
  total_budget: number;
  total_spent: number;
  remaining: number;
  percent_used: number;
  expense_count: number;
  category_breakdown: { category: string; total: number }[];
}

export interface TripFormData {
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  budget: number;
  mood?: string;
  travel_type?: string;
  visibility: "private" | "friends" | "public";
}
