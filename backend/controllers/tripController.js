import asyncHandler from "express-async-handler";
import { Trip } from "../models/Trip.js";
import { uploadToCloudinary } from "../config/cloudinary.js";
import { tripGenerationService } from "../services/tripGenerationService.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AppError } from "../utils/AppError.js";

// ============================================================
// @desc    AI-powered trip generation (8-step engine)
// @route   POST /api/trips/generate
// @access  Private
// ============================================================
export const generateTrip = asyncHandler(async (req, res) => {
  const { title, description, destinations, start_date, end_date,
          budget, mood, travel_type, travelers, visibility } = req.body;

  if (!start_date || !end_date)
    throw AppError.badRequest("start_date and end_date are required.");
  if (!budget || isNaN(budget) || Number(budget) <= 0)
    throw AppError.badRequest("A positive budget is required.");
  if (new Date(end_date) <= new Date(start_date))
    throw AppError.badRequest("end_date must be after start_date.");

  const result = await tripGenerationService.generateTrip(req.user.id, {
    title, description,
    destinations: Array.isArray(destinations) ? destinations : (destinations ? [destinations] : []),
    start_date, end_date,
    budget:      Number(budget),
    mood:        mood || "Relax",
    travel_type: travel_type || "Solo Adventure",
    travelers:   Number(travelers) || 1,
    visibility:  visibility || "private",
  });

  ApiResponse.created(res, result, "✨ AI trip generated successfully!");
});

// ============================================================
// @desc    Create a new trip
// @route   POST /api/trips
// @access  Private
// ============================================================
export const createTrip = asyncHandler(async (req, res) => {
  let coverImage = null;
  if (req.file) {
    try {
      const result = await uploadToCloudinary(req.file.buffer, "traveloop/trips");
      coverImage = result.secure_url;
    } catch {
      console.warn("Cloudinary upload failed for trip cover");
    }
  }

  const {
    title, description, start_date, end_date, budget,
    mood, travel_type, visibility
  } = req.body;

  const trip = await Trip.create({
    userId: req.user.id,
    title, description, startDate: start_date, endDate: end_date,
    budget, mood, travelType: travel_type, visibility, coverImage,
  });

  res.status(201).json({
    success: true,
    message: "Trip created successfully!",
    data: trip,
  });
});

// ============================================================
// @desc    Get all trips for current user
// @route   GET /api/trips
// @access  Private
// ============================================================
export const getMyTrips = asyncHandler(async (req, res) => {
  const { status, visibility, page, limit } = req.query;
  const trips = await Trip.findByUser(req.user.id, { status, visibility, page, limit });

  res.json({
    success: true,
    count: trips.length,
    data: trips,
  });
});

// ============================================================
// @desc    Get a single trip by ID
// @route   GET /api/trips/:id
// @access  Private
// ============================================================
export const getTripById = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id, req.user.id);

  if (!trip) {
    return res.status(404).json({ success: false, message: "Trip not found." });
  }

  // Check access
  if (trip.user_id !== req.user.id && trip.visibility === "private") {
    return res.status(403).json({ success: false, message: "Access denied." });
  }

  // Attach budget summary
  const budget = await Trip.getBudgetSummary(trip.id);
  trip.budget_summary = budget;

  res.json({ success: true, data: trip });
});

// ============================================================
// @desc    Update a trip
// @route   PUT /api/trips/:id
// @access  Private (owner only)
// ============================================================
export const updateTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id, req.user.id);
  if (!trip) return res.status(404).json({ success: false, message: "Trip not found." });
  if (trip.user_id !== req.user.id) {
    return res.status(403).json({ success: false, message: "Not authorized to edit this trip." });
  }

  let coverImage = undefined;
  if (req.file) {
    try {
      const result = await uploadToCloudinary(req.file.buffer, "traveloop/trips");
      coverImage = result.secure_url;
    } catch { /* skip */ }
  }

  const data = { ...req.body };
  if (coverImage) data.cover_image = coverImage;

  const updated = await Trip.update(req.params.id, req.user.id, data);
  res.json({ success: true, message: "Trip updated.", data: updated });
});

// ============================================================
// @desc    Delete a trip
// @route   DELETE /api/trips/:id
// @access  Private (owner only)
// ============================================================
export const deleteTrip = asyncHandler(async (req, res) => {
  const deleted = await Trip.delete(req.params.id, req.user.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: "Trip not found or not authorized." });
  }
  res.json({ success: true, message: "Trip deleted successfully." });
});

// ============================================================
// @desc    Get public trips (community discover)
// @route   GET /api/trips/public
// @access  Public
// ============================================================
export const getPublicTrips = asyncHandler(async (req, res) => {
  const { page, limit, mood, travelType } = req.query;
  const trips = await Trip.findPublic({ page, limit, mood, travelType });
  res.json({ success: true, count: trips.length, data: trips });
});

// ============================================================
// @desc    Get trip budget summary
// @route   GET /api/trips/:id/budget
// @access  Private
// ============================================================
export const getTripBudget = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id, req.user.id);
  if (!trip || trip.user_id !== req.user.id) {
    return res.status(404).json({ success: false, message: "Trip not found." });
  }
  const summary = await Trip.getBudgetSummary(req.params.id);
  res.json({ success: true, data: summary });
});
