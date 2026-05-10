import asyncHandler from "express-async-handler";
import { ItineraryDay, Activity } from "../models/Itinerary.js";
import { generateItinerary } from "../services/aiService.js";
import pool from "../config/db.js";

// ============================================================
// ITINERARY DAYS
// ============================================================

export const getItinerary = asyncHandler(async (req, res) => {
  const days = await ItineraryDay.getByTrip(req.params.tripId);
  res.json({ success: true, count: days.length, data: days });
});

export const addDay = asyncHandler(async (req, res) => {
  const { trip_id, city_id, day_number, date, city_name, notes, daily_budget } = req.body;
  const day = await ItineraryDay.create({
    tripId: trip_id, cityId: city_id, dayNumber: day_number,
    date, cityName: city_name, notes, dailyBudget: daily_budget,
  });
  res.status(201).json({ success: true, message: "Day added.", data: day });
});

export const updateDay = asyncHandler(async (req, res) => {
  const day = await ItineraryDay.update(req.params.id, req.body);
  if (!day) return res.status(404).json({ success: false, message: "Day not found." });
  res.json({ success: true, data: day });
});

export const deleteDay = asyncHandler(async (req, res) => {
  const deleted = await ItineraryDay.delete(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, message: "Day not found." });
  res.json({ success: true, message: "Day deleted." });
});

// ============================================================
// AI ITINERARY GENERATOR
// ============================================================

export const generateAIItinerary = asyncHandler(async (req, res) => {
  const { tripId } = req.params;

  // Verify trip ownership
  const [trips] = await pool.execute("SELECT * FROM trips WHERE id = ? AND user_id = ?", [tripId, req.user.id]);
  if (!trips.length) return res.status(404).json({ success: false, message: "Trip not found." });

  const trip = trips[0];
  const [cities] = await pool.execute("SELECT city_name FROM trip_cities WHERE trip_id = ? ORDER BY order_index", [tripId]);

  const result = await generateItinerary({
    destinations: cities.map((c) => c.city_name),
    startDate: trip.start_date,
    endDate: trip.end_date,
    mood: trip.mood,
    budget: trip.budget,
    travelType: trip.travel_type,
  });

  // Persist to DB
  for (const day of result.days) {
    const dayRecord = await ItineraryDay.create({
      tripId,
      dayNumber: day.dayNumber,
      date: day.date,
      cityName: day.cityName,
    });
    for (const act of day.activities) {
      await Activity.create({ ...act, itineraryDayId: dayRecord.id });
    }
  }

  // Return full itinerary
  const days = await ItineraryDay.getByTrip(tripId);
  res.status(201).json({
    success: true,
    message: "AI itinerary generated successfully!",
    data: { days, totalDays: result.totalDays },
  });
});

// ============================================================
// ACTIVITIES
// ============================================================

export const getActivities = asyncHandler(async (req, res) => {
  const activities = await Activity.getByDay(req.params.dayId);
  res.json({ success: true, count: activities.length, data: activities });
});

export const addActivity = asyncHandler(async (req, res) => {
  const {
    itinerary_day_id, activity_name, category, description, location,
    cost, duration_minutes, start_time, end_time, emoji, notes, sort_order,
  } = req.body;
  const activity = await Activity.create({
    itineraryDayId: itinerary_day_id, activityName: activity_name,
    category, description, location, cost, durationMinutes: duration_minutes,
    startTime: start_time, endTime: end_time, emoji, notes, sortOrder: sort_order,
  });
  res.status(201).json({ success: true, data: activity });
});

export const updateActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.update(req.params.id, req.body);
  if (!activity) return res.status(404).json({ success: false, message: "Activity not found." });
  res.json({ success: true, data: activity });
});

export const deleteActivity = asyncHandler(async (req, res) => {
  const deleted = await Activity.delete(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, message: "Activity not found." });
  res.json({ success: true, message: "Activity deleted." });
});

export const reorderActivities = asyncHandler(async (req, res) => {
  const { day_id, ordered_ids } = req.body;
  await Activity.reorder(day_id, ordered_ids);
  res.json({ success: true, message: "Activities reordered." });
});
