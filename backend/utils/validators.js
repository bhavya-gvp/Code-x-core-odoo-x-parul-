import { body, param, query, validationResult } from "express-validator";

/**
 * Middleware to check validation results and return errors
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ============================================================
// Auth Validators
// ============================================================
export const registerValidator = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2, max: 100 }).withMessage("Name must be 2–100 characters"),
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email address")
    .normalizeEmail(),
  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

export const loginValidator = [
  body("email").trim().notEmpty().isEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password is required"),
];

// ============================================================
// Trip Validators
// ============================================================
export const tripValidator = [
  body("title")
    .trim()
    .notEmpty().withMessage("Trip title is required")
    .isLength({ max: 255 }).withMessage("Title too long"),
  body("start_date")
    .notEmpty().withMessage("Start date is required")
    .isISO8601().withMessage("Invalid start date format"),
  body("end_date")
    .notEmpty().withMessage("End date is required")
    .isISO8601().withMessage("Invalid end date format")
    .custom((endDate, { req }) => {
      if (new Date(endDate) < new Date(req.body.start_date)) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),
  body("budget")
    .optional()
    .isNumeric().withMessage("Budget must be a number")
    .isFloat({ min: 0 }).withMessage("Budget must be non-negative"),
  body("visibility")
    .optional()
    .isIn(["private", "friends", "public"]).withMessage("Invalid visibility"),
];

// ============================================================
// Expense Validators
// ============================================================
export const expenseValidator = [
  body("trip_id").notEmpty().withMessage("Trip ID is required"),
  body("category").notEmpty().withMessage("Category is required"),
  body("amount")
    .notEmpty().withMessage("Amount is required")
    .isFloat({ min: 0 }).withMessage("Amount must be positive"),
  body("description").notEmpty().withMessage("Description is required"),
  body("expense_date").isISO8601().withMessage("Invalid date"),
];

// ============================================================
// Journal Validators
// ============================================================
export const journalValidator = [
  body("trip_id").notEmpty().withMessage("Trip ID is required"),
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("content").trim().notEmpty().withMessage("Content is required"),
];

// ============================================================
// Packing Validators
// ============================================================
export const packingValidator = [
  body("trip_id").notEmpty().withMessage("Trip ID is required"),
  body("item_name").trim().notEmpty().withMessage("Item name is required"),
  body("category")
    .optional()
    .isIn(["Clothing", "Electronics", "Essentials", "Documents", "Other"])
    .withMessage("Invalid category"),
];

// ============================================================
// Community Post Validators
// ============================================================
export const communityPostValidator = [
  body("caption").trim().notEmpty().withMessage("Caption is required"),
];

// ============================================================
// Pagination helper
// ============================================================
export const paginationValidator = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be >= 1"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be 1-100"),
];
