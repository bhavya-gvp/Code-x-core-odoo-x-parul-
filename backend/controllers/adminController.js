/**
 * adminController.js — Platform analytics and admin operations
 *
 * Routes:
 *   GET /api/admin/stats       — KPI summary
 *   GET /api/admin/users       — Paginated user list
 *   GET /api/admin/trips       — Paginated trip list
 *   DELETE /api/admin/users/:id — Soft-delete a user
 *   PATCH /api/admin/users/:id/verify — Toggle verified badge
 *
 * Access: Admin role only (enforced in authMiddleware)
 */

import asyncHandler from "express-async-handler";
import { ApiResponse } from "../utils/ApiResponse.js";
import { tripRepository } from "../repositories/TripRepository.js";
import { userRepository } from "../repositories/UserRepository.js";
import pool from "../config/db.js";
import logger from "../utils/logger.js";

// ── GET /api/admin/stats ───────────────────────────────────
export const getAdminStats = asyncHandler(async (req, res) => {
  const [userStats, tripStats, expenseStats, postStats] = await Promise.all([
    userRepository.getAdminStats(),
    tripRepository.getAdminStats(),
    pool.execute(`SELECT
        COUNT(*)            AS total_expenses,
        SUM(amount)         AS total_amount,
        AVG(amount)         AS avg_amount
      FROM expenses`),
    pool.execute(`SELECT
        COUNT(*)                    AS total_posts,
        SUM(likes_count)            AS total_likes,
        SUM(visibility = 'public')  AS public_posts
      FROM community_posts WHERE deleted_at IS NULL`),
  ]);

  const [expenseRows] = expenseStats;
  const [postRows]    = postStats;

  ApiResponse.success(res, {
    users:    userStats,
    trips:    tripStats,
    expenses: expenseRows[0],
    community: postRows[0],
    generatedAt: new Date().toISOString(),
  }, "Admin stats retrieved.");
});

// ── GET /api/admin/users ───────────────────────────────────
export const getAdminUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const safePage  = Math.max(Number(page), 1);
  const safeLimit = Math.min(Number(limit), 100);
  const offset    = (safePage - 1) * safeLimit;

  let where = "deleted_at IS NULL";
  const params = [];
  if (search) {
    where += " AND (name LIKE ? OR email LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM users WHERE ${where}`, params
  );
  const [rows] = await pool.execute(
    `SELECT id, name, email, role, is_verified, trips_count, followers_count, created_at
     FROM users WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, safeLimit, offset]
  );

  ApiResponse.paginated(res, rows, {
    page: safePage, limit: safeLimit, total: Number(countRows[0]?.total || 0),
  });
});

// ── DELETE /api/admin/users/:id ────────────────────────────
export const adminDeleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await pool.execute("UPDATE users SET deleted_at = NOW() WHERE id = ?", [id]);
  logger.warn("Admin soft-deleted user", { targetUserId: id, adminId: req.user.id });
  ApiResponse.success(res, null, "User deactivated.");
});

// ── PATCH /api/admin/users/:id/verify ─────────────────────
export const adminVerifyUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.execute(
    "UPDATE users SET is_verified = NOT is_verified WHERE id = ?", [id]
  );
  logger.info("Admin toggled verification", { targetUserId: id, adminId: req.user.id });
  ApiResponse.success(res, null, "User verification toggled.");
});

// ── GET /api/admin/trips ───────────────────────────────────
export const getAdminTrips = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const safePage  = Math.max(Number(page), 1);
  const safeLimit = Math.min(Number(limit), 100);
  const offset    = (safePage - 1) * safeLimit;

  const conditions = ["t.deleted_at IS NULL"];
  const params = [];
  if (status) { conditions.push("t.status = ?"); params.push(status); }

  const where = conditions.join(" AND ");
  const [countRows] = await pool.execute(`SELECT COUNT(*) AS total FROM trips t WHERE ${where}`, params);
  const [rows] = await pool.execute(
    `SELECT t.id, t.title, t.status, t.budget, t.visibility, t.ai_generated,
            t.created_at, u.name AS owner_name, u.email AS owner_email
     FROM trips t JOIN users u ON t.user_id = u.id
     WHERE ${where} ORDER BY t.created_at DESC LIMIT ? OFFSET ?`,
    [...params, safeLimit, offset]
  );

  ApiResponse.paginated(res, rows, { page: safePage, limit: safeLimit, total: Number(countRows[0]?.total || 0) });
});
