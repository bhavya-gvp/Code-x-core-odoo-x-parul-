import asyncHandler from "express-async-handler";
import { analyzePersonality, generateItinerary, getChatResponse } from "../services/aiService.js";
import { getCurrentWeather, getForecast, getBestTravelMonths } from "../services/weatherService.js";
import pool from "../config/db.js";

// ============================================================
// AI ENDPOINTS
// ============================================================

// @route   POST /api/ai/personality
export const getPersonalityAnalysis = asyncHandler(async (req, res) => {
  const result = await analyzePersonality(req.body.answers || {});

  // Save personality to user profile
  await pool.execute(
    "UPDATE users SET travel_personality = ? WHERE id = ?",
    [result.type, req.user.id]
  );

  res.json({ success: true, data: result });
});

// @route   POST /api/ai/generate-itinerary
export const generateAIItineraryStandalone = asyncHandler(async (req, res) => {
  const result = await generateItinerary(req.body);
  res.json({ success: true, data: result });
});

// @route   POST /api/ai/chat
export const aiChat = asyncHandler(async (req, res) => {
  const { message, context } = req.body;
  if (!message) return res.status(400).json({ success: false, message: "Message is required." });

  const response = await getChatResponse(message, context || {});
  res.json({ success: true, data: response });
});

// @route   GET /api/ai/recommendations
export const getRecommendations = asyncHandler(async (req, res) => {
  const { destination, mood, budget } = req.query;

  // TODO: Integrate Gemini for real recommendations
  const recommendations = {
    destination: destination || "Japan",
    mood: mood || "Adventure",
    suggested_activities: [
      { name: "Arashiyama Bamboo Grove", category: "Nature", rating: 4.9, cost: 0, emoji: "🎋" },
      { name: "teamLab Planets", category: "Art", rating: 4.9, cost: 4500, emoji: "🎨" },
      { name: "Fushimi Inari", category: "Cultural", rating: 5.0, cost: 0, emoji: "⛩️" },
      { name: "Shibuya Sky", category: "Sightseeing", rating: 4.8, cost: 3500, emoji: "🌆" },
    ],
    suggested_stays: [
      { name: "Hotel Gracery Shinjuku", rating: 4.7, price_per_night: 8500, stars: 3 },
      { name: "The Ritz-Carlton Tokyo", rating: 4.9, price_per_night: 45000, stars: 5 },
    ],
    travel_tips: [
      "Get a Suica card for seamless transport across Tokyo",
      "Book Arashiyama before 7am for crowds-free experience",
      "April cherry blossom season books 3+ months in advance",
    ],
    ai_generated: true,
  };

  res.json({ success: true, data: recommendations });
});

// @route   GET /api/ai/packing-suggestions
export const getPackingSuggestions = asyncHandler(async (req, res) => {
  const { destination, duration, months, travel_type } = req.query;

  const suggestions = {
    Clothing: [
      "Light layers (temperature varies significantly between morning and evening)",
      "Comfortable walking shoes — you'll walk 15,000+ steps daily",
      "Formal attire for ryokan dinners",
      "Rain jacket / compact umbrella",
    ],
    Electronics: [
      "Universal power adapter (Japan: Type A)",
      "Portable charger / power bank",
      "Camera with extra batteries",
      "Noise-canceling headphones for long flights",
    ],
    Documents: [
      "Passport + 2 photocopies",
      "Travel insurance documents",
      "Hotel booking confirmations (printed)",
      "Japan Rail Pass (if applicable)",
      "IC Suica card setup info",
    ],
    Essentials: [
      "Cash in local currency (¥50,000 recommended)",
      "Prescription medications + doctor's note",
      "Sunscreen SPF50+",
      "Small first-aid kit",
    ],
  };

  res.json({
    success: true,
    data: {
      destination: destination || "Japan",
      duration: duration || "10 days",
      suggestions,
      ai_generated: true,
    },
  });
});

// ============================================================
// WEATHER ENDPOINTS
// ============================================================

// @route   GET /api/weather/:city
export const getCityWeather = asyncHandler(async (req, res) => {
  const { city } = req.params;
  const { country } = req.query;
  const weather = await getCurrentWeather(city, country);
  res.json({ success: true, data: weather });
});

// @route   GET /api/weather/:city/forecast
export const getCityForecast = asyncHandler(async (req, res) => {
  const weather = await getForecast(req.params.city);
  res.json({ success: true, data: weather });
});

// @route   GET /api/weather/:city/best-months
export const getBestMonths = asyncHandler(async (req, res) => {
  const info = getBestTravelMonths(req.params.city);
  res.json({ success: true, data: info });
});

// ============================================================
// ADMIN ANALYTICS
// ============================================================

// @route   GET /api/admin/stats
export const getAdminStats = asyncHandler(async (req, res) => {
  const [[userStats], [tripStats], [communityStats]] = await Promise.all([
    pool.execute(`
      SELECT
        COUNT(*) AS total_users,
        SUM(is_verified = 1) AS verified_users,
        SUM(role = 'admin') AS admin_count,
        COUNT(CASE WHEN created_at > DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) AS new_this_month
      FROM users
    `),
    pool.execute(`
      SELECT
        COUNT(*) AS total_trips,
        SUM(status = 'ongoing') AS active_trips,
        SUM(status = 'completed') AS completed_trips,
        SUM(visibility = 'public') AS public_trips,
        AVG(budget) AS avg_budget
      FROM trips
    `),
    pool.execute(`
      SELECT
        COUNT(*) AS total_posts,
        SUM(likes_count) AS total_likes,
        AVG(likes_count) AS avg_likes_per_post
      FROM community_posts
    `),
  ]);

  const [popularDestinations] = await pool.execute(`
    SELECT tc.city_name, tc.country, COUNT(*) AS trip_count
    FROM trip_cities tc
    GROUP BY tc.city_name, tc.country
    ORDER BY trip_count DESC
    LIMIT 10
  `);

  const [personalityDist] = await pool.execute(`
    SELECT travel_personality, COUNT(*) AS count
    FROM users
    WHERE travel_personality IS NOT NULL
    GROUP BY travel_personality
    ORDER BY count DESC
  `);

  res.json({
    success: true,
    data: {
      users: userStats[0],
      trips: tripStats[0],
      community: communityStats[0],
      popular_destinations: popularDestinations,
      personality_distribution: personalityDist,
      generated_at: new Date().toISOString(),
    },
  });
});
