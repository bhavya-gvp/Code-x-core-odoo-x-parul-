/**
 * groupPreferenceMatcher.js — Collaborative Trip Preference Consensus Engine
 *
 * Finds the optimal consensus between collaborators using:
 *  1. Borda Count voting for activity type preferences
 *  2. Date range intersection for travel window
 *  3. Harmonic mean of budgets (avoids extreme skew)
 *  4. Majority vote for destination preference
 *  5. Conflict detection and compromise suggestions
 *
 * No external API. Pure combinatorial logic.
 */

/**
 * Match preferences across all collaborators
 *
 * @param {object[]} collaborators — Array of preference objects
 *   Each: { name, budget, dates: {start, end}, activityPrefs: string[], destination?: string }
 * @returns {object} Consensus result with compromise suggestions
 */
export function matchGroupPreferences(collaborators) {
  if (!collaborators?.length) {
    return { error: "No collaborator preferences provided." };
  }
  if (collaborators.length === 1) {
    return singlePersonResult(collaborators[0]);
  }

  const consensusBudget      = computeHarmonicMeanBudget(collaborators);
  const dateConsensus        = computeDateIntersection(collaborators);
  const activityConsensus    = bordaCountActivities(collaborators);
  const destinationConsensus = majorityVoteDestination(collaborators);
  const conflicts            = detectConflicts(collaborators, dateConsensus, consensusBudget);

  return {
    groupSize:    collaborators.length,
    consensus: {
      budget:       consensusBudget,
      dateRange:    dateConsensus,
      topActivities: activityConsensus.ranked.slice(0, 5),
      destination:   destinationConsensus,
    },
    analysis: {
      budgetRange: {
        min: Math.min(...collaborators.map((c) => c.budget || 0)),
        max: Math.max(...collaborators.map((c) => c.budget || 0)),
        harmonic: consensusBudget,
      },
      activityScores: activityConsensus.scores,
      dateOverlap:    dateConsensus.overlappingDays,
      agreementScore: computeAgreementScore(collaborators, conflicts),
    },
    conflicts,
    compromiseSuggestions: generateCompromises(collaborators, conflicts, consensusBudget, dateConsensus),
    generatedAt: new Date().toISOString(),
  };
}

// ── Budget: Harmonic mean (penalizes extreme high budgets) ──
function computeHarmonicMeanBudget(collaborators) {
  const budgets = collaborators.map((c) => Number(c.budget || 0)).filter((b) => b > 0);
  if (!budgets.length) return 0;

  const harmonicMean = budgets.length / budgets.reduce((sum, b) => sum + 1 / b, 0);
  return Math.round(harmonicMean);
}

// ── Dates: Find overlapping window ─────────────────────────
function computeDateIntersection(collaborators) {
  const dateRanges = collaborators
    .filter((c) => c.dates?.start && c.dates?.end)
    .map((c) => ({
      start: new Date(c.dates.start),
      end:   new Date(c.dates.end),
      name:  c.name,
    }));

  if (!dateRanges.length) {
    return { start: null, end: null, overlappingDays: 0, hasOverlap: false };
  }

  // Intersection = latest start, earliest end
  const latestStart  = new Date(Math.max(...dateRanges.map((r) => r.start)));
  const earliestEnd  = new Date(Math.min(...dateRanges.map((r) => r.end)));
  const overlapping  = (earliestEnd - latestStart) / (1000 * 60 * 60 * 24);

  return {
    start:           latestStart <= earliestEnd ? latestStart.toISOString().split("T")[0] : null,
    end:             latestStart <= earliestEnd ? earliestEnd.toISOString().split("T")[0] : null,
    overlappingDays: Math.max(0, Math.ceil(overlapping)),
    hasOverlap:      latestStart <= earliestEnd,
    dateRanges,
  };
}

// ── Activities: Borda Count voting ─────────────────────────
function bordaCountActivities(collaborators) {
  const scoreMap = {};
  const n = collaborators.length;

  for (const collaborator of collaborators) {
    const prefs = collaborator.activityPrefs || [];
    // Borda: n-1 points for 1st choice, n-2 for 2nd, etc.
    prefs.forEach((activity, index) => {
      const points = Math.max(0, prefs.length - index);
      scoreMap[activity] = (scoreMap[activity] || 0) + points;
    });
  }

  const ranked = Object.entries(scoreMap)
    .sort((a, b) => b[1] - a[1])
    .map(([activity, score]) => ({
      activity,
      score,
      consensusPercent: Math.round((score / (n * Math.max(...Object.values(scoreMap)))) * 100),
    }));

  return { ranked, scores: scoreMap };
}

