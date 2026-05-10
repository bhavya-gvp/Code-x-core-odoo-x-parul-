import pool from "../config/db.js";

// ============================================================
// Trip Model
// ============================================================

export const Trip = {
  /**
   * Create a new trip
   */
  async create({ userId, title, description, startDate, endDate, budget, mood, travelType, visibility, coverImage }) {
    const [result] = await pool.execute(
      `INSERT INTO trips
         (user_id, title, description, start_date, end_date, budget, mood, travel_type, visibility, cover_image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, title, description || null, startDate, endDate,
       budget || 0, mood || null, travelType || null,
       visibility || "private", coverImage || null]
    );
    // Update user trips count
    await pool.execute("UPDATE users SET trips_count = trips_count + 1 WHERE id = ?", [userId]);
    return this.findById(result.insertId, userId);
  },

  /**
   * Find trips by user ID with optional status filter
   */
  async findByUser(userId, { status, visibility, page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT t.*,
             u.name AS author_name, u.profile_image AS author_image,
             (SELECT COUNT(*) FROM collaborators WHERE trip_id = t.id AND status = 'accepted') AS collaborator_count
      FROM trips t
      JOIN users u ON t.user_id = u.id
      WHERE t.user_id = ?
    `;
    const params = [userId];

    if (status) { query += " AND t.status = ?"; params.push(status); }
    if (visibility) { query += " AND t.visibility = ?"; params.push(visibility); }

    query += ` ORDER BY t.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

    const [rows] = await pool.execute(query, params);
    return rows;
  },

  /**
   * Find trip by ID — validates user access
   */
  async findById(id, requestingUserId = null) {
    const [rows] = await pool.execute(
      `SELECT t.*,
              u.name AS author_name, u.profile_image AS author_image
       FROM trips t
       JOIN users u ON t.user_id = u.id
       WHERE t.id = ? LIMIT 1`,
      [id]
    );
    const trip = rows[0];
    if (!trip) return null;

    // Attach cities
    const [cities] = await pool.execute(
      "SELECT * FROM trip_cities WHERE trip_id = ? ORDER BY order_index",
      [id]
    );
    trip.cities = cities;

    return trip;
  },

  /**
   * Update a trip
   */
  async update(id, userId, data) {
    const allowed = ["title", "description", "start_date", "end_date", "budget",
                     "mood", "travel_type", "status", "visibility", "cover_image"];
    const updates = [];
    const values = [];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(data[key]);
      }
    }
    if (!updates.length) return this.findById(id, userId);
    values.push(id, userId);
    await pool.execute(`UPDATE trips SET ${updates.join(", ")} WHERE id = ? AND user_id = ?`, values);
    return this.findById(id, userId);
  },

  /**
   * Delete a trip (owner only)
   */
  async delete(id, userId) {
    const [result] = await pool.execute(
      "DELETE FROM trips WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    if (result.affectedRows > 0) {
      await pool.execute("UPDATE users SET trips_count = GREATEST(trips_count - 1, 0) WHERE id = ?", [userId]);
    }
    return result.affectedRows > 0;
  },

  /**
   * Get trip budget summary (spent vs allocated)
   */
  async getBudgetSummary(tripId) {
    const [rows] = await pool.execute(
      `SELECT
         t.budget AS total_budget,
         COALESCE(SUM(e.amount), 0) AS total_spent,
         t.budget - COALESCE(SUM(e.amount), 0) AS remaining,
         ROUND((COALESCE(SUM(e.amount), 0) / NULLIF(t.budget, 0)) * 100, 1) AS percent_used
       FROM trips t
       LEFT JOIN expenses e ON e.trip_id = t.id
       WHERE t.id = ?
       GROUP BY t.id, t.budget`,
      [tripId]
    );
    return rows[0] || null;
  },

  /**
   * Get public/community trips (for discover)
   */
  async findPublic({ page = 1, limit = 20, mood, travelType } = {}) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT t.id, t.title, t.cover_image, t.start_date, t.end_date,
             t.budget, t.mood, t.status,
             u.name AS author_name, u.profile_image AS author_image
      FROM trips t
      JOIN users u ON t.user_id = u.id
      WHERE t.visibility = 'public'
    `;
    const params = [];
    if (mood) { query += " AND t.mood = ?"; params.push(mood); }
    if (travelType) { query += " AND t.travel_type = ?"; params.push(travelType); }
    query += ` ORDER BY t.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    const [rows] = await pool.execute(query, params);
    return rows;
  },
};
