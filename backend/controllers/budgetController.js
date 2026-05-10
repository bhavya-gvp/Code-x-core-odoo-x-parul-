import asyncHandler from "express-async-handler";
import { Expense, PackingItem } from "../models/Expense.js";
import { optimizeBudget, getBudgetTemplate } from "../services/recommendationService.js";

// ============================================================
// EXPENSES
// ============================================================

export const addExpense = asyncHandler(async (req, res) => {
  const { trip_id, category, amount, currency, description, expense_date, receipt_url } = req.body;
  const expense = await Expense.create({
    tripId: trip_id, userId: req.user.id, category, amount,
    currency, description, expenseDate: expense_date, receiptUrl: receipt_url,
  });
  res.status(201).json({ success: true, message: "Expense recorded.", data: expense });
});

export const getExpenses = asyncHandler(async (req, res) => {
  const { category, page, limit } = req.query;
  const [expenses, breakdown, daily] = await Promise.all([
    Expense.getByTrip(req.params.tripId, { category, page, limit }),
    Expense.getCategoryBreakdown(req.params.tripId),
    Expense.getDailySpend(req.params.tripId),
  ]);
  res.json({
    success: true,
    data: { expenses, category_breakdown: breakdown, daily_spend: daily },
  });
});

export const deleteExpense = asyncHandler(async (req, res) => {
  const deleted = await Expense.delete(req.params.id, req.user.id);
  if (!deleted) return res.status(404).json({ success: false, message: "Expense not found." });
  res.json({ success: true, message: "Expense deleted." });
});

export const getAIBudgetOptimization = asyncHandler(async (req, res) => {
  const result = await optimizeBudget(req.params.tripId, req.user.id);
  res.json({ success: true, data: result });
});

export const getBudgetTemplateController = asyncHandler(async (req, res) => {
  const { destination, days, style } = req.query;
  const template = getBudgetTemplate(destination, parseInt(days) || 7, style || "midrange");
  res.json({ success: true, data: template });
});

// ============================================================
// PACKING ITEMS
// ============================================================

export const addPackingItem = asyncHandler(async (req, res) => {
  const { trip_id, item_name, category, quantity, notes, sort_order } = req.body;
  const item = await PackingItem.create({
    tripId: trip_id, itemName: item_name, category,
    quantity, notes, sortOrder: sort_order,
  });
  res.status(201).json({ success: true, data: item });
});

export const getPackingList = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const [items, progress] = await Promise.all([
    PackingItem.getByTrip(req.params.tripId, { category }),
    PackingItem.getProgress(req.params.tripId),
  ]);
  res.json({ success: true, data: { items, progress } });
});

export const togglePacked = asyncHandler(async (req, res) => {
  const item = await PackingItem.togglePacked(req.params.id, req.params.tripId);
  if (!item) return res.status(404).json({ success: false, message: "Item not found." });
  res.json({ success: true, data: item });
});

export const deletePackingItem = asyncHandler(async (req, res) => {
  const deleted = await PackingItem.delete(req.params.id, req.params.tripId);
  if (!deleted) return res.status(404).json({ success: false, message: "Item not found." });
  res.json({ success: true, message: "Item removed." });
});

export const bulkAddPackingItems = asyncHandler(async (req, res) => {
  const { trip_id, items } = req.body;
  const created = await PackingItem.bulkCreate(trip_id, items);
  res.status(201).json({ success: true, count: created.length, data: created });
});
