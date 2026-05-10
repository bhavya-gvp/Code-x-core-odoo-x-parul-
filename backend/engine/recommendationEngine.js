/**
 * recommendationEngine.js — Weighted Destination Scoring Engine
 *
 * Scores and ranks destinations/experiences based on:
 *  1. Travel personality match (35% weight)
 *  2. Mood/vibe alignment (25% weight)
 *  3. Budget fit (20% weight)
 *  4. Season/timing fit (10% weight)
 *  5. Popularity/safety index (10% weight)
 *
 * No ML. No external API. Pure weighted scoring on categorical data.
 * Algorithm inspired by collaborative filtering principles.
 */

import { RECOMMENDATION_WEIGHTS } from "../config/constants.js";

// ── Destination catalog ────────────────────────────────────
// Each destination has attribute tags scored 0–10 per dimension
const DESTINATIONS = [
  {
    id: "bali",
    name: "Bali, Indonesia",
    country: "Indonesia",
    emoji: "🌴",
    coverImage: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600",
    personalities: { Backpacker: 9, "Creator Traveler": 9, "Solo Explorer": 8, "Spiritual Traveler": 9, "Romantic Planner": 8, "Adventure Seeker": 7, "Luxury Explorer": 6 },
    moods: { "Relax": 9, "Burnout Recovery": 10, "Romantic Escape": 8, "Social Trip": 6, "Adventure Rush": 6, "Nature Detox": 9 },
    avgBudgetINR: 65000,
    peakMonths: [7, 8, 9],
    goodMonths: [6, 10, 11],
    safetyScore: 7,
    popularityScore: 9,
    activities: ["Beach", "Spiritual", "Photography", "Nature", "Food"],
    tags: ["wellness", "temples", "rice-terraces", "surf", "culture"],
  },
  {
    id: "japan",
    name: "Japan",
    country: "Japan",
    emoji: "🗾",
    coverImage: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600",
    personalities: { Backpacker: 7, "Creator Traveler": 10, "Solo Explorer": 9, "Spiritual Traveler": 8, "Romantic Planner": 8, "Adventure Seeker": 6, "Luxury Explorer": 9 },
    moods: { "Relax": 7, "Burnout Recovery": 7, "Romantic Escape": 8, "Social Trip": 7, "Adventure Rush": 5, "Nature Detox": 6 },
    avgBudgetINR: 180000,
    peakMonths: [3, 4, 11, 12],
    goodMonths: [1, 2, 5, 9, 10],
    safetyScore: 10,
    popularityScore: 10,
    activities: ["Cultural", "Food", "Museum", "Photography", "Shopping"],
    tags: ["anime", "cherry-blossom", "sushi", "samurai", "technology"],
  },
  {
    id: "iceland",
    name: "Iceland",
    country: "Iceland",
    emoji: "🌋",
    coverImage: "https://images.unsplash.com/photo-1502920917128-1aa500764b5e?w=600",
    personalities: { Backpacker: 7, "Creator Traveler": 10, "Solo Explorer": 9, "Spiritual Traveler": 7, "Romantic Planner": 9, "Adventure Seeker": 10, "Luxury Explorer": 7 },
    moods: { "Relax": 5, "Burnout Recovery": 8, "Romantic Escape": 9, "Social Trip": 5, "Adventure Rush": 10, "Nature Detox": 10 },
    avgBudgetINR: 250000,
    peakMonths: [6, 7, 8],
    goodMonths: [1, 2, 9],
    safetyScore: 10,
    popularityScore: 8,
    activities: ["Adventure", "Nature", "Photography", "Local Experience"],
    tags: ["northern-lights", "geysers", "waterfalls", "midnight-sun", "volcanoes"],
  },
  {
    id: "santorini",
    name: "Santorini, Greece",
    country: "Greece",
    emoji: "🏛️",
    coverImage: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600",
    personalities: { Backpacker: 4, "Creator Traveler": 10, "Solo Explorer": 6, "Spiritual Traveler": 5, "Romantic Planner": 10, "Adventure Seeker": 4, "Luxury Explorer": 10 },
    moods: { "Relax": 9, "Burnout Recovery": 8, "Romantic Escape": 10, "Social Trip": 7, "Adventure Rush": 3, "Nature Detox": 6 },
    avgBudgetINR: 200000,
    peakMonths: [6, 7, 8, 9],
    goodMonths: [5, 10],
    safetyScore: 9,
    popularityScore: 9,
    activities: ["Beach", "Photography", "Food", "Local Experience"],
    tags: ["sunset", "whitewashed", "wine", "caldera", "honeymoon"],
  },
  {
    id: "ladakh",
    name: "Ladakh, India",
    country: "India",
    emoji: "🏔️",
    coverImage: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600",
    personalities: { Backpacker: 9, "Creator Traveler": 9, "Solo Explorer": 10, "Spiritual Traveler": 10, "Romantic Planner": 6, "Adventure Seeker": 10, "Luxury Explorer": 4 },
    moods: { "Relax": 5, "Burnout Recovery": 9, "Romantic Escape": 6, "Social Trip": 5, "Adventure Rush": 10, "Nature Detox": 10 },
    avgBudgetINR: 45000,
    peakMonths: [6, 7, 8, 9],
    goodMonths: [5, 10],
    safetyScore: 7,
    popularityScore: 7,
    activities: ["Adventure", "Nature", "Spiritual", "Photography"],
    tags: ["mountains", "monasteries", "pangong", "motorbike", "altitude"],
  },
  {
    id: "thailand",
    name: "Thailand",
    country: "Thailand",
    emoji: "🐘",
    coverImage: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600",
    personalities: { Backpacker: 10, "Creator Traveler": 8, "Solo Explorer": 9, "Spiritual Traveler": 7, "Romantic Planner": 7, "Adventure Seeker": 8, "Luxury Explorer": 7 },
    moods: { "Relax": 8, "Burnout Recovery": 8, "Romantic Escape": 7, "Social Trip": 10, "Adventure Rush": 8, "Nature Detox": 7 },
    avgBudgetINR: 50000,
    peakMonths: [11, 12, 1, 2, 3],
    goodMonths: [4, 10],
    safetyScore: 7,
    popularityScore: 10,
    activities: ["Beach", "Food", "Nightlife", "Local Experience", "Spiritual"],
    tags: ["temples", "street-food", "islands", "party", "elephants"],
  },
  {
    id: "new-zealand",
    name: "New Zealand",
    country: "New Zealand",
    emoji: "🦅",
    coverImage: "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=600",
    personalities: { Backpacker: 8, "Creator Traveler": 9, "Solo Explorer": 9, "Spiritual Traveler": 7, "Romantic Planner": 8, "Adventure Seeker": 10, "Luxury Explorer": 7 },
    moods: { "Relax": 7, "Burnout Recovery": 9, "Romantic Escape": 8, "Social Trip": 6, "Adventure Rush": 10, "Nature Detox": 10 },
    avgBudgetINR: 220000,
    peakMonths: [12, 1, 2, 3],
    goodMonths: [9, 10, 11],
    safetyScore: 10,
    popularityScore: 8,
    activities: ["Adventure", "Nature", "Photography", "Local Experience"],
    tags: ["lotr", "bungee", "fjords", "hiking", "maori"],
  },
  {
    id: "morocco",
    name: "Morocco",
    country: "Morocco",
    emoji: "🕌",
    coverImage: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=600",
    personalities: { Backpacker: 9, "Creator Traveler": 10, "Solo Explorer": 8, "Spiritual Traveler": 9, "Romantic Planner": 7, "Adventure Seeker": 7, "Luxury Explorer": 7 },
    moods: { "Relax": 6, "Burnout Recovery": 7, "Romantic Escape": 7, "Social Trip": 7, "Adventure Rush": 7, "Nature Detox": 7 },
    avgBudgetINR: 80000,
    peakMonths: [3, 4, 10, 11],
    goodMonths: [2, 5, 9, 12],
    safetyScore: 6,
    popularityScore: 8,
    activities: ["Cultural", "Food", "Photography", "Local Experience", "Shopping"],
    tags: ["medina", "desert", "souks", "riad", "couscous"],
  },
];

