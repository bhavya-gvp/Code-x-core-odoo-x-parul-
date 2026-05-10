/**
 * travelFatigueScorer.js — Daily Fatigue Scoring Engine
 *
 * Scores each itinerary day from 0–100 for traveler fatigue.
 * 100 = exhausting day, 0 = perfectly restful.
 *
 * Factors scored:
 *  1. Activity count vs ideal (4 per day)
 *  2. Total walking/active duration
 *  3. Time gaps between activities (rest recovery)
 *  4. Activity intensity (Adventure > Museum > Food)
 *  5. Early starts / late finishes
 *  6. Back-to-back high-intensity activities
 *  7. Transport legs within the day
 *
 * Output per day:
 *  - fatigueScore (0–100)
 *  - fatigueLevel (Low / Moderate / High / Extreme)
 *  - recommendations: string[]
 *  - problematicActivities: { name, reason }[]
 *
 * No external API. Pure logic on the activities array.
 */

import { FATIGUE } from "../config/constants.js";

// Intensity weights per activity category (0 = rest, 10 = max exertion)
const INTENSITY = {
  Adventure:          9,
  "Local Experience": 5,
  Nature:             6,
  Museum:             3,
  Cultural:           3,
  Food:               2,
  Shopping:           3,
  Photography:        4,
  Spiritual:          2,
  Nightlife:          5,
  Beach:              4,
  Transport:          4,
  Hotel:              0,
  Other:              3,
};

/**
 * Score a single day's fatigue
 * @param {object} day — { dayNumber, date, cityName, activities: [] }
 * @returns {object} Fatigue report for this day
 */
export function scoreDay(day) {
  const activities = day.activities || [];
  if (!activities.length) {
    return { dayNumber: day.dayNumber, fatigueScore: 0, fatigueLevel: "Low", recommendations: ["Rest day — no activities planned."], problematicActivities: [] };
  }

  const recommendations   = [];
  const problematicItems  = [];
  let score = 0;

  // ── Factor 1: Activity count ───────────────────────────
  const count = activities.length;
  if (count > FATIGUE.ACTIVITIES_PER_DAY_HIGH) {
    score += 25;
    recommendations.push(`${count} activities is too many. Remove 2+ to avoid burnout.`);
  } else if (count > FATIGUE.ACTIVITIES_PER_DAY_IDEAL) {
    score += 12;
    recommendations.push(`Consider dropping 1 activity for a more relaxed day.`);
  }

  // ── Factor 2: Total duration ───────────────────────────
  const totalMinutes = activities.reduce((s, a) => s + (Number(a.duration_minutes || a.durationMinutes) || 60), 0);
  const totalHours   = totalMinutes / 60;

  if (totalHours > 10) { score += 20; recommendations.push(`Day spans ${totalHours.toFixed(1)}h of activity — very tiring.`); }
  else if (totalHours > 7) { score += 10; }

  // ── Factor 3: Average intensity ────────────────────────
  const intensityScores = activities.map((a) => INTENSITY[a.category] || 3);
  const avgIntensity    = intensityScores.reduce((s, i) => s + i, 0) / intensityScores.length;

  if (avgIntensity > 6) {
    score += 20;
    recommendations.push("Day is intensity-heavy. Balance with a relaxing meal or cultural stop.");
  } else if (avgIntensity > 4) {
    score += 8;
  }

  // ── Factor 4: Time gaps (rest between activities) ──────
  const sortedActs = [...activities].sort((a, b) => {
    const tA = timeToMinutes(a.start_time || a.startTime);
    const tB = timeToMinutes(b.start_time || b.startTime);
    return tA - tB;
  });

  let noRestGapCount = 0;
  for (let i = 0; i < sortedActs.length - 1; i++) {
    const endCurrent  = timeToMinutes(sortedActs[i].start_time || sortedActs[i].startTime)
                      + (Number(sortedActs[i].duration_minutes || 60));
    const startNext   = timeToMinutes(sortedActs[i + 1].start_time || sortedActs[i + 1].startTime);
    const gap         = startNext - endCurrent;

    if (gap < FATIGUE.REST_GAP_MINUTES && gap >= 0) {
      noRestGapCount++;
      problematicItems.push({ name: sortedActs[i + 1].activity_name || sortedActs[i + 1].activityName, reason: "No rest gap before this activity" });
    }
  }
  if (noRestGapCount > 2) { score += 15; recommendations.push("Add 30-min buffer gaps between back-to-back activities."); }
  else if (noRestGapCount > 0) { score += 5; }

  // ── Factor 5: Early starts ─────────────────────────────
  const startMinutes = timeToMinutes(sortedActs[0]?.start_time || sortedActs[0]?.startTime);
  if (startMinutes !== null && startMinutes < 360) { // Before 6am
    score += 10;
    recommendations.push("Very early start (before 6am) contributes to fatigue.");
  }

  // ── Factor 6: Late finishes ────────────────────────────
  const lastAct     = sortedActs[sortedActs.length - 1];
  const lastStart   = timeToMinutes(lastAct?.start_time || lastAct?.startTime);
  const lastEnd     = lastStart !== null ? lastStart + (Number(lastAct?.duration_minutes || 60)) : null;
  if (lastEnd !== null && lastEnd > 1320) { // After 10pm
    score += 8;
    recommendations.push("Day ends after 10pm — allow sufficient rest for next day.");
  }

  // ── Factor 7: Back-to-back high intensity ──────────────
  let consecutiveHigh = 0;
  for (const act of sortedActs) {
    const intensity = INTENSITY[act.category] || 3;
    if (intensity >= 7) {
      consecutiveHigh++;
      if (consecutiveHigh >= 2) {
        problematicItems.push({ name: act.activity_name || act.activityName, reason: "Back-to-back high-intensity activity" });
        score += 8;
      }
    } else {
      consecutiveHigh = 0;
    }
  }

  // ── Cap and label ──────────────────────────────────────
  const fatigueScore = Math.min(100, Math.max(0, score));
  const fatigueLevel = score >= FATIGUE.SCORE_HIGH   ? "Extreme"
                     : score >= FATIGUE.SCORE_MEDIUM  ? "High"
                     : score >= FATIGUE.SCORE_LOW     ? "Moderate"
                     : "Low";

  if (fatigueScore <= FATIGUE.SCORE_LOW && !recommendations.length) {
    recommendations.push("Well-paced day. Good balance of activity and rest.");
  }

  return {
    dayNumber:            day.dayNumber,
    date:                 day.date,
    cityName:             day.cityName || day.city_name,
    fatigueScore,
    fatigueLevel,
    totalHours:           Math.round(totalHours * 10) / 10,
    activityCount:        count,
    avgIntensity:         Math.round(avgIntensity * 10) / 10,
    recommendations:      [...new Set(recommendations)],
    problematicActivities: problematicItems,
  };
}

