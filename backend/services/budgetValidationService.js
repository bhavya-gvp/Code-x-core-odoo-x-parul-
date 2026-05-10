/**
 * budgetValidationService.js
 * Validates trip feasibility and filters destinations by budget realism.
 */

import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DESTINATIONS = require("../data/destinations.json");

// ── Budget tiers (total trip budget INR) ───────────────────
const BUDGET_TIERS = {
  MICRO:    { max: 3000,   label: "Micro",    tier: "budget" },
  LOW:      { max: 15000,  label: "Low",      tier: "budget" },
  MODERATE: { max: 50000,  label: "Moderate", tier: "budget" },
  MID:      { max: 150000, label: "Mid",      tier: "mid"    },
  HIGH:     { max: 400000, label: "High",     tier: "luxury" },
  LUXURY:   { max: Infinity,label: "Luxury",  tier: "luxury" },
};

function getBudgetTier(totalBudget) {
  for (const [key, t] of Object.entries(BUDGET_TIERS)) {
    if (totalBudget <= t.max) return { key, ...t };
  }
  return { key: "LUXURY", ...BUDGET_TIERS.LUXURY };
}

/**
 * Calculate the MINIMUM cost to visit a destination.
 * Formula: (flightCost * travelers) + (dailyCost * days * travelers)
 */
function estimateMinCost(dest, days, travelers) {
  const dailyCost = dest.minDailyCostPerPerson || 500;
  const flightCost = (dest.flightCostINR || 0) * travelers;
  return flightCost + dailyCost * days * travelers;
}

/**
 * Score a destination against user constraints.
 * Returns 0-100. Returns -1 if destination is INFEASIBLE (budget too low).
 */
export function scoreDestination(dest, { budget, days, travelers, mood, travel_type }) {
  const minCost = estimateMinCost(dest, days, travelers);

  // Hard reject — cannot afford even minimum
  if (budget < minCost) return -1;

  const budgetTier = getBudgetTier(budget);
  let score = 0;

  // Budget fit (40%) — how well budget matches destination category
  const tierMatch = {
    budget: { MICRO: 1.0, LOW: 0.9, MODERATE: 0.8, MID: 0.4, HIGH: 0.1, LUXURY: 0.0 },
    mid:    { MICRO: 0.0, LOW: 0.3, MODERATE: 0.7, MID: 1.0, HIGH: 0.6, LUXURY: 0.2 },
    luxury: { MICRO: 0.0, LOW: 0.0, MODERATE: 0.1, MID: 0.5, HIGH: 0.9, LUXURY: 1.0 },
  };
  const destCat = dest.budgetCategory || "mid";
  score += (tierMatch[destCat]?.[budgetTier.key] ?? 0.5) * 40;

  // Mood fit (25%)
  const moodKey = (mood || "relax").toLowerCase().replace(/[\s_-]+/g, "");
  const moodMatch = (dest.moods || []).some(m =>
    moodKey.includes(m.toLowerCase()) || m.toLowerCase().includes(moodKey)
  );
  score += moodMatch ? 25 : 8;

  // Travel style fit (20%)
  const styleKey = (travel_type || "").toLowerCase();
  const styleMatch = (dest.travelStyles || []).some(s => styleKey.includes(s) || s.includes(styleKey.split(" ")[0]));
  score += styleMatch ? 20 : 6;

  // Duration fit (15%)
  const idealMin = dest.minDays || 1;
  const idealMax = dest.maxDays || 5;
  if (days >= idealMin && days <= idealMax) score += 15;
  else if (days >= idealMin - 1 && days <= idealMax + 1) score += 8;
  else score += 2;

  return Math.round(score);
}

/**
 * Validate entire trip parameters before generation.
 * Returns { valid, errors, warnings, budgetTier, recommendedDestinations }
 */
export function validateTripFeasibility({ destinations: destNames, budget, start_date, end_date, travelers, mood, travel_type }) {
  const errors = [];
  const warnings = [];

  // Duration
  const days = Math.max(1, Math.ceil((new Date(end_date) - new Date(start_date)) / 86400000));

  // Budget per person per day
  const dailyPerPerson = budget / (travelers || 1) / days;
  const budgetTier = getBudgetTier(budget);

  // Minimum viable budget check
  const absoluteMin = 200 * days * (travelers || 1); // ₹200/person/day absolute floor
  if (budget < absoluteMin) {
    errors.push(`Budget ₹${budget} is below the minimum ₹${absoluteMin} for ${days} days with ${travelers} traveler(s).`);
  }

  // Validate each requested destination against budget
  const infeasible = [];
  const feasible = [];

  if (destNames && destNames.length > 0) {
    for (const name of destNames) {
      const key = name.toUpperCase().replace(/\s+/g, "_");
      const dest = DESTINATIONS[key] || Object.values(DESTINATIONS).find(d =>
        d.name.toLowerCase().includes(name.toLowerCase())
      );

      if (dest) {
        const minCost = estimateMinCost(dest, days, travelers || 1);
        if (budget < minCost) {
          infeasible.push({ name: dest.name, minCost, shortfall: minCost - budget });
        } else {
          feasible.push(dest.name);
        }
      }
    }

    if (infeasible.length > 0) {
      infeasible.forEach(d => {
        warnings.push(`⚠️ ${d.name} requires ₹${d.minCost.toLocaleString("en-IN")} minimum. You're short by ₹${d.shortfall.toLocaleString("en-IN")}.`);
      });
    }
  }

  // Get budget-appropriate recommendations
  const recommendedDestinations = Object.values(DESTINATIONS)
    .map(d => ({ dest: d, score: scoreDestination(d, { budget, days, travelers, mood, travel_type }) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(x => x.dest.name);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    days,
    dailyPerPerson: Math.round(dailyPerPerson),
    budgetTier: budgetTier.label,
    budgetTierKey: budgetTier.key,
    infeasibleDestinations: infeasible.map(d => d.name),
    feasibleDestinations: feasible,
    recommendedDestinations,
  };
}

export default { validateTripFeasibility, scoreDestination };
