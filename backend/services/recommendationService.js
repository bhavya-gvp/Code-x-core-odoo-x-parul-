import pool from "../config/db.js";

/**
 * Budget Optimizer Service
 * Analyzes trip expenses and provides smart optimization recommendations
 */

/**
 * Analyze budget and return AI optimization suggestions
 * @param {string} tripId
 * @param {string} userId
 * @returns {Object} Optimization report
 */
export const optimizeBudget = async (tripId, userId) => {
  // Get trip details
  const [trips] = await pool.execute(
    "SELECT * FROM trips WHERE id = ? AND user_id = ?",
    [tripId, userId]
  );
  if (!trips.length) throw new Error("Trip not found");

  const trip = trips[0];

  // Get expense breakdown by category
  const [expenses] = await pool.execute(
    `SELECT category, SUM(amount) AS total, COUNT(*) AS count
     FROM expenses WHERE trip_id = ?
     GROUP BY category`,
    [tripId]
  );

  const totalSpent = expenses.reduce((s, e) => s + parseFloat(e.total), 0);
  const remaining = parseFloat(trip.budget) - totalSpent;

  // Category benchmarks (% of total budget for a balanced trip)
  const BENCHMARKS = {
    Flights: 0.40,
    Hotels: 0.30,
    Food: 0.12,
    Transport: 0.08,
    Activities: 0.10,
  };

  const suggestions = [];
  let potentialSavings = 0;

  expenses.forEach((exp) => {
    const benchmark = BENCHMARKS[exp.category];
    if (!benchmark) return;
    const expectedAmount = parseFloat(trip.budget) * benchmark;
    const actual = parseFloat(exp.total);
    const overspend = actual - expectedAmount;

    if (overspend > 0) {
      const saving = Math.round(overspend * 0.3); // Conservative 30% reduction estimate
      potentialSavings += saving;
      suggestions.push({
        category: exp.category,
        type: "warning",
        impact: overspend > 10000 ? "high" : overspend > 3000 ? "medium" : "low",
        title: `Optimize ${exp.category} spend`,
        description: getSuggestionText(exp.category),
        current: actual,
        benchmark: expectedAmount,
        potential_saving: saving,
      });
    }
  });

  // General optimization tips
  const generalTips = [
    {
      title: "Book activities in advance",
      description: "Pre-booking popular attractions saves 15–25% on tickets",
      saving_estimate: Math.round(totalSpent * 0.05),
      impact: "medium",
    },
    {
      title: "Use local transport",
      description: "Metro/bus passes are 70% cheaper than taxis",
      saving_estimate: Math.round(totalSpent * 0.04),
      impact: "medium",
    },
    {
      title: "Eat lunch at restaurants, dinner cheaper",
      description: "Many restaurants have lunch sets at half the dinner price",
      saving_estimate: Math.round(totalSpent * 0.03),
      impact: "low",
    },
  ];

  return {
    trip_id: tripId,
    total_budget: parseFloat(trip.budget),
    total_spent: totalSpent,
    remaining,
    health_score: Math.max(0, Math.min(100, Math.round((remaining / parseFloat(trip.budget)) * 100) + 30)),
    potential_savings: potentialSavings,
    category_analysis: expenses.map((e) => ({
      ...e,
      total: parseFloat(e.total),
      benchmark_amount: Math.round(parseFloat(trip.budget) * (BENCHMARKS[e.category] || 0.1)),
      benchmark_pct: BENCHMARKS[e.category] || 0.1,
    })),
    suggestions: [...suggestions, ...generalTips].slice(0, 6),
    ai_generated: true,
    timestamp: new Date().toISOString(),
  };
};

function getSuggestionText(category) {
  const texts = {
    Flights: "Consider booking 8–12 weeks in advance or using flight alert services. Nearby airports can be 30% cheaper.",
    Hotels: "Compare hotel vs Airbnb. Booking directly on hotel websites often gives 10% off vs OTAs.",
    Food: "Mix restaurant meals with local street food and convenience stores to cut food costs significantly.",
    Transport: "Use day/week transit passes instead of individual tickets. Many cities have tourist transport cards.",
    Activities: "Look for free/low-cost alternatives — many world-class museums have free entry days.",
    Shopping: "Set a shopping budget before you start. Use local markets instead of tourist shops.",
  };
  return texts[category] || "Look for ways to reduce spending in this category without sacrificing experience.";
}

/**
 * Get budget recommendations based on destination + duration
 */
export const getBudgetTemplate = (destination, durationDays, travelStyle) => {
  const PER_DAY = {
    backpacker: { food: 600, transport: 300, activities: 200 },
    midrange: { food: 1500, transport: 600, activities: 800 },
    luxury: { food: 4000, transport: 2000, activities: 3000 },
  };

  const style = PER_DAY[travelStyle] || PER_DAY.midrange;
  const FLIGHT_ESTIMATES = { japan: 60000, bali: 25000, europe: 80000, usa: 90000 };
  const flightCost = FLIGHT_ESTIMATES[destination?.toLowerCase()] || 50000;

  return {
    flights: flightCost,
    hotels: Math.round(3500 * durationDays),
    food: Math.round(style.food * durationDays),
    transport: Math.round(style.transport * durationDays),
    activities: Math.round(style.activities * durationDays),
    miscellaneous: Math.round(2000 * durationDays),
    total_recommended: flightCost + Math.round((3500 + style.food + style.transport + style.activities + 2000) * durationDays),
  };
};