/**
 * Score an entire itinerary
 * @param {object[]} days
 * @returns {object} Full fatigue report
 */
export function scoreItinerary(days) {
  if (!days?.length) return { days: [], overallScore: 0, recommendation: "No itinerary to analyze." };

  const dayReports = days.map(scoreDay);
  const overallScore = Math.round(
    dayReports.reduce((s, d) => s + d.fatigueScore, 0) / dayReports.length
  );

  const highFatigueDays = dayReports.filter((d) => d.fatigueScore >= FATIGUE.SCORE_MEDIUM);

  return {
    days: dayReports,
    overallScore,
    overallLevel:    getHealthLabel(overallScore),
    highFatigueDays: highFatigueDays.map((d) => d.dayNumber),
    recommendation:  overallScore >= FATIGUE.SCORE_HIGH
      ? "Your itinerary is very intense. Add at least 2 lighter days."
      : overallScore >= FATIGUE.SCORE_MEDIUM
      ? "Some days are heavy. Review high-fatigue days for adjustments."
      : "Your itinerary has a healthy pace. Enjoy the trip!",
    generatedAt: new Date().toISOString(),
  };
}

// ── Helpers ────────────────────────────────────────────────
function timeToMinutes(timeStr) {
  if (!timeStr) return null;
  const [h, m] = String(timeStr).split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function getHealthLabel(score) {
  if (score >= FATIGUE.SCORE_HIGH)   return "Extreme";
  if (score >= FATIGUE.SCORE_MEDIUM) return "High";
  if (score >= FATIGUE.SCORE_LOW)    return "Moderate";
  return "Low";
}

export default { scoreDay, scoreItinerary };