/**
 * Get personalized destination recommendations
 *
 * @param {object} params
 * @param {string} params.personality — Travel personality type
 * @param {string} params.mood — Trip mood
 * @param {number} params.budget — Available budget in INR
 * @param {number} [params.month] — Travel month (1–12)
 * @param {string[]} [params.excludeIds] — Already visited destinations
 * @param {number} [params.limit] — Max results
 * @returns {object[]} Ranked recommendations with scores
 */
export function getRecommendations({ personality, mood, budget, month, excludeIds = [], limit = 5 }) {
  const currentMonth = month || new Date().getMonth() + 1;

  const scored = DESTINATIONS
    .filter((d) => !excludeIds.includes(d.id))
    .map((dest) => {
      const score = computeScore(dest, { personality, mood, budget, month: currentMonth });
      return { ...dest, score, breakdown: score.breakdown };
    })
    .sort((a, b) => b.score.total - a.score.total)
    .slice(0, limit);

  return {
    recommendations: scored.map((d) => ({
      id:          d.id,
      name:        d.name,
      country:     d.country,
      emoji:       d.emoji,
      coverImage:  d.coverImage,
      score:       Math.round(d.score.total),
      scoreBreakdown: d.score.breakdown,
      matchReason: generateMatchReason(d, personality, mood),
      avgBudget:   d.avgBudgetINR,
      budgetFit:   getBudgetFitLabel(d.avgBudgetINR, budget),
      seasonRating: getSeasonRating(d, currentMonth),
      topActivities: d.activities.slice(0, 3),
      tags:        d.tags.slice(0, 4),
    })),
    meta: { personality, mood, budget, month: currentMonth },
    generatedAt: new Date().toISOString(),
  };
}

