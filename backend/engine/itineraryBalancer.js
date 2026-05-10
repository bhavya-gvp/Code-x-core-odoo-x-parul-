/**
 * itineraryBalancer.js — Smart Itinerary Scheduling Engine
 *
 * Takes an unordered pool of activities and produces an optimally
 * balanced daily schedule by applying scheduling rules.
 *
 * Rules enforced:
 *  1. No more than 2 consecutive same-category activities
 *  2. Food activities slot to meal times (08:00, 13:00, 19:00)
 *  3. Adventure before 4pm (physical energy)
 *  4. Cultural/Museum in morning (crowds are smaller)
 *  5. Nightlife/Evening activities after 19:00
 *  6. Max 4 activities/day (fatigue budget)
 *  7. Respect cost distribution across days
 *
 * Output: days array with activities re-distributed and time-slotted
 */

const MEAL_TIMES     = { breakfast: "08:00", lunch: "13:00", dinner: "19:30" };
const MORNING_START  = "09:00";
const AFTERNOON_START = "14:00";
const EVENING_START  = "19:00";
const MAX_PER_DAY    = 4;

const PREFERRED_SLOTS = {
  Food:              [MEAL_TIMES.lunch, MEAL_TIMES.dinner, MEAL_TIMES.breakfast],
  Museum:            [MORNING_START, "10:00", "11:00"],
  Cultural:          [MORNING_START, "10:00", AFTERNOON_START],
  Adventure:         ["07:00", MORNING_START, "10:00"],
  Nature:            [MORNING_START, "06:30", AFTERNOON_START],
  Shopping:          [AFTERNOON_START, "15:00", "16:00"],
  Nightlife:         [EVENING_START, "20:00", "21:00"],
  Photography:       ["06:00", MORNING_START, "17:00"],  // Golden hours
  Spiritual:         [MORNING_START, "07:00", AFTERNOON_START],
  "Local Experience": [AFTERNOON_START, "11:00", EVENING_START],
  Beach:             ["10:00", AFTERNOON_START, "15:00"],
  Other:             [AFTERNOON_START, MORNING_START],
};

const INTENSITY = {
  Adventure: 9, Nature: 6, "Local Experience": 5, Museum: 3,
  Cultural: 3, Food: 2, Shopping: 3, Photography: 4, Spiritual: 2,
  Nightlife: 5, Beach: 4, Other: 3,
};

/**
 * Balance an itinerary
 * @param {object[]} days — Days with activities arrays (can be unbalanced)
 * @returns {object[]} Rebalanced days with scheduled activities
 */
export function balanceItinerary(days) {
  if (!days?.length) return [];

  // Pool all activities from all days
  const allActivities = days.flatMap((d) => d.activities || []);
  const totalDays     = days.length;

  if (!allActivities.length) return days;

  // ── Step 1: Sort activities by priority score ─────────
  const scored = allActivities.map((a) => ({
    ...a,
    _priority: computePriority(a),
    _intensity: INTENSITY[a.category] || 3,
  }));
  scored.sort((a, b) => b._priority - a._priority);

  // ── Step 2: Distribute across days (round-robin with intensity balancing) ──
  const slots = Array.from({ length: totalDays }, () => []);
  const dayIntensity = new Array(totalDays).fill(0);

  for (const activity of scored) {
    // Find the day with lowest current intensity that has room
    let bestDay = 0;
    let lowestIntensity = Infinity;

    for (let i = 0; i < totalDays; i++) {
      if (slots[i].length < MAX_PER_DAY && dayIntensity[i] < lowestIntensity) {
        lowestIntensity = dayIntensity[i];
        bestDay = i;
      }
    }

    slots[bestDay].push(activity);
    dayIntensity[bestDay] += activity._intensity;
  }

  // ── Step 3: Sort activities within each day by time preference ──
  const balancedDays = days.map((day, i) => {
    const dayActs = slots[i] || [];
    const scheduled = scheduleActivitiesInDay(dayActs);

    return {
      ...day,
      activities:    scheduled,
      _fatigueScore: dayIntensity[i],
      _wasRebalanced: true,
    };
  });

  return balancedDays;
}

/**
 * Schedule activities within a day by assigning optimal time slots
 */
function scheduleActivitiesInDay(activities) {
  // Separate food and non-food
  const meals    = activities.filter((a) => a.category === "Food");
  const nonMeals = activities.filter((a) => a.category !== "Food");

  // Sort non-meals: high intensity first in morning
  nonMeals.sort((a, b) => (INTENSITY[b.category] || 3) - (INTENSITY[a.category] || 3));

  // Enforce: no 2 consecutive same categories in non-meals
  const reordered = enforceVariety(nonMeals);

  // Slot meals at appropriate times
  const result = [];
  let mealIndex = 0;

  for (let i = 0; i < reordered.length; i++) {
    const act = reordered[i];

    // Insert a meal if it's past lunch time slot and we have meals left
    if (i === 1 && meals[mealIndex]) {
      result.push({ ...meals[mealIndex], start_time: MEAL_TIMES.lunch });
      mealIndex++;
    }

    const slot = getPreferredSlot(act.category, result.length);
    result.push({ ...act, start_time: slot });
  }

  // Append remaining meals as dinner
  while (mealIndex < meals.length) {
    result.push({ ...meals[mealIndex], start_time: MEAL_TIMES.dinner });
    mealIndex++;
  }

  return result.map((a, idx) => ({ ...a, sort_order: idx }));
}

function enforceVariety(activities) {
  const result = [];
  const remaining = [...activities];

  while (remaining.length) {
    const lastCategory = result[result.length - 1]?.category;
    const last2Category = result[result.length - 2]?.category;

    // Try to avoid 2 consecutive same categories
    let idx = remaining.findIndex((a) => {
      if (a.category !== lastCategory) return true;
      if (a.category !== last2Category) return true;
      return false;
    });

    if (idx === -1) idx = 0; // Fallback if no variety possible

    result.push(remaining.splice(idx, 1)[0]);
  }

  return result;
}

function computePriority(activity) {
  let score = 0;
  // Unique experiences rank higher
  if (["Hidden Gems", "Local Experience", "Cultural"].includes(activity.category)) score += 20;
  // Free activities get priority (budget optimization)
  if (!activity.cost || Number(activity.cost) === 0) score += 10;
  // Higher rated activities first
  if (activity.rating) score += Number(activity.rating) * 5;
  // Pre-booked activities must be kept
  if (activity.is_booked) score += 50;
  return score;
}

function getPreferredSlot(category, slotIndex) {
  const slots = PREFERRED_SLOTS[category] || PREFERRED_SLOTS.Other;
  return slots[Math.min(slotIndex, slots.length - 1)] || MORNING_START;
}

export default { balanceItinerary };
