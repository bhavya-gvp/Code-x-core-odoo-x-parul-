import pool from "../config/db.js";

// ============================================================
// Expense Model
// ============================================================
export const Expense = {
  async create({ tripId, userId, category, amount, currency, description, expenseDate, receiptUrl }) {
    const [result] = await pool.execute(
      `INSERT INTO expenses (trip_id, user_id, category, amount, currency, description, expense_date, receipt_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [tripId, userId, category, amount, currency || "INR", description, expenseDate, receiptUrl || null]
    );
    // Update trip spent_amount
    await pool.execute(
      "UPDATE trips SET spent_amount = (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE trip_id = ?) WHERE id = ?",
      [tripId, tripId]
    );
    const [rows] = await pool.execute("SELECT * FROM expenses WHERE id = LAST_INSERT_ID()");
    return rows[0];
  },

  async getByTrip(tripId, { category, page = 1, limit = 50 } = {}) {
    const offset = (page - 1) * limit;
    let query = "SELECT * FROM expenses WHERE trip_id = ?";
    const params = [tripId];
    if (category) { query += " AND category = ?"; params.push(category); }
    query += ` ORDER BY expense_date DESC, created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    const [rows] = await pool.execute(query, params);
    return rows;
  },

  async getCategoryBreakdown(tripId) {
    const [rows] = await pool.execute(
      `SELECT category,
              SUM(amount) AS total,
              COUNT(*) AS count,
              MIN(amount) AS min_amount,
              MAX(amount) AS max_amount
       FROM expenses WHERE trip_id = ?
       GROUP BY category
       ORDER BY total DESC`,
      [tripId]
    );
    return rows;
  },

  async getDailySpend(tripId) {
    const [rows] = await pool.execute(
      `SELECT expense_date, SUM(amount) AS total
       FROM expenses WHERE trip_id = ?
       GROUP BY expense_date
       ORDER BY expense_date`,
      [tripId]
    );
    return rows;
  },

  async delete(id, userId) {
    const [expense] = await pool.execute("SELECT trip_id FROM expenses WHERE id = ? AND user_id = ?", [id, userId]);
    if (!expense.length) return false;
    const tripId = expense[0].trip_id;
    await pool.execute("DELETE FROM expenses WHERE id = ? AND user_id = ?", [id, userId]);
    await pool.execute(
      "UPDATE trips SET spent_amount = (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE trip_id = ?) WHERE id = ?",
      [tripId, tripId]
    );
    return true;
  },
};

// ============================================================
// PackingItem Model
// ============================================================
export const PackingItem = {
  async create({ tripId, itemName, category, quantity, notes, aiSuggested, sortOrder }) {
    await pool.execute(
      `INSERT INTO packing_items (trip_id, item_name, category, quantity, notes, ai_suggested, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tripId, itemName, category || "Other", quantity || 1, notes || null, aiSuggested || false, sortOrder || 0]
    );
    const [rows] = await pool.execute("SELECT * FROM packing_items WHERE id = LAST_INSERT_ID()");
    return rows[0];
  },

  async bulkCreate(tripId, items) {
    if (!items?.length) return [];
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const created = [];
      for (const item of items) {
        await conn.execute(
          `INSERT INTO packing_items (trip_id, item_name, category, quantity, ai_suggested, sort_order)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [tripId, item.name, item.category || "Other", item.quantity || 1, item.aiSuggested || false, item.sortOrder || 0]
        );
        const [rows] = await conn.execute("SELECT * FROM packing_items WHERE id = LAST_INSERT_ID()");
        created.push(rows[0]);
      }
      await conn.commit();
      return created;
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  },

  async getByTrip(tripId, { category } = {}) {
    let query = "SELECT * FROM packing_items WHERE trip_id = ?";
    const params = [tripId];
    if (category) { query += " AND category = ?"; params.push(category); }
    query += " ORDER BY sort_order, category, item_name";
    const [rows] = await pool.execute(query, params);
    return rows;
  },

  async togglePacked(id, tripId) {
    await pool.execute(
      "UPDATE packing_items SET packed = NOT packed WHERE id = ? AND trip_id = ?",
      [id, tripId]
    );
    const [rows] = await pool.execute("SELECT * FROM packing_items WHERE id = ?", [id]);
    return rows[0];
  },

  async delete(id, tripId) {
    const [result] = await pool.execute("DELETE FROM packing_items WHERE id = ? AND trip_id = ?", [id, tripId]);
    return result.affectedRows > 0;
  },

  async getProgress(tripId) {
    const [rows] = await pool.execute(
      `SELECT
         COUNT(*) AS total,
         SUM(packed) AS packed_count,
         ROUND((SUM(packed) / COUNT(*)) * 100, 1) AS progress_percent
       FROM packing_items WHERE trip_id = ?`,
      [tripId]
    );
    return rows[0];
  },
};
