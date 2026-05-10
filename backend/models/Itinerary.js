import pool from "../config/db.js";

// ============================================================
// ItineraryDay Model
// ============================================================
export const ItineraryDay = {
  async create({ tripId, cityId, dayNumber, date, cityName, notes, dailyBudget }) {
    const [result] = await pool.execute(
      `INSERT INTO itinerary_days (trip_id, city_id, day_number, date, city_name, notes, daily_budget)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tripId, cityId || null, dayNumber, date, cityName || null, notes || null, dailyBudget || 0]
    );
    const [rows] = await pool.execute("SELECT * FROM itinerary_days WHERE id = LAST_INSERT_ID()");
    return rows[0];
  },

  async getByTrip(tripId) {
    const [days] = await pool.execute(
      "SELECT * FROM itinerary_days WHERE trip_id = ? ORDER BY day_number",
      [tripId]
    );
    // Attach activities to each day
    for (const day of days) {
      const [activities] = await pool.execute(
        "SELECT * FROM activities WHERE itinerary_day_id = ? ORDER BY sort_order, start_time",
        [day.id]
      );
      day.activities = activities;
    }
    return days;
  },

  async update(id, data) {
    const allowed = ["city_name", "notes", "daily_budget", "date"];
    const updates = [];
    const values = [];
    for (const key of allowed) {
      if (data[key] !== undefined) { updates.push(`${key} = ?`); values.push(data[key]); }
    }
    if (!updates.length) return null;
    values.push(id);
    await pool.execute(`UPDATE itinerary_days SET ${updates.join(", ")} WHERE id = ?`, values);
    const [rows] = await pool.execute("SELECT * FROM itinerary_days WHERE id = ?", [id]);
    return rows[0];
  },

  async delete(id) {
    const [result] = await pool.execute("DELETE FROM itinerary_days WHERE id = ?", [id]);
    return result.affectedRows > 0;
  },
};

// ============================================================
// Activity Model
// ============================================================
export const Activity = {
  async create({ itineraryDayId, activityName, category, description, location,
                 cost, durationMinutes, startTime, endTime, emoji, notes, sortOrder }) {
    await pool.execute(
      `INSERT INTO activities
         (itinerary_day_id, activity_name, category, description, location,
          cost, duration_minutes, start_time, end_time, emoji, notes, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [itineraryDayId, activityName, category || "Other", description || null,
       location || null, cost || 0, durationMinutes || null,
       startTime || null, endTime || null, emoji || "📍", notes || null, sortOrder || 0]
    );
    const [rows] = await pool.execute("SELECT * FROM activities WHERE id = LAST_INSERT_ID()");
    return rows[0];
  },

  async getByDay(dayId) {
    const [rows] = await pool.execute(
      "SELECT * FROM activities WHERE itinerary_day_id = ? ORDER BY sort_order, start_time",
      [dayId]
    );
    return rows;
  },

  async update(id, data) {
    const allowed = ["activity_name", "category", "description", "location", "cost",
                     "duration_minutes", "start_time", "end_time", "emoji", "notes",
                     "is_booked", "booking_ref", "sort_order"];
    const updates = [];
    const values = [];
    for (const key of allowed) {
      if (data[key] !== undefined) { updates.push(`${key} = ?`); values.push(data[key]); }
    }
    if (!updates.length) return null;
    values.push(id);
    await pool.execute(`UPDATE activities SET ${updates.join(", ")} WHERE id = ?`, values);
    const [rows] = await pool.execute("SELECT * FROM activities WHERE id = ?", [id]);
    return rows[0];
  },

  async delete(id) {
    const [result] = await pool.execute("DELETE FROM activities WHERE id = ?", [id]);
    return result.affectedRows > 0;
  },

  async reorder(dayId, orderedIds) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      for (let i = 0; i < orderedIds.length; i++) {
        await conn.execute(
          "UPDATE activities SET sort_order = ? WHERE id = ? AND itinerary_day_id = ?",
          [i, orderedIds[i], dayId]
        );
      }
      await conn.commit();
      return true;
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  },
};
