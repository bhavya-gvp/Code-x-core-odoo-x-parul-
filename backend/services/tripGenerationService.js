/**
 * tripGenerationService.js
 *
 * The core AI Trip Generation Engine.
 * 8-step orchestration: analyze → plan → generate → allocate → fatigue → insights → save → return
 *
 * Zero external AI API dependency — all logic is algorithmic.
 */

import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import pool from "../config/db.js";
import { optimizeBudget } from "../engine/budgetOptimizer.js";
import { scoreItinerary as scoreFatigue } from "../engine/travelFatigueScorer.js";
import logger from "../utils/logger.js";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load internal datasets
const DESTINATIONS = require("../data/destinations.json");

// ── Mood → activity bias weights ──────────────────────────
const MOOD_WEIGHTS = {
  "Relax":            { relax: 0.5, culture: 0.2, nature: 0.2, social: 0.1 },
  "Burnout Recovery": { relax: 0.6, nature: 0.3, spiritual: 0.1 },
  "Romantic Escape":  { romantic: 0.5, relax: 0.2, culture: 0.2, foodie: 0.1 },
  "Social Trip":      { social: 0.4, foodie: 0.3, adventure: 0.2, culture: 0.1 },
  "Adventure Rush":   { adventure: 0.5, nature: 0.3, social: 0.1, culture: 0.1 },
  "Nature Detox":     { nature: 0.5, relax: 0.3, spiritual: 0.1, adventure: 0.1 },
};

// ── Budget tier thresholds (INR per person per day) ────────
const BUDGET_TIER = (dailyBudgetPerPerson) => {
  if (dailyBudgetPerPerson < 2000) return "budget";
  if (dailyBudgetPerPerson < 6000) return "mid";
  return "luxury";
};

// ── Travel style → night activity bias ─────────────────────
const STYLE_NIGHT_BIAS = {
  "Solo Adventure": true, "Friend Group": true, "Backpacking": true,
  "Couple Trip": false, "Family Trip": false, "Work/Collab": false,
};

export class TripGenerationService {

  // ═══════════════════════════════════════════════════
  // MAIN ENTRY POINT
  // ═══════════════════════════════════════════════════
  async generateTrip(userId, params) {
    const {
      title, description, destinations: destNames, start_date, end_date,
      budget, mood, travel_type, travelers = 1, visibility = "private",
    } = params;

    logger.info("Trip generation started", { userId, mood, destinations: destNames, budget });

    // STEP 1: Analyze duration
    const duration = this._analyzeDuration(start_date, end_date);

    // STEP 2: Resolve + score destinations
    const resolvedDests = this._resolveDestinations(destNames, mood, budget, duration.days, travelers);

    // STEP 3: Distribute days
    const cityPlan = this._distributeDays(resolvedDests, duration.days, mood);

    // STEP 4: Generate daily schedule
    const itinerary = this._generateItinerary(cityPlan, start_date, mood, travel_type, budget, travelers);

    // STEP 5: Allocate budget
    const budgetPlan = this._allocateBudget(budget, duration.days, travelers, mood, resolvedDests);

    // STEP 6: Calculate fatigue
    const fatigueReport = this._calculateFatigue(itinerary, cityPlan);

    // STEP 7: Generate insights
    const insights = this._generateInsights(cityPlan, budgetPlan, fatigueReport, mood, duration);

    // STEP 8: Save to MySQL
    const tripId = await this._saveToDatabase(userId, {
      title: title || this._autoTitle(resolvedDests, mood),
      description, visibility, start_date, end_date,
      budget, mood, travel_type, travelers,
      cityPlan, itinerary, budgetPlan, insights,
    });

    logger.info("Trip generation complete", { tripId, days: duration.days, cities: cityPlan.length });

    return {
      tripId,
      tripSummary: {
        title: title || this._autoTitle(resolvedDests, mood),
        startDate: start_date,
        endDate: end_date,
        totalDays: duration.days,
        totalNights: duration.days - 1,
        cities: cityPlan.length,
        travelers,
        mood,
        travelStyle: travel_type,
      },
      destinations: cityPlan,
      itinerary,
      budgetPlan,
      fatigueScore: fatigueReport.overallScore,
      fatigueLabel: fatigueReport.label,
      insights,
      generatedAt: new Date().toISOString(),
    };
  }

  // ═══════════════════════════════════════════════════
  // STEP 1: Duration Analysis
  // ═══════════════════════════════════════════════════
  _analyzeDuration(startDate, endDate) {
    const start = new Date(startDate);
    const end   = new Date(endDate);
    const days  = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    const nights = Math.max(0, days - 1);
    return { days, nights, startDate: start, endDate: end };
  }

