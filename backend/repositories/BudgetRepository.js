/**
 * BudgetRepository — All SQL for expenses and budget analysis
 */

import { BaseRepository } from "./BaseRepository.js";
import { PAGINATION } from "../config/constants.js";

class BudgetRepository extends BaseRepository {
  constructor() {
    super("expenses");
  }

  async createExpense({ tripId, userId, category, amount, currency, description, expenseDate, receiptUrl }) {
    await this.query(
      `INSERT INTO expenses (trip_id, user_id, category, amount, currency, description, expense_date, receipt_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [tripId, userId, category, amount, currency || "INR", description, expenseDate, receiptUrl || null]
    );
    const rows = await this.query(
      `SELECT * FROM expenses WHERE trip_id = ? AND description = ? ORDER BY created_at DESC LIMIT 1`,
      [tripId, description]
    );
    return rows[0];
  }

  async findByTrip(tripId, { page = 1, limit = 50, category, startDate, endDate } = {}) {
    const conditions = ["trip_id = ?"];
    const params = [tripId];
    if (category)  { conditions.push("category = ?");     params.push(category); }
    if (startDate) { conditions.push("expense_date >= ?"); params.push(startDate); }
    if (endDate)   { conditions.push("expense_date <= ?"); params.push(endDate); }

    const safeLimit = Math.min(Number(limit), 200);
    const offset    = (Math.max(Number(page), 1) - 1) * safeLimit;

    const [countRows, rows] = await Promise.all([
      this.query(`SELECT COUNT(*) AS total FROM expenses WHERE ${conditions.join(" AND ")}`, params),
      this.query(
        `SELECT e.*, u.name AS added_by_name FROM expenses e
         LEFT JOIN users u ON e.user_id = u.id
         WHERE ${conditions.join(" AND ")}
         ORDER BY e.expense_date DESC, e.created_at DESC LIMIT ? OFFSET ?`,
        [...params, safeLimit, offset]
      ),
    ]);
    return { rows, total: Number(countRows[0]?.total || 0), page: Number(page), limit: safeLimit };
  }

  async getCategoryBreakdown(tripId) {
    return this.query(
      `SELECT category, COUNT(*) AS expense_count, SUM(amount) AS total,
              AVG(amount) AS average, MIN(amount) AS minimum, MAX(amount) AS maximum
       FROM expenses WHERE trip_id = ? GROUP BY category ORDER BY total DESC`,
      [tripId]
    );
  }

  async getDailyTimeline(tripId) {
    return this.query(
      `SELECT expense_date AS date, SUM(amount) AS daily_total,
              COUNT(*) AS transaction_count
       FROM expenses WHERE trip_id = ? GROUP BY expense_date ORDER BY expense_date ASC`,
      [tripId]
    );
  }

  async deleteExpense(expenseId, userId) {
    const result = await this.query(
      "DELETE FROM expenses WHERE id = ? AND user_id = ?",
      [expenseId, userId]
    );
    return result.affectedRows > 0;
  }

  async updateExpense(expenseId, userId, data) {
    const allowed = ["category", "amount", "currency", "description", "expense_date", "receipt_url"];
    const { clause, values } = this.buildUpdateClause(data, allowed);
    if (!clause) return null;
    await this.query(`UPDATE expenses SET ${clause} WHERE id = ? AND user_id = ?`, [...values, expenseId, userId]);
    const rows = await this.query("SELECT * FROM expenses WHERE id = ? LIMIT 1", [expenseId]);
    return rows[0];
  }

  async getPackingItems(tripId) {
    return this.query(
      "SELECT * FROM packing_items WHERE trip_id = ? ORDER BY category ASC, sort_order ASC",
      [tripId]
    );
  }

  async addPackingItem({ tripId, itemName, category, quantity, notes, aiSuggested, sortOrder }) {
    await this.query(
      `INSERT INTO packing_items (trip_id, item_name, category, quantity, notes, ai_suggested, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tripId, itemName, category || "Other", quantity || 1, notes || null, aiSuggested || false, sortOrder || 0]
    );
    const rows = await this.query(
      "SELECT * FROM packing_items WHERE trip_id = ? AND item_name = ? ORDER BY created_at DESC LIMIT 1",
      [tripId, itemName]
    );
    return rows[0];
  }

  async togglePacked(itemId) {
    await this.query("UPDATE packing_items SET packed = NOT packed, updated_at = NOW() WHERE id = ?", [itemId]);
    const rows = await this.query("SELECT * FROM packing_items WHERE id = ? LIMIT 1", [itemId]);
    return rows[0];
  }
}

export const budgetRepository = new BudgetRepository();
export default budgetRepository;
