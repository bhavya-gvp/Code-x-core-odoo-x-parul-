/**
 * budgetOptimizer.js — Knapsack-inspired Budget Rebalancing Engine
 *
 * Analyzes a trip's expense breakdown and produces:
 *  1. Over/under budget warnings per category
 *  2. Concrete reallocation suggestions with projected savings
 *  3. A health score (0–100) for the overall budget
 *  4. Remaining budget projection to end of trip
 *
 * Algorithm:
 *  - Compare actual spending % vs benchmark ranges (from constants)
 *  - Score each category: within range = good, outside = flag
 *  - Generate suggestions ranked by potential saving (highest first)
 *  - Project daily burn rate to end of trip
 *
 * No external API. Pure arithmetic.
 */

import { BUDGET_BENCHMARKS, EXPENSE_CATEGORIES } from "../config/constants.js";

/**
 * Main optimization entry point
 *
 * @param {object} params
 * @param {number} params.totalBudget — Total trip budget
 * @param {object[]} params.categoryBreakdown — [{ category, total }]
 * @param {number} params.daysElapsed — Days into the trip so far
 * @param {number} params.totalDays — Total trip duration
 * @returns {object} Optimization report
 */
export function optimizeBudget({ totalBudget, categoryBreakdown, daysElapsed = 1, totalDays = 7 }) {
  if (!totalBudget || totalBudget <= 0) {
    return { error: "Invalid budget" };
  }

  const totalSpent = categoryBreakdown.reduce((sum, c) => sum + Number(c.total || 0), 0);
  const remaining  = totalBudget - totalSpent;

  // ── Per-category analysis ──────────────────────────────
  const categoryAnalysis = categoryBreakdown.map((cat) => {
    const spent      = Number(cat.total || 0);
    const pctOfTotal = totalBudget > 0 ? (spent / totalBudget) * 100 : 0;
    const benchmark  = BUDGET_BENCHMARKS[cat.category] || { min: 0, ideal: 10, max: 20 };

    let status = "good";
    let deviation = 0;

    if (pctOfTotal > benchmark.max) {
      status = "over";
      deviation = pctOfTotal - benchmark.max;
    } else if (pctOfTotal < benchmark.min && spent > 0) {
      status = "under";
      deviation = benchmark.min - pctOfTotal;
    }

    const idealAmount    = (benchmark.ideal / 100) * totalBudget;
    const potentialSaving = Math.max(0, spent - idealAmount);

    return {
      category:       cat.category,
      spent,
      spentPercent:   Math.round(pctOfTotal * 10) / 10,
      benchmark,
      status,
      deviation:      Math.round(deviation * 10) / 10,
      potentialSaving: Math.round(potentialSaving),
      expenseCount:   cat.expense_count || 0,
    };
  });

  // ── Generate suggestions (sorted by potential saving) ──
  const suggestions = generateSuggestions(categoryAnalysis, totalBudget, totalSpent, remaining);

  // ── Burn rate projection ───────────────────────────────
  const safeDaysElapsed = Math.max(daysElapsed, 1);
  const dailyBurnRate   = totalSpent / safeDaysElapsed;
  const daysRemaining   = Math.max(totalDays - daysElapsed, 0);
  const projectedTotal  = totalSpent + (dailyBurnRate * daysRemaining);
  const projectedOverrun = Math.max(0, projectedTotal - totalBudget);

  // ── Health score (0–100) ───────────────────────────────
  const healthScore = computeHealthScore({
    totalBudget,
    totalSpent,
    remaining,
    projectedTotal,
    overCategories: categoryAnalysis.filter((c) => c.status === "over").length,
    totalCategories: categoryBreakdown.length,
  });

  return {
    summary: {
      totalBudget:     Math.round(totalBudget),
      totalSpent:      Math.round(totalSpent),
      remaining:       Math.round(remaining),
      percentUsed:     totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
      healthScore,
      healthLabel:     getHealthLabel(healthScore),
    },
    projection: {
      dailyBurnRate:   Math.round(dailyBurnRate),
      daysRemaining,
      projectedTotal:  Math.round(projectedTotal),
      projectedOverrun: Math.round(projectedOverrun),
      willExceedBudget: projectedTotal > totalBudget,
    },
    categoryAnalysis,
    suggestions,
    totalPotentialSaving: suggestions.reduce((s, r) => s + r.potentialSaving, 0),
    generatedAt: new Date().toISOString(),
  };
}