  // ═══════════════════════════════════════════════════
  // STEP 2: Resolve Destinations from dataset
  // ═══════════════════════════════════════════════════
  _resolveDestinations(destNames, mood, budget, totalDays, travelers) {
    if (!destNames || destNames.length === 0) {
      // Auto-suggest based on mood + budget
      return this._autoSuggestDestinations(mood, budget, totalDays, travelers);
    }

    return destNames.map((name) => {
      const key = name.toUpperCase().replace(/\s+/g, "_");
      const data = DESTINATIONS[key] || this._fuzzyMatch(name);
      if (data) return { ...data, inputName: name };
      // Unknown destination — create generic entry
      return this._genericDestination(name);
    }).filter(Boolean);
  }

  _fuzzyMatch(name) {
    const lower = name.toLowerCase();
    for (const [key, val] of Object.entries(DESTINATIONS)) {
      if (val.name.toLowerCase().includes(lower) || lower.includes(val.name.toLowerCase())) {
        return val;
      }
    }
    return null;
  }

  _autoSuggestDestinations(mood, budget, days, travelers) {
    const dailyPerPerson = (budget / days) / travelers;
    const tier = BUDGET_TIER(dailyPerPerson);
    const moodKey = (mood || "Relax").toLowerCase().replace(/\s+/g, "");

    return Object.values(DESTINATIONS)
      .filter((d) => {
        const costFit = d.dailyCosts[tier] !== undefined;
        const moodFit = d.moods.some((m) => moodKey.includes(m) || m.includes(moodKey));
        return costFit && moodFit;
      })
      .slice(0, Math.min(3, Math.ceil(days / 2)));
  }

  _genericDestination(name) {
    return {
      id: name.toLowerCase().replace(/\s+/g, "_"),
      name,
      country: "Unknown",
      region: "unknown",
      dailyCosts: {
        budget: { hotel: 1500, food: 600, transport: 400, activities: 400 },
        mid:    { hotel: 4000, food: 1200, transport: 800, activities: 800 },
        luxury: { hotel: 10000, food: 3000, transport: 2000, activities: 2000 },
      },
      moods: [],
      schedule: {
        morning:   ["Explore the local area", "Visit popular landmarks", "Morning market walk"],
        afternoon: ["Sightseeing tour", "Local museum or gallery", "Café lunch break"],
        evening:   ["Sunset viewpoint", "Local dinner experience", "Evening stroll"],
        night:     ["Local nightlife", "Night market", "Quiet evening in"],
      },
      moodActivities: {},
      nearbyDays: 2, minDays: 1, maxDays: 4,
    };
  }

  // ═══════════════════════════════════════════════════
  // STEP 3: Distribute Days Across Cities
  // ═══════════════════════════════════════════════════
  _distributeDays(destinations, totalDays, mood) {
    if (destinations.length === 0) return [];
    if (destinations.length === 1) {
      return [{ ...destinations[0], assignedDays: totalDays }];
    }

    // Weight by nearbyDays (recommended stay)
    const totalWeight = destinations.reduce((s, d) => s + (d.nearbyDays || 2), 0);
    let remainingDays = totalDays;
    const planned = [];

    destinations.forEach((dest, i) => {
      const isLast = i === destinations.length - 1;
      const weight = (dest.nearbyDays || 2) / totalWeight;
      let days = isLast ? remainingDays : Math.max(1, Math.round(totalDays * weight));
      // Clamp to min/max
      days = Math.max(dest.minDays || 1, Math.min(dest.maxDays || 5, days));
      days = Math.min(days, remainingDays);
      remainingDays -= days;
      if (days > 0) planned.push({ ...dest, assignedDays: days });
    });

    // Redistribute if days remain
    if (remainingDays > 0 && planned.length > 0) {
      planned[0].assignedDays += remainingDays;
    }

    return planned;
  }

