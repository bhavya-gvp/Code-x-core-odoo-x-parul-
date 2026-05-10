/**
 * validators/tripValidator.js
 *
 * Input validation chains using express-validator.
 * Used by route definitions — runs BEFORE controllers.
 *
 * Design:
 *  - All validation rules are named exports
 *  - The runValidation middleware executes the chain and returns 422 on failure
 *  - Controllers receive only clean, validated data
 */

import { body, param, query, validationResult } from "express-validator";
import { ApiResponse } from "../utils/ApiResponse.js";
import { TRIP_VISIBILITY, TRAVEL_MOODS, EXPENSE_CATEGORIES } from "../config/constants.js";

// ── Validation result handler (middleware) ─────────────────
export const runValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return ApiResponse.validationError(res, errors.array());
  }
  next();
};

// ── Auth validators ────────────────────────────────────────
export const registerValidator = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required.")
    .isLength({ min: 2, max: 60 }).withMessage("Name must be 2–60 characters."),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required.")
    .isEmail().withMessage("Must be a valid email address.")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required.")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters.")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain uppercase, lowercase, and a number."),

  runValidation,
];

export const loginValidator = [
  body("email").trim().notEmpty().isEmail().normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required."),
  runValidation,
];

// ── Trip validators ────────────────────────────────────────
export const createTripValidator = [
  body("title")
    .trim()
    .notEmpty().withMessage("Trip title is required.")
    .isLength({ min: 2, max: 200 }).withMessage("Title must be 2–200 characters."),

  body("start_date")
    .notEmpty().withMessage("Start date is required.")
    .isISO8601().withMessage("start_date must be a valid date (YYYY-MM-DD)."),

  body("end_date")
    .notEmpty().withMessage("End date is required.")
    .isISO8601().withMessage("end_date must be a valid date (YYYY-MM-DD).")
    .custom((endDate, { req }) => {
      if (new Date(endDate) < new Date(req.body.start_date)) {
        throw new Error("end_date must be on or after start_date.");
      }
      return true;
    }),

  body("budget")
    .optional()
    .isFloat({ min: 0 }).withMessage("Budget must be a positive number."),

  body("visibility")
    .optional()
    .isIn(Object.values(TRIP_VISIBILITY))
    .withMessage(`visibility must be one of: ${Object.values(TRIP_VISIBILITY).join(", ")}.`),

  body("mood")
    .optional()
    .isIn(TRAVEL_MOODS)
    .withMessage(`mood must be one of: ${TRAVEL_MOODS.join(", ")}.`),

  runValidation,
];

export const updateTripValidator = [
  param("id").isUUID(4).withMessage("Invalid trip ID."),

  body("title")
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 }).withMessage("Title must be 2–200 characters."),

  body("start_date")
    .optional()
    .isISO8601().withMessage("start_date must be a valid date."),

  body("end_date")
    .optional()
    .isISO8601().withMessage("end_date must be a valid date."),

  body("budget")
    .optional()
    .isFloat({ min: 0 }).withMessage("Budget must be a positive number."),

  runValidation,
];

// ── Expense validators ─────────────────────────────────────
export const addExpenseValidator = [
  body("trip_id").notEmpty().withMessage("trip_id is required."),

  body("category")
    .notEmpty().withMessage("Category is required.")
    .isIn(EXPENSE_CATEGORIES)
    .withMessage(`category must be one of: ${EXPENSE_CATEGORIES.join(", ")}.`),

  body("amount")
    .notEmpty().withMessage("Amount is required.")
    .isFloat({ min: 0.01 }).withMessage("Amount must be greater than 0."),

  body("description")
    .trim()
    .notEmpty().withMessage("Description is required.")
    .isLength({ max: 500 }).withMessage("Description max 500 characters."),

  body("expense_date")
    .notEmpty().withMessage("expense_date is required.")
    .isISO8601().withMessage("expense_date must be a valid date (YYYY-MM-DD)."),

  body("currency")
    .optional()
    .isLength({ min: 3, max: 3 }).withMessage("currency must be a 3-letter ISO code."),

  runValidation,
];

// ── Activity validators ────────────────────────────────────
export const addActivityValidator = [
  body("itinerary_day_id").notEmpty().withMessage("itinerary_day_id is required."),
  body("activity_name")
    .trim()
    .notEmpty().withMessage("activity_name is required.")
    .isLength({ max: 200 }).withMessage("activity_name max 200 characters."),
  body("cost")
    .optional()
    .isFloat({ min: 0 }).withMessage("cost must be >= 0."),
  runValidation,
];

// ── Community validators ───────────────────────────────────
export const createPostValidator = [
  body("caption")
    .trim()
    .notEmpty().withMessage("Caption is required.")
    .isLength({ max: 2200 }).withMessage("Caption max 2200 characters."),
  runValidation,
];

export const addCommentValidator = [
  body("content")
    .trim()
    .notEmpty().withMessage("Comment content is required.")
    .isLength({ max: 1000 }).withMessage("Comment max 1000 characters."),
  runValidation,
];

// ── Generic ID param validator ─────────────────────────────
export const idParamValidator = [
  param("id").notEmpty().withMessage("ID parameter is required."),
  runValidation,
];

// ── Pagination query validator ─────────────────────────────
export const paginationValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 }).withMessage("page must be a positive integer."),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100."),
  runValidation,
];