// ── Suggestion generator ───────────────────────────────────
function generateSuggestions(categoryAnalysis, totalBudget, totalSpent, remaining) {
  const suggestions = [];

  for (const cat of categoryAnalysis) {
    if (cat.status !== "over" || cat.potentialSaving < 500) continue;

    const tip = getSuggestionTip(cat.category, cat.spentPercent, cat.potentialSaving);
    suggestions.push({
      category:       cat.category,
      title:          tip.title,
      description:    tip.description,
      potentialSaving: cat.potentialSaving,
      impact:         cat.potentialSaving > 5000 ? "high" : cat.potentialSaving > 2000 ? "medium" : "low",
      currentPercent: cat.spentPercent,
      idealPercent:   cat.benchmark.ideal,
      actionable:     true,
    });
  }

  // Global suggestions when overall overspending
  if (remaining < 0) {
    suggestions.push({
      category: "General",
      title: "Activate Savings Mode",
      description: `You're over budget by ₹${Math.abs(Math.round(remaining)).toLocaleString()}. Cut daily food costs by 30% and skip 1 paid activity.`,
      potentialSaving: Math.abs(remaining) * 0.4,
      impact: "high",
      actionable: true,
    });
  }

  // Sort by potential saving descending
  return suggestions.sort((a, b) => b.potentialSaving - a.potentialSaving);
}

function getSuggestionTip(category, spentPercent, potentialSaving) {
  const tips = {
    Flights: {
      title: "Optimize flight costs",
      description: `Flights are ${spentPercent}% of budget. For future bookings, use Tuesday/Wednesday departures and compare layover routes — can save 25–40%.`,
    },
    Hotels: {
      title: "Switch to boutique hotels",
      description: `Hotels are consuming ${spentPercent}% of budget. Booking 14+ days early or switching to boutique stays can reduce this by 20–30%.`,
    },
    Food: {
      title: "Balance restaurant spending",
      description: `Food is ${spentPercent}% of your budget. Mixing 1 restaurant meal with local street food daily can save ₹${Math.round(potentialSaving).toLocaleString()}.`,
    },
    Transport: {
      title: "Use public transport passes",
      description: `Local transport is over budget. Day passes vs per-ride are typically 60% cheaper in most cities.`,
    },
    Activities: {
      title: "Prioritize free attractions",
      description: `Activities are over the ideal range. Every city has free museums on specific days — research ahead to save ₹${Math.round(potentialSaving).toLocaleString()}.`,
    },
    Shopping: {
      title: "Set a shopping envelope",
      description: `Shopping has exceeded the ideal allocation. Set a fixed daily shopping envelope to prevent overspend.`,
    },
  };
  return tips[category] || {
    title: `Reduce ${category} spending`,
    description: `${category} is over the recommended budget allocation. Review recent expenses and look for cheaper alternatives.`,
  };
}

function computeHealthScore({ totalBudget, totalSpent, remaining, projectedTotal, overCategories, totalCategories }) {
  let score = 100;

  // Deduct for overspend
  const pctUsed = (totalSpent / totalBudget) * 100;
  if (pctUsed > 90)  score -= 30;
  else if (pctUsed > 75) score -= 15;
  else if (pctUsed > 60) score -= 5;

  // Deduct for projection overrun
  if (projectedTotal > totalBudget) score -= 20;

  // Deduct for over-budget categories
  const overRatio = overCategories / Math.max(totalCategories, 1);
  score -= Math.round(overRatio * 25);

  // Bonus for healthy remaining
  if (remaining / totalBudget > 0.3) score += 5;

  return Math.max(0, Math.min(100, score));
}

function getHealthLabel(score) {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Needs Attention";
  return "Critical";
}

export default { optimizeBudget };
