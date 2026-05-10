/**
 * budgetService.js — Business logic for expenses and budget management
 */

import { budgetRepository } from "../repositories/BudgetRepository.js";
import { tripRepository } from "../repositories/TripRepository.js";
import { AppError } from "../utils/AppError.js";
import { optimizeBudget } from "../engine/budgetOptimizer.js";
import { EXPENSE_CATEGORIES } from "../config/constants.js";
import logger from "../utils/logger.js";

export class BudgetService {
  // ── Add expense + sync trip spent_amount ──────────────
  async addExpense(userId, data) {
    const { trip_id, category, amount, description, expense_date, currency, receipt_url } = data;

    if (!trip_id)         throw AppError.badRequest("trip_id is required.");
    if (!category)        throw AppError.badRequest("Category is required.");
    if (!amount || isNaN(amount) || Number(amount) <= 0) throw AppError.badRequest("Amount must be a positive number.");
    if (!description)     throw AppError.badRequest("Description is required.");
    if (!expense_date)    throw AppError.badRequest("Expense date is required.");
    if (!EXPENSE_CATEGORIES.includes(category)) {
      throw AppError.badRequest(`Invalid category. Use: ${EXPENSE_CATEGORIES.join(", ")}`);
    }

    // Verify trip ownership
    const trip = await tripRepository.findById(trip_id);
    if (!trip) throw AppError.notFound("Trip");

    const expense = await budgetRepository.createExpense({
      tripId: trip_id, userId, category, amount: Number(amount),
      currency: currency || "INR", description, expenseDate: expense_date,
      receiptUrl: receipt_url,
    });

    // Sync trip.spent_amount
    await tripRepository.syncSpentAmount(trip_id);

    logger.info("Expense added", { expenseId: expense?.id, tripId: trip_id, amount, category });
    return expense;
  }

  // ── Get expenses with breakdown ────────────────────────
  async getExpenses(tripId, userId, queryParams = {}) {
    const trip = await tripRepository.findById(tripId);
    if (!trip) throw AppError.notFound("Trip");
    if (trip.user_id !== userId) throw AppError.forbidden();

    const [expenseResult, categoryBreakdown, timeline] = await Promise.all([
      budgetRepository.findByTrip(tripId, queryParams),
      budgetRepository.getCategoryBreakdown(tripId),
      budgetRepository.getDailyTimeline(tripId),
    ]);

    return {
      expenses:           expenseResult.rows,
      category_breakdown: categoryBreakdown,
      timeline,
      pagination: {
        total: expenseResult.total,
        page:  expenseResult.page,
        limit: expenseResult.limit,
      },
    };
  }

  // ── Delete expense ─────────────────────────────────────
  async deleteExpense(expenseId, userId) {
    const rows = await budgetRepository.query(
      "SELECT trip_id FROM expenses WHERE id = ? AND user_id = ? LIMIT 1",
      [expenseId, userId]
    );
    if (!rows?.length) throw AppError.notFound("Expense");

    const tripId = rows[0].trip_id;
    await budgetRepository.deleteExpense(expenseId, userId);
    await tripRepository.syncSpentAmount(tripId);

    logger.info("Expense deleted", { expenseId, userId });
    return true;
  }

  // ── Run AI Budget Optimizer (pure engine — no external API) ──
  async runOptimizer(tripId, userId) {
    const trip = await tripRepository.findById(tripId);
    if (!trip) throw AppError.notFound("Trip");
    if (trip.user_id !== userId) throw AppError.forbidden();

    const [budgetSummary, categoryBreakdown] = await Promise.all([
      tripRepository.getBudgetSummary(tripId),
      budgetRepository.getCategoryBreakdown(tripId),
    ]);

    const startDate = new Date(trip.start_date);
    const today     = new Date();
    const daysElapsed = Math.max(1, Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)));
    const totalDays   = Math.max(1, Math.ceil(
      (new Date(trip.end_date) - startDate) / (1000 * 60 * 60 * 24)
    ));

    const report = optimizeBudget({
      totalBudget:       Number(trip.budget),
      categoryBreakdown: categoryBreakdown.map((c) => ({ ...c, expense_count: c.expense_count })),
      daysElapsed,
      totalDays,
    });

    logger.info("Budget optimizer run", { tripId, healthScore: report.summary?.healthScore });
    return report;
  }

  // ── Packing items ──────────────────────────────────────
  async getPackingItems(tripId, userId) {
    const trip = await tripRepository.findById(tripId);
    if (!trip) throw AppError.notFound("Trip");
    if (trip.user_id !== userId) throw AppError.forbidden();
    return budgetRepository.getPackingItems(tripId);
  }

  async addPackingItem(tripId, userId, data) {
    const trip = await tripRepository.findById(tripId);
    if (!trip) throw AppError.notFound("Trip");
    if (trip.user_id !== userId) throw AppError.forbidden();
    return budgetRepository.addPackingItem({ tripId, ...data });
  }

  async togglePacked(itemId) {
    return budgetRepository.togglePacked(itemId);
  }
}

export const budgetService = new BudgetService();
export default budgetService;