  // ═══════════════════════════════════════════════════
  // STEP 4: Generate Daily Itinerary
  // ═══════════════════════════════════════════════════
  _generateItinerary(cityPlan, startDate, mood, travelStyle, budget, travelers) {
    const moodKey    = (mood || "Relax").toLowerCase().replace(/\s+/g, "");
    const includeNight = STYLE_NIGHT_BIAS[travelStyle] ?? false;
    const itinerary  = [];
    let currentDate  = new Date(startDate);
    let globalDayNum = 1;

    for (const city of cityPlan) {
      const moodActivities = city.moodActivities?.[moodKey]
        || city.moodActivities?.["relax"]
        || [];

      for (let d = 0; d < city.assignedDays; d++) {
        const isArrival   = d === 0 && globalDayNum === 1;
        const isDeparture = globalDayNum === cityPlan.reduce((s, c) => s + c.assignedDays, 0);
        const isCityChange = d === 0 && globalDayNum > 1;

        const morning   = this._pickActivity(city.schedule.morning, moodActivities, d, "morning");
        const afternoon = this._pickActivity(city.schedule.afternoon, moodActivities, d, "afternoon");
        const evening   = this._pickActivity(city.schedule.evening, moodActivities, d, "evening");
        const night     = includeNight ? this._pickActivity(city.schedule.night, moodActivities, d, "night") : null;

        itinerary.push({
          dayNumber:   globalDayNum,
          date:        new Date(currentDate).toISOString().split("T")[0],
          city:        city.name,
          country:     city.country,
          isArrival,
          isDeparture,
          isCityChange,
          theme:       this._dayTheme(globalDayNum, mood, d, city.assignedDays),
          activities: [
            { time: "Morning",   label: morning,   type: "morning",   duration: 120, estimatedCost: this._activityCost("morning", budget, travelers) },
            { time: "Afternoon", label: afternoon,  type: "afternoon", duration: 150, estimatedCost: this._activityCost("afternoon", budget, travelers) },
            { time: "Evening",   label: evening,    type: "evening",   duration: 120, estimatedCost: this._activityCost("evening", budget, travelers) },
            ...(night ? [{ time: "Night", label: night, type: "night", duration: 90, estimatedCost: this._activityCost("night", budget, travelers) }] : []),
          ],
          restTime: includeNight ? 420 : 480, // minutes of rest
          fatigueContribution: includeNight ? 18 : 12,
          travelNote: isCityChange ? `Travel day: arriving in ${city.name}` : null,
        });

        currentDate.setDate(currentDate.getDate() + 1);
        globalDayNum++;
      }
    }

    return itinerary;
  }

  _pickActivity(slotPool, moodPool, dayIndex, slot) {
    // Use time-specific schedule as primary, mood activities as supplemental variety
    const slotActivities  = slotPool  || [];
    const moodActivities  = moodPool  || [];

    // Pick from slot-specific pool first, supplement with mood activities
    const primary   = slotActivities.length > 0 ? slotActivities : moodActivities;
    const secondary = moodActivities.length > 0 ? moodActivities : slotActivities;

    // Combine uniquely, prioritise primary
    const combined = [...primary];
    for (const a of secondary) {
      if (!combined.includes(a)) combined.push(a);
    }

    return combined[dayIndex % combined.length] || slotActivities[0] || "Free exploration";
  }

  _activityCost(slot, totalBudget, travelers) {
    const perPersonDaily = totalBudget / (travelers || 1);
    const ratios = { morning: 0.1, afternoon: 0.15, evening: 0.12, night: 0.08 };
    return Math.round(perPersonDaily * (ratios[slot] || 0.1));
  }

  _dayTheme(dayNum, mood, cityDay, cityTotalDays) {
    if (cityDay === 0 && dayNum > 1) return "Arrival & Settling In";
    if (cityDay === cityTotalDays - 1) return "Exploration & Departure Prep";
    const themes = {
      "Relax":            ["Slow Morning Bliss", "Cultural Afternoon", "Peaceful Evening"],
      "Adventure Rush":   ["Adrenaline Morning", "High Energy Afternoon", "Victory Dinner"],
      "Nature Detox":     ["Forest Dawn", "Nature Immersion", "Scenic Sunset"],
      "Romantic Escape":  ["Couple's Morning", "Together Moments", "Romance Evening"],
      "Social Trip":      ["Group Energy", "Explore Together", "Social Night"],
      "Burnout Recovery": ["Rest & Restore", "Gentle Discovery", "Slow Sunset"],
      "Foodie":           ["Market Morning", "Lunch Tour", "Dinner Experience"],
    };
    const list = themes[mood] || ["Discover", "Explore", "Unwind"];
    return list[(dayNum - 1) % list.length];
  }

