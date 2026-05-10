import { Router } from "express";
import {
  addExpense, getExpenses, deleteExpense,
  getAIBudgetOptimization, getBudgetTemplateController,
  addPackingItem, getPackingList, togglePacked, deletePackingItem, bulkAddPackingItems,
} from "../controllers/budgetController.js";
import { protect } from "../middleware/authMiddleware.js";
import { expenseValidator, packingValidator, validate } from "../utils/validators.js";

const router = Router();

// Expenses
router.post("/expenses", protect, expenseValidator, validate, addExpense);
router.get("/expenses/:tripId", protect, getExpenses);
router.delete("/expenses/:id", protect, deleteExpense);
router.get("/optimize/:tripId", protect, getAIBudgetOptimization);
router.get("/template", protect, getBudgetTemplateController);

// Packing
router.post("/packing", protect, packingValidator, validate, addPackingItem);
router.post("/packing/bulk", protect, bulkAddPackingItems);
router.get("/packing/:tripId", protect, getPackingList);
router.put("/packing/:tripId/:id/toggle", protect, togglePacked);
router.delete("/packing/:tripId/:id", protect, deletePackingItem);

export default router;
