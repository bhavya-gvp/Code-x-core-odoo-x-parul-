/**
 * TripRepository — All SQL for the trips domain
 *
 * Responsibilities:
 *  - Trip CRUD with soft delete
 *  - Paginated lists with filters
 *  - Collaborator-joined queries
 *  - Budget aggregation (single optimized query)
 *  - Public discover feed with composite filtering
 *
 * ⚠️ No business logic here. Only data access.
 */

import { BaseRepository } from "./BaseRepository.js";
import { PAGINATION, TRIP_STATUS } from "../config/constants.js";

class TripRepository extends BaseRepository {
  constructor() {
    super("trips");
  }

  // ── Create a trip ──────────────────────────────────────
  async create({ userId, title, description, startDate, endDate, budget, mood, travelType, visibility, coverImage }) {
    await this.query(
      `INSERT INTO trips
         (user_id, title, description, start_date, end_date, budget, mood, travel_type, visibility, cover_image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, title, description || null, startDate, endDate,
       budget || 0, mood || null, travelType || null,
       visibility || "private", coverImage || null]
    );

    // Increment user trip count
    await this.query("UPDATE users SET trips_count = trips_count + 1 WHERE id = ?", [userId]);

    return this.findByUserAndTitle(userId, title);
  }

  // ── Find most recent trip by user+title (post-insert) ─
  async findByUserAndTitle(userId, title) {
    const rows = await this.query(
      `SELECT t.*, u.name AS author_name, u.profile_image AS author_image
       FROM trips t
       JOIN users u ON t.user_id = u.id
       WHERE t.user_id = ? AND t.title = ? AND t.deleted_at IS NULL
       ORDER BY t.created_at DESC LIMIT 1`,
      [userId, title]
    );
    return rows[0] || null;
  }

  // ── Find trip with full details ────────────────────────
  async findById(id) {
    const rows = await this.query(
      `SELECT t.*,
              u.name          AS author_name,
              u.profile_image AS author_image,
              u.travel_personality AS author_personality,
              (SELECT COUNT(*) FROM collaborators WHERE trip_id = t.id AND status = 'accepted') AS collaborator_count,
              (SELECT COUNT(*) FROM itinerary_days WHERE trip_id = t.id) AS days_count,
              (SELECT COUNT(*) FROM activities a
               JOIN itinerary_days d ON a.itinerary_day_id = d.id
               WHERE d.trip_id = t.id) AS activities_count
       FROM trips t
       JOIN users u ON t.user_id = u.id
       WHERE t.id = ? AND t.deleted_at IS NULL LIMIT 1`,
      [id]
    );
    if (!rows[0]) return null;

    const trip = rows[0];

    // Attach cities in same round-trip
    const cities = await this.query(
      "SELECT * FROM trip_cities WHERE trip_id = ? ORDER BY order_index",
      [id]
    );
    trip.cities = cities;

    return trip;
  }

  // ── Paginated list for a user ──────────────────────────
  async findByUser(userId, { status, page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT } = {}) {
    const conditions = ["t.user_id = ?", "t.deleted_at IS NULL"];
    const params = [userId];

    if (status) { conditions.push("t.status = ?"); params.push(status); }

    const safeLimit  = Math.min(Number(limit), PAGINATION.MAX_LIMIT);
    const safePage   = Math.max(Number(page), 1);
    const offset     = (safePage - 1) * safeLimit;

    const [countRows, rows] = await Promise.all([
      this.query(
        `SELECT COUNT(*) AS total FROM trips t WHERE ${conditions.join(" AND ")}`,
        params
      ),
      this.query(
        `SELECT t.*,
                u.name AS author_name, u.profile_image AS author_image,
                (SELECT COUNT(*) FROM collaborators WHERE trip_id = t.id AND status = 'accepted') AS collaborator_count,
                (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE trip_id = t.id) AS actual_spent
         FROM trips t
         JOIN users u ON t.user_id = u.id
         WHERE ${conditions.join(" AND ")}
         ORDER BY t.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, safeLimit, offset]
      ),
    ]);

    return {
      rows,
      total: Number(countRows[0]?.total || 0),
      page: safePage,
      limit: safeLimit,
    };
  }

  // ── Public discover feed ───────────────────────────────
  async findPublic({ page = 1, limit = PAGINATION.COMMUNITY_LIMIT, mood, travelType, search } = {}) {
    const conditions = ["t.visibility = 'public'", "t.deleted_at IS NULL"];
    const params = [];

    if (mood)       { conditions.push("t.mood = ?");        params.push(mood); }
    if (travelType) { conditions.push("t.travel_type = ?"); params.push(travelType); }
    if (search)     { conditions.push("t.title LIKE ?");    params.push(`%${search}%`); }

    const safeLimit = Math.min(Number(limit), PAGINATION.MAX_LIMIT);
    const safePage  = Math.max(Number(page), 1);
    const offset    = (safePage - 1) * safeLimit;

    const [countRows, rows] = await Promise.all([
      this.query(
        `SELECT COUNT(*) AS total FROM trips t WHERE ${conditions.join(" AND ")}`,
        params
      ),
      this.query(
        `SELECT t.id, t.title, t.cover_image, t.start_date, t.end_date,
                t.budget, t.mood, t.travel_type, t.status,
                u.name AS author_name, u.profile_image AS author_image,
                (SELECT COUNT(*) FROM itinerary_days WHERE trip_id = t.id) AS days_count
         FROM trips t
         JOIN users u ON t.user_id = u.id
         WHERE ${conditions.join(" AND ")}
         ORDER BY t.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, safeLimit, offset]
      ),
    ]);

    return {
      rows,
      total: Number(countRows[0]?.total || 0),
      page: safePage,
      limit: safeLimit,
    };
  }

  // ── Budget aggregation — single optimized query ────────
  async getBudgetSummary(tripId) {
    const rows = await this.query(
      `SELECT
         t.budget                                      AS total_budget,
         COALESCE(SUM(e.amount), 0)                    AS total_spent,
         t.budget - COALESCE(SUM(e.amount), 0)         AS remaining,
         ROUND(
           (COALESCE(SUM(e.amount), 0) / NULLIF(t.budget, 0)) * 100, 1
         )                                             AS percent_used,
         COUNT(DISTINCT e.id)                          AS expense_count,
         JSON_ARRAYAGG(
           JSON_OBJECT('category', e.category, 'amount', e.amount)
         )                                             AS expense_raw
       FROM trips t
       LEFT JOIN expenses e ON e.trip_id = t.id
       WHERE t.id = ?
       GROUP BY t.id, t.budget`,
      [tripId]
    );
    if (!rows[0]) return null;

    // Category breakdown (post-aggregation in JS — avoids N+1)
    const summary = rows[0];
    const rawExpenses = summary.expense_raw ? JSON.parse(summary.expense_raw) : [];
    const categoryBreakdown = rawExpenses.reduce((acc, e) => {
      if (!e.category) return acc;
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
      return acc;
    }, {});

    delete summary.expense_raw;
    summary.category_breakdown = Object.entries(categoryBreakdown)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);

    return summary;
  }

  // ── Update trip ────────────────────────────────────────
  async update(id, userId, data) {
    const allowed = ["title", "description", "start_date", "end_date", "budget",
                     "mood", "travel_type", "status", "visibility", "cover_image", "spent_amount"];
    const { clause, values } = this.buildUpdateClause(data, allowed);
    if (!clause) return this.findById(id);

    await this.query(
      `UPDATE trips SET ${clause} WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
      [...values, id, userId]
    );
    return this.findById(id);
  }

  // ── Soft delete ────────────────────────────────────────
  async delete(id, userId) {
    const result = await this.query(
      "UPDATE trips SET deleted_at = NOW() WHERE id = ? AND user_id = ? AND deleted_at IS NULL",
      [id, userId]
    );
    if (result.affectedRows > 0) {
      await this.query("UPDATE users SET trips_count = GREATEST(trips_count - 1, 0) WHERE id = ?", [userId]);
    }
    return result.affectedRows > 0;
  }

  // ── Auto-transition status based on dates ─────────────
  async autoTransitionStatuses() {
    const today = new Date().toISOString().split("T")[0];

    // planning → upcoming (start_date > today but within 7 days)
    await this.query(
      `UPDATE trips SET status = 'upcoming'
       WHERE status = 'planning' AND start_date BETWEEN ? AND DATE_ADD(?, INTERVAL 7 DAY) AND deleted_at IS NULL`,
      [today, today]
    );

    // upcoming → ongoing
    await this.query(
      `UPDATE trips SET status = 'ongoing'
       WHERE status IN ('planning', 'upcoming') AND start_date <= ? AND end_date >= ? AND deleted_at IS NULL`,
      [today, today]
    );

    // ongoing → completed
    await this.query(
      `UPDATE trips SET status = 'completed'
       WHERE status = 'ongoing' AND end_date < ? AND deleted_at IS NULL`,
      [today]
    );
  }

  // ── Sync spent_amount from expenses table ──────────────
  async syncSpentAmount(tripId) {
    await this.query(
      `UPDATE trips t
       SET t.spent_amount = (
         SELECT COALESCE(SUM(e.amount), 0) FROM expenses e WHERE e.trip_id = t.id
       )
       WHERE t.id = ?`,
      [tripId]
    );
  }

  // ── Admin stats ────────────────────────────────────────
  async getAdminStats() {
    const rows = await this.query(
      `SELECT
         COUNT(*)                                    AS total_trips,
         SUM(status = 'completed')                   AS completed_trips,
         SUM(status = 'ongoing')                     AS ongoing_trips,
         SUM(status = 'planning')                    AS planning_trips,
         SUM(ai_generated = 1)                       AS ai_generated_trips,
         AVG(budget)                                 AS avg_budget,
         SUM(visibility = 'public')                  AS public_trips
       FROM trips WHERE deleted_at IS NULL`
    );
    return rows[0];
  }
}

// Singleton export
export const tripRepository = new TripRepository();
export default tripRepository;