  // ═══════════════════════════════════════════════════
  // STEP 5: Budget Allocation
  // ═══════════════════════════════════════════════════
  _allocateBudget(totalBudget, days, travelers, mood, destinations) {
    const isLuxury = mood === "Romantic Escape";
    const isAdventure = mood === "Adventure Rush";

    const ratios = isLuxury
      ? { hotels: 0.42, food: 0.18, transport: 0.18, activities: 0.17, emergency: 0.05 }
      : isAdventure
      ? { hotels: 0.30, food: 0.18, transport: 0.20, activities: 0.27, emergency: 0.05 }
      : { hotels: 0.38, food: 0.22, transport: 0.20, activities: 0.15, emergency: 0.05 };

    const allocated = {};
    for (const [cat, ratio] of Object.entries(ratios)) {
      allocated[cat] = Math.round(totalBudget * ratio);
    }

    // Per city breakdown
    const cityBreakdown = destinations.map((city) => {
      const cityRatio = city.assignedDays / days;
      return {
        city:       city.name,
        days:       city.assignedDays,
        hotelBudget:     Math.round(allocated.hotels * cityRatio),
        foodBudget:      Math.round(allocated.food * cityRatio),
        transportBudget: Math.round(allocated.transport * cityRatio),
        activitiesBudget: Math.round(allocated.activities * cityRatio),
      };
    });

    return {
      total: totalBudget,
      perPerson: Math.round(totalBudget / travelers),
      perDay: Math.round(totalBudget / days),
      breakdown: allocated,
      cityBreakdown,
      percentages: ratios,
    };
  }

  // ═══════════════════════════════════════════════════
  // STEP 6: Fatigue Score
  // ═══════════════════════════════════════════════════
  _calculateFatigue(itinerary, cityPlan) {
    let score = 0;

    // City switches add fatigue
    score += Math.max(0, cityPlan.length - 1) * 8;

    // Activities per day
    itinerary.forEach((day) => {
      const actCount = day.activities.length;
      if (actCount >= 4) score += 10;
      else if (actCount === 3) score += 6;
      else score += 2;
    });

    // Long trip increases fatigue
    if (itinerary.length > 7)  score += 10;
    if (itinerary.length > 14) score += 15;

    score = Math.min(100, score);

    let label = "Comfortable";
    if (score >= 70) label = "Extreme — Consider reducing activities";
    else if (score >= 50) label = "High — Add rest days";
    else if (score >= 30) label = "Moderate — Balanced";
    else label = "Low — Very relaxed pace";

    return { overallScore: score, label };
  }

  // ═══════════════════════════════════════════════════
  // STEP 7: Generate Smart Insights
  // ═══════════════════════════════════════════════════
  _generateInsights(cityPlan, budgetPlan, fatigue, mood, duration) {
    const insights = [];

    // Destination insight
    if (cityPlan.length === 1) {
      insights.push({ type: "destination", icon: "📍", text: `${cityPlan[0].name} gives you ${cityPlan[0].assignedDays} focused days — ideal for going deep rather than rushing.` });
    } else {
      insights.push({ type: "destination", icon: "🗺️", text: `Your ${cityPlan.length}-city route covers ${cityPlan.map(c => c.name).join(" → ")}. Expect ${cityPlan.length - 1} transit${cityPlan.length > 2 ? "s" : ""}.` });
    }

    // Budget insight
    const perDay = budgetPlan.perDay;
    if (perDay > 5000) {
      insights.push({ type: "budget", icon: "💎", text: `₹${perDay.toLocaleString("en-IN")}/day gives you premium travel comfort. Your budget supports luxury stays and fine dining.` });
    } else if (perDay > 2000) {
      insights.push({ type: "budget", icon: "💰", text: `₹${perDay.toLocaleString("en-IN")}/day is well-balanced. You can enjoy mid-range hotels with occasional splurges.` });
    } else {
      insights.push({ type: "budget", icon: "💸", text: `₹${perDay.toLocaleString("en-IN")}/day requires smart budgeting. Prioritize hostels and local food for the best experience.` });
    }

    // Mood insight
    const moodInsights = {
      "Nature Detox":     "Your Nature Detox mood is matched with outdoor mornings, scenic evenings, and zero nightlife.",
      "Adventure Rush":   "Adventure Rush mode: your days are packed with high-energy activities and adrenaline moments.",
      "Romantic Escape":  "Every evening is curated for couples — sunset dinners, private moments, and slow mornings.",
      "Burnout Recovery": "Low-intensity scheduling with built-in rest windows to help you genuinely recover.",
      "Social Trip":      "Group-friendly schedule with social hubs, group dinners, and high-energy evenings.",
      "Relax":            "Slow travel pacing — no rush, no overload. Just quality experiences at your own pace.",
    };
    insights.push({ type: "mood", icon: "🧘", text: moodInsights[mood] || "Your travel mood has shaped every activity recommendation in this plan." });

    // Fatigue insight
    if (fatigue.overallScore < 30) {
      insights.push({ type: "fatigue", icon: "✅", text: `Fatigue score: ${fatigue.overallScore}/100. Your schedule is very relaxed — you'll return refreshed.` });
    } else if (fatigue.overallScore < 60) {
      insights.push({ type: "fatigue", icon: "⚡", text: `Fatigue score: ${fatigue.overallScore}/100. ${fatigue.label}.` });
    } else {
      insights.push({ type: "fatigue", icon: "⚠️", text: `Fatigue score: ${fatigue.overallScore}/100. Consider replacing 1 afternoon activity per day with rest.` });
    }

    // Duration insight
    if (duration.days <= 3) {
      insights.push({ type: "duration", icon: "⏱️", text: "Short trip alert: focus on one key area per destination rather than trying to see everything." });
    } else if (duration.days >= 10) {
      insights.push({ type: "duration", icon: "🌍", text: `${duration.days} days gives you genuine immersion. Take at least one full rest day mid-trip.` });
    }

    return insights;
  }

