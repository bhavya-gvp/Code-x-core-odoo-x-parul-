/**
 * tripService.js — Business logic for trips
 *
 * Calls TripRepository for data. Contains all domain logic:
 *  - Ownership validation
 *  - Status auto-transition
 *  - Collaborator permissions
 *  - Trip enrichment
 */

import { tripRepository } from "../repositories/TripRepository.js";
import { AppError } from "../utils/AppError.js";
import logger from "../utils/logger.js";

export class TripService {
  // ── Create a new trip ──────────────────────────────────
  async createTrip(userId, data, coverImage = null) {
    const { title, description, start_date, end_date, budget, mood, travel_type, visibility } = data;

    if (!title?.trim())    throw AppError.badRequest("Trip title is required.");
    if (!start_date)       throw AppError.badRequest("Start date is required.");
    if (!end_date)         throw AppError.badRequest("End date is required.");
    if (new Date(end_date) < new Date(start_date)) {
      throw AppError.badRequest("End date must be after start date.");
    }

    const trip = await tripRepository.create({
      userId, title: title.trim(), description, startDate: start_date, endDate: end_date,
      budget: budget || 0, mood, travelType: travel_type, visibility, coverImage,
    });

    logger.info("Trip created", { tripId: trip.id, userId, title });
    return trip;
  }

  // ── Get user's trips (paginated) ───────────────────────
  async getUserTrips(userId, queryParams) {
    // Run status transitions in background (non-blocking)
    tripRepository.autoTransitionStatuses().catch((e) =>
      logger.warn("Status transition failed", { error: e.message })
    );
    return tripRepository.findByUser(userId, queryParams);
  }

  // ── Get single trip (with ownership/access check) ──────
  async getTripById(tripId, requestingUserId) {
    const trip = await tripRepository.findById(tripId);
    if (!trip) throw AppError.notFound("Trip");

    const isOwner = trip.user_id === requestingUserId;
    const isPublic = trip.visibility === "public";

    if (!isOwner && !isPublic) {
      // Check if collaborator
      const collab = await tripRepository.query(
        "SELECT id FROM collaborators WHERE trip_id = ? AND user_id = ? AND status = 'accepted' LIMIT 1",
        [tripId, requestingUserId]
      );
      if (!collab.length) throw AppError.forbidden("You don't have access to this trip.");
    }

    // Attach budget summary
    trip.budget_summary = await tripRepository.getBudgetSummary(tripId);
    return trip;
  }

  // ── Update trip (owner-only) ───────────────────────────
  async updateTrip(tripId, userId, data, coverImage = null) {
    const existing = await tripRepository.findById(tripId);
    if (!existing)              throw AppError.notFound("Trip");
    if (existing.user_id !== userId) throw AppError.forbidden("Only the trip owner can edit.");

    if (data.start_date && data.end_date) {
      if (new Date(data.end_date) < new Date(data.start_date)) {
        throw AppError.badRequest("End date must be after start date.");
      }
    }

    const updateData = { ...data };
    if (coverImage) updateData.cover_image = coverImage;

    const updated = await tripRepository.update(tripId, userId, updateData);
    logger.info("Trip updated", { tripId, userId });
    return updated;
  }

  // ── Soft-delete trip ───────────────────────────────────
  async deleteTrip(tripId, userId) {
    const existing = await tripRepository.findById(tripId);
    if (!existing)              throw AppError.notFound("Trip");
    if (existing.user_id !== userId) throw AppError.forbidden("Only the trip owner can delete.");

    const deleted = await tripRepository.delete(tripId, userId);
    if (!deleted) throw AppError.internal("Failed to delete trip.");

    logger.info("Trip soft-deleted", { tripId, userId });
    return true;
  }

  // ── Sync spent amount after any expense change ─────────
  async syncBudget(tripId) {
    await tripRepository.syncSpentAmount(tripId);
  }

  // ── Public discover feed ───────────────────────────────
  async getPublicTrips(queryParams) {
    return tripRepository.findPublic(queryParams);
  }

  // ── Admin stats ────────────────────────────────────────
  async getAdminStats() {
    return tripRepository.getAdminStats();
  }
}

export const tripService = new TripService();
export default tripService;