function computeScore(dest, { personality, mood, budget, month }) {
  const W = RECOMMENDATION_WEIGHTS;

  // 1. Personality match
  const personalityScore = personality ? ((dest.personalities[personality] || 5) / 10) * 100 : 50;

  // 2. Mood match
  const moodScore = mood ? ((dest.moods[mood] || 5) / 10) * 100 : 50;

  // 3. Budget fit (100 if under budget, scaled down if over)
  const budgetFitScore = budget
    ? Math.min(100, (budget / dest.avgBudgetINR) * 100)
    : 70;

  // 4. Season fit
  let seasonScore = 50;
  if (dest.peakMonths.includes(month)) seasonScore = 100;
  else if (dest.goodMonths.includes(month)) seasonScore = 75;
  else seasonScore = 30;

  // 5. Popularity + safety (combined)
  const popularityScore = ((dest.safetyScore + dest.popularityScore) / 20) * 100;

  const total = (
    personalityScore * W.PERSONALITY_MATCH +
    moodScore        * W.MOOD_MATCH        +
    budgetFitScore   * W.BUDGET_FIT        +
    seasonScore      * W.SEASON_FIT        +
    popularityScore  * W.POPULARITY
  );

  return {
    total: Math.min(100, Math.round(total)),
    breakdown: {
      personality: Math.round(personalityScore),
      mood:        Math.round(moodScore),
      budget:      Math.round(budgetFitScore),
      season:      Math.round(seasonScore),
      popularity:  Math.round(popularityScore),
    },
  };
}

function generateMatchReason(dest, personality, mood) {
  const reasons = [];
  if (personality && (dest.personalities[personality] || 0) >= 8) {
    reasons.push(`Perfect for ${personality}s`);
  }
  if (mood && (dest.moods[mood] || 0) >= 8) {
    reasons.push(`Ideal for "${mood}" trips`);
  }
  if (dest.safetyScore >= 9) reasons.push("Very safe destination");
  if (!reasons.length) reasons.push("Highly recommended for your profile");
  return reasons.join(" · ");
}

function getBudgetFitLabel(avgBudget, userBudget) {
  if (!userBudget) return "Unknown";
  const ratio = userBudget / avgBudget;
  if (ratio >= 1.3) return "Well within budget";
  if (ratio >= 0.9) return "Fits your budget";
  if (ratio >= 0.7) return "Slightly over budget";
  return "Over budget";
}

function getSeasonRating(dest, month) {
  if (dest.peakMonths.includes(month)) return "Peak season — book early";
  if (dest.goodMonths.includes(month)) return "Great time to visit";
  return "Off-season — fewer crowds, lower prices";
}

export default { getRecommendations };