  // ═══════════════════════════════════════════════════
  // STEP 8: Save to MySQL
  // ═══════════════════════════════════════════════════
  async _saveToDatabase(userId, payload) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const tripId = uuidv4();

      // 1. Insert trip
      await conn.execute(
        `INSERT INTO trips (id, user_id, title, description, start_date, end_date, budget,
          mood, travel_type, visibility, status, ai_generated, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'planning', 1, NOW(), NOW())`,
        [tripId, userId, payload.title, payload.description || null,
         payload.start_date, payload.end_date, payload.budget,
         payload.mood, payload.travel_type, payload.visibility]
      );

      // 2. Insert trip cities
      for (let i = 0; i < payload.cityPlan.length; i++) {
        const city = payload.cityPlan[i];
        await conn.execute(
          `INSERT INTO trip_cities (id, trip_id, city_name, country, latitude, longitude, order_index, nights, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [uuidv4(), tripId, city.name, city.country || "",
           city.coordinates?.lat || null, city.coordinates?.lng || null,
           i, city.assignedDays - 1]
        );
      }

      // 3. Insert itinerary days + activities
      for (const day of payload.itinerary) {
        const dayId = uuidv4();
        await conn.execute(
          `INSERT INTO itinerary_days (id, trip_id, day_number, date, city_name, theme, travel_note, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [dayId, tripId, day.dayNumber, day.date, day.city, day.theme, day.travelNote || null]
        );

        // Activities for this day
        for (let a = 0; a < day.activities.length; a++) {
          const act = day.activities[a];
          await conn.execute(
            `INSERT INTO activities (id, itinerary_day_id, activity_name, time_slot, duration_minutes,
              estimated_cost, sort_order, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [uuidv4(), dayId, act.label, act.time, act.duration, act.estimatedCost, a]
          );
        }
      }

      // 4. Insert budget breakdown as expenses (planned)
      const expenseMap = [
        ["Hotels",    payload.budgetPlan.breakdown.hotels],
        ["Transport", payload.budgetPlan.breakdown.transport],
        ["Food",      payload.budgetPlan.breakdown.food],
        ["Activities",payload.budgetPlan.breakdown.activities],
      ];
      for (const [cat, amount] of expenseMap) {
        await conn.execute(
          `INSERT INTO expenses (id, trip_id, user_id, category, amount, description,
            expense_date, currency, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'INR', NOW())`,
          [uuidv4(), tripId, userId, cat, amount,
           `AI-planned ${cat} budget`, payload.start_date]
        );
      }

      // 5. Insert insights into activity_logs (reusing as trip insights store)
      for (const insight of payload.insights) {
        await conn.execute(
          `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, metadata, created_at)
           VALUES (?, 'trip.ai_insight', 'trip', ?, ?, NOW())`,
          [userId, tripId, JSON.stringify({ icon: insight.icon, type: insight.type, text: insight.text })]
        );
      }

      await conn.commit();
      return tripId;

    } catch (err) {
      await conn.rollback();
      logger.error("Trip generation DB save failed", { error: err.message });
      throw err;
    } finally {
      conn.release();
    }
  }

  // ── Auto-generate title ────────────────────────────
  _autoTitle(destinations, mood) {
    const cityNames = destinations.map((d) => d.name).join(" & ");
    const moodPrefix = {
      "Relax": "Peaceful",
      "Adventure Rush": "Epic Adventure",
      "Nature Detox": "Nature Escape",
      "Romantic Escape": "Romantic Getaway",
      "Social Trip": "Group Getaway",
      "Burnout Recovery": "Rejuvenating",
    };
    const prefix = moodPrefix[mood] || "Amazing";
    return `${prefix} Trip to ${cityNames}`;
  }
}

export const tripGenerationService = new TripGenerationService();
export default tripGenerationService;
