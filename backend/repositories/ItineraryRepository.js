/**
 * ItineraryRepository — All SQL for itinerary days and activities
 */

import { BaseRepository } from "./BaseRepository.js";

class ItineraryRepository extends BaseRepository {
  constructor() { super("itinerary_days"); }

  async getDaysWithActivities(tripId) {
    const days = await this.query(
      `SELECT d.*, tc.city_name AS city_display, tc.latitude, tc.longitude
       FROM itinerary_days d
       LEFT JOIN trip_cities tc ON d.city_id = tc.id
       WHERE d.trip_id = ? ORDER BY d.day_number ASC`,
      [tripId]
    );

    if (!days.length) return [];

    // Batch fetch all activities for all days in ONE query — avoids N+1
    const dayIds = days.map((d) => d.id);
    const placeholders = dayIds.map(() => "?").join(", ");
    const activities = await this.query(
      `SELECT * FROM activities
       WHERE itinerary_day_id IN (${placeholders}) AND deleted_at IS NULL
       ORDER BY itinerary_day_id, sort_order, start_time`,
      dayIds
    );

    // Map activities to their respective days
    const activityMap = activities.reduce((acc, a) => {
      if (!acc[a.itinerary_day_id]) acc[a.itinerary_day_id] = [];
      acc[a.itinerary_day_id].push(a);
      return acc;
    }, {});

    return days.map((d) => ({ ...d, activities: activityMap[d.id] || [] }));
  }

  async createDay({ tripId, cityId, dayNumber, date, cityName, notes, dailyBudget }) {
    await this.query(
      `INSERT INTO itinerary_days (trip_id, city_id, day_number, date, city_name, notes, daily_budget)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tripId, cityId || null, dayNumber, date, cityName || null, notes || null, dailyBudget || 0]
    );
    const rows = await this.query(
      "SELECT * FROM itinerary_days WHERE trip_id = ? AND day_number = ? LIMIT 1",
      [tripId, dayNumber]
    );
    return rows[0];
  }

  async bulkCreateDays(days) {
    if (!days.length) return;
    const columns = ["trip_id", "city_id", "day_number", "date", "city_name", "daily_budget"];
    const rows = days.map((d) => [
      d.tripId, d.cityId || null, d.dayNumber, d.date,
      d.cityName || null, d.dailyBudget || 0,
    ]);
    await this.bulkInsert(columns, rows);
  }

  async createActivity({ itineraryDayId, activityName, category, description, location, cost, durationMinutes, startTime, endTime, rating, emoji, notes, sortOrder }) {
    await this.query(
      `INSERT INTO activities
         (itinerary_day_id, activity_name, category, description, location, cost, duration_minutes, start_time, end_time, rating, emoji, notes, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [itineraryDayId, activityName, category || "Other", description || null, location || null,
       cost || 0, durationMinutes || null, startTime || null, endTime || null,
       rating || null, emoji || "📍", notes || null, sortOrder || 0]
    );
    const rows = await this.query(
      "SELECT * FROM activities WHERE itinerary_day_id = ? AND activity_name = ? ORDER BY created_at DESC LIMIT 1",
      [itineraryDayId, activityName]
    );
    return rows[0];
  }

  async bulkCreateActivities(activities) {
    if (!activities.length) return;
    const columns = ["itinerary_day_id", "activity_name", "category", "cost", "duration_minutes", "start_time", "emoji", "sort_order"];
    const rows = activities.map((a, i) => [
      a.itineraryDayId, a.activityName, a.category || "Other",
      a.cost || 0, a.durationMinutes || 60,
      a.startTime || null, a.emoji || "📍", a.sortOrder ?? i,
    ]);
    await this.bulkInsert(columns, rows);
  }

  async updateActivity(activityId, dayId, data) {
    const allowed = ["activity_name", "category", "description", "location", "cost",
                     "duration_minutes", "start_time", "end_time", "rating", "emoji",
                     "notes", "sort_order", "is_booked", "booking_ref"];
    const { clause, values } = this.buildUpdateClause(data, allowed);
    if (!clause) return null;
    await this.query(
      `UPDATE activities SET ${clause} WHERE id = ? AND itinerary_day_id = ? AND deleted_at IS NULL`,
      [...values, activityId, dayId]
    );
    const rows = await this.query("SELECT * FROM activities WHERE id = ? LIMIT 1", [activityId]);
    return rows[0];
  }

  async deleteActivity(activityId) {
    return this.query(
      "UPDATE activities SET deleted_at = NOW() WHERE id = ?",
      [activityId]
    );
  }

  async reorderActivities(dayId, orderedIds) {
    const updates = orderedIds.map((id, index) =>
      this.query("UPDATE activities SET sort_order = ? WHERE id = ? AND itinerary_day_id = ?", [index, id, dayId])
    );
    await Promise.all(updates);
  }
}

export const itineraryRepository = new ItineraryRepository();
export default itineraryRepository;
