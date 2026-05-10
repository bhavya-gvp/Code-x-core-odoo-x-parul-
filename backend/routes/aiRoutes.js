import { Router } from "express";
import {
  getPersonalityAnalysis, generateAIItineraryStandalone, aiChat, getRecommendations, getPackingSuggestions,
  getCityWeather, getCityForecast, getBestMonths,
  getAdminStats,
} from "../controllers/aiController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = Router();

// AI
router.post("/personality", protect, getPersonalityAnalysis);
router.post("/generate-itinerary", protect, generateAIItineraryStandalone);
router.post("/chat", protect, aiChat);
router.get("/recommendations", protect, getRecommendations);
router.get("/packing-suggestions", protect, getPackingSuggestions);

// Weather
router.get("/weather/:city", getCityWeather);
router.get("/weather/:city/forecast", getCityForecast);
router.get("/weather/:city/best-months", getBestMonths);

// Admin (protected, admin only)
router.get("/admin/stats", protect, adminOnly, getAdminStats);

export default router;
