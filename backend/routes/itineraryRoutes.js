import { Router } from "express";
import {
  getItinerary, addDay, updateDay, deleteDay, generateAIItinerary,
  getActivities, addActivity, updateActivity, deleteActivity, reorderActivities,
} from "../controllers/itineraryController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// Itinerary Days
router.get("/:tripId", protect, getItinerary);
router.post("/", protect, addDay);
router.put("/days/:id", protect, updateDay);
router.delete("/days/:id", protect, deleteDay);
router.post("/:tripId/generate", protect, generateAIItinerary);

// Activities
router.get("/activities/day/:dayId", protect, getActivities);
router.post("/activities", protect, addActivity);
router.put("/activities/:id", protect, updateActivity);
router.delete("/activities/:id", protect, deleteActivity);
router.post("/activities/reorder", protect, reorderActivities);

export default router;