// ── Destination: Majority vote ─────────────────────────────
function majorityVoteDestination(collaborators) {
  const voteCounts = {};
  for (const c of collaborators) {
    if (c.destination) {
      voteCounts[c.destination] = (voteCounts[c.destination] || 0) + 1;
    }
  }

  if (!Object.keys(voteCounts).length) return null;

  const winner = Object.entries(voteCounts).sort((a, b) => b[1] - a[1])[0];
  return {
    destination: winner[0],
    votes:       winner[1],
    totalVoters: collaborators.length,
    hasConsensus: winner[1] > collaborators.length / 2,
    allVotes:    voteCounts,
  };
}

// ── Conflict detection ─────────────────────────────────────
function detectConflicts(collaborators, dateConsensus, consensusBudget) {
  const conflicts = [];

  // Date conflict
  if (!dateConsensus.hasOverlap) {
    conflicts.push({
      type: "DATE_NO_OVERLAP",
      severity: "high",
      message: "No overlapping travel dates found for all members.",
      affectedMembers: collaborators.map((c) => c.name),
      suggestion: "Consider a shorter trip window or find a 3–4 day overlap.",
    });
  } else if (dateConsensus.overlappingDays < 3) {
    conflicts.push({
      type: "DATE_SHORT_OVERLAP",
      severity: "medium",
      message: `Only ${dateConsensus.overlappingDays} days overlap — very limited.`,
      suggestion: "Consider a weekend trip or adjust dates by 2–3 days.",
    });
  }

  // Budget conflict
  const budgets = collaborators.map((c) => c.budget || 0);
  const maxBudget = Math.max(...budgets);
  const minBudget = Math.min(...budgets.filter((b) => b > 0));
  if (maxBudget > minBudget * 2.5) {
    conflicts.push({
      type: "BUDGET_MISMATCH",
      severity: "medium",
      message: `Budget gap is ${Math.round((maxBudget / minBudget) * 10) / 10}x between members.`,
      suggestion: `Plan trip at ₹${consensusBudget.toLocaleString()} — the harmonic consensus budget.`,
      affectedMembers: collaborators
        .filter((c) => (c.budget || 0) < consensusBudget * 0.7)
        .map((c) => c.name),
    });
  }

  return conflicts;
}

function computeAgreementScore(collaborators, conflicts) {
  let score = 100;
  for (const conflict of conflicts) {
    if (conflict.severity === "high")   score -= 30;
    if (conflict.severity === "medium") score -= 15;
    if (conflict.severity === "low")    score -= 5;
  }
  return Math.max(0, score);
}

function generateCompromises(collaborators, conflicts, budget, dateConsensus) {
  const suggestions = [];

  if (!dateConsensus.hasOverlap) {
    suggestions.push({
      area: "Dates",
      suggestion: "Have 1 member shift by 3–5 days to create overlap.",
      impact: "Unlocks group travel possibility",
    });
  }

  if (conflicts.some((c) => c.type === "BUDGET_MISMATCH")) {
    suggestions.push({
      area: "Budget",
      suggestion: `Split costs: core members pay ₹${Math.round(budget * 1.2).toLocaleString()}, budget members pay ₹${Math.round(budget * 0.8).toLocaleString()} (skip 1–2 premium activities).`,
      impact: "Includes everyone at fair cost",
    });
  }

  suggestions.push({
    area: "Activities",
    suggestion: "Plan 50% group activities, 50% free time for individual preferences.",
    impact: "Reduces friction on activity choices",
  });

  return suggestions;
}

function singlePersonResult(collaborator) {
  return {
    groupSize: 1,
    consensus: {
      budget:        collaborator.budget,
      dateRange:     collaborator.dates,
      topActivities: (collaborator.activityPrefs || []).slice(0, 5).map((a) => ({ activity: a, score: 1, consensusPercent: 100 })),
      destination:   collaborator.destination ? { destination: collaborator.destination, votes: 1, totalVoters: 1, hasConsensus: true } : null,
    },
    conflicts: [],
    compromiseSuggestions: [],
    generatedAt: new Date().toISOString(),
  };
}

export default { matchGroupPreferences };
