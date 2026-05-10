/**
 * BaseRepository — Generic database access layer
 *
 * All repositories extend this class.
 * Provides: paginate, findById, softDelete, buildUpdateClause
 *
 * Design principles:
 *  - Never contains business logic
 *  - Always returns plain objects (not model instances)
 *  - Parameterized queries only — SQL injection safe
 *  - Uses connection pool for performance
 */

import pool from "../config/db.js";
import logger from "../utils/logger.js";

export class BaseRepository {
  /**
   * @param {string} tableName — MySQL table name
   * @param {string} primaryKey — Primary key column (default: 'id')
   */
  constructor(tableName, primaryKey = "id") {
    this.table = tableName;
    this.pk = primaryKey;
    this.pool = pool;
  }

  // ── Core query runner ──────────────────────────────────
  /**
   * Execute a parameterized query
   * @param {string} sql
   * @param {Array} params
   * @returns {Array} rows
   */
  async query(sql, params = []) {
    const start = Date.now();
    try {
      const [rows] = await this.pool.execute(sql, params);
      const duration = Date.now() - start;
      if (duration > 200) {
        logger.warn("Slow query detected", { sql: sql.slice(0, 80), duration, table: this.table });
      }
      return rows;
    } catch (err) {
      logger.error("Database query error", { sql: sql.slice(0, 80), error: err.message, table: this.table });
      throw err;
    }
  }

  // ── Find by primary key ────────────────────────────────
  async findById(id) {
    const rows = await this.query(`SELECT * FROM \`${this.table}\` WHERE \`${this.pk}\` = ? AND deleted_at IS NULL LIMIT 1`, [id]);
    return rows[0] || null;
  }

  // ── Find by ID without soft delete filter ─────────────
  async findByIdRaw(id) {
    const rows = await this.query(`SELECT * FROM \`${this.table}\` WHERE \`${this.pk}\` = ? LIMIT 1`, [id]);
    return rows[0] || null;
  }

  // ── Paginated list ─────────────────────────────────────
  /**
   * @param {object} options
   * @param {string} [options.where] — SQL WHERE clause (without WHERE keyword)
   * @param {Array} [options.params] — Bound parameters for WHERE clause
   * @param {string} [options.orderBy] — ORDER BY clause
   * @param {number} [options.page]
   * @param {number} [options.limit]
   * @returns {{ rows: Array, total: number }}
   */
  async paginate({ where = "1=1", params = [], orderBy = "created_at DESC", page = 1, limit = 20 } = {}) {
    const safeLimit = Math.min(Number(limit) || 20, 100);
    const safePage  = Math.max(Number(page)  || 1,  1);
    const offset    = (safePage - 1) * safeLimit;

    const softDeleteClause = `AND deleted_at IS NULL`;

    const [countResult, rows] = await Promise.all([
      this.query(
        `SELECT COUNT(*) AS total FROM \`${this.table}\` WHERE ${where} ${softDeleteClause}`,
        params
      ),
      this.query(
        `SELECT * FROM \`${this.table}\` WHERE ${where} ${softDeleteClause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
        [...params, safeLimit, offset]
      ),
    ]);

    return {
      rows,
      total: countResult[0]?.total || 0,
      page: safePage,
      limit: safeLimit,
    };
  }

  // ── Soft delete ────────────────────────────────────────
  async softDelete(id) {
    const result = await this.query(
      `UPDATE \`${this.table}\` SET deleted_at = NOW() WHERE \`${this.pk}\` = ? AND deleted_at IS NULL`,
      [id]
    );
    return result.affectedRows > 0;
  }

  // ── Hard delete ────────────────────────────────────────
  async hardDelete(id) {
    const result = await this.query(
      `DELETE FROM \`${this.table}\` WHERE \`${this.pk}\` = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }

  // ── Build UPDATE SET clause from allowlist ─────────────
  /**
   * Safely builds a SET clause only for allowed fields
   * @param {object} data — Incoming update payload
   * @param {string[]} allowedFields — Whitelist of column names
   * @returns {{ clause: string, values: Array }}
   */
  buildUpdateClause(data, allowedFields) {
    const updates = [];
    const values  = [];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`\`${field}\` = ?`);
        values.push(data[field]);
      }
    }

    return { clause: updates.join(", "), values };
  }

  // ── Check existence ────────────────────────────────────
  async exists(id) {
    const rows = await this.query(
      `SELECT 1 FROM \`${this.table}\` WHERE \`${this.pk}\` = ? AND deleted_at IS NULL LIMIT 1`,
      [id]
    );
    return rows.length > 0;
  }

  // ── Count records ──────────────────────────────────────
  async count(where = "1=1", params = []) {
    const rows = await this.query(
      `SELECT COUNT(*) AS total FROM \`${this.table}\` WHERE ${where} AND deleted_at IS NULL`,
      params
    );
    return Number(rows[0]?.total || 0);
  }

  // ── Batch insert ───────────────────────────────────────
  /**
   * Insert multiple rows in a single query
   * @param {string[]} columns — Column names
   * @param {Array[]} rows — Array of value arrays
   */
  async bulkInsert(columns, rows) {
    if (!rows.length) return;
    const placeholders = rows.map(() => `(${columns.map(() => "?").join(", ")})`).join(", ");
    const values = rows.flat();
    const sql = `INSERT INTO \`${this.table}\` (\`${columns.join("`, `")}\`) VALUES ${placeholders}`;
    return this.query(sql, values);
  }
}

export default BaseRepository;
