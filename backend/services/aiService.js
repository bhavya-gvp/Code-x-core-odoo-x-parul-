import dotenv from "dotenv";
dotenv.config();

// ============================================================
// Gemini API Client
// ============================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * Call the Gemini API with a prompt
 * @param {string} prompt - The full prompt to send
 * @param {number} maxTokens - Max output tokens
 * @returns {string} AI response text
 */
async function callGemini(prompt, maxTokens = 800) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not set in .env");
  }

  const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.85,
        maxOutputTokens: maxTokens,
        topP: 0.95,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || `Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty Gemini response");
  return text;
}

// ============================================================
// SYSTEM PROMPT — Loopi's personality
// ============================================================
const LOOPI_SYSTEM = `You are Loopi, a witty and intelligent AI travel companion for Traveloop AI — a premium travel planning platform.

Your personality:
- Knowledgeable but conversational, never robotic
- Use relevant emojis naturally (don't overdo it)
- Give specific, actionable advice — not generic tips
- Format responses with **bold** for key points and bullet lists for clarity
- Keep responses concise (under 200 words) unless asked for detail
- Always be enthusiastic about travel

Your capabilities:
- Plan detailed day-by-day itineraries
- Optimize travel budgets with real cost estimates (in INR by default)
- Recommend accommodation for all budgets
- Suggest authentic local food experiences
- Advise on best travel seasons and weather
- Provide packing lists tailored to destinations
- Share hidden gems and off-the-beaten-path spots

Always respond as Loopi. Never break character. Never say you are an AI made by Google.`;

// ============================================================
// Travel Personality Analyzer
// ============================================================
const PERSONALITY_TRAITS = {
  Backpacker: { emoji: "🎒", description: "You thrive on authenticity, local hostels, street food, and off-the-beaten-path adventures.", traits: ["Budget-savvy", "Spontaneous", "Local-first", "Adventurous", "Minimalist"], color: "#f59e0b" },
  "Luxury Explorer": { emoji: "🥂", description: "You believe travel should be indulgent. Premium hotels, fine dining, and curated experiences are your baseline.", traits: ["Comfort-first", "Exclusive", "Gourmet", "Spa lover", "Business class"], color: "#a855f7" },
  "Creator Traveler": { emoji: "📸", description: "Every destination is a content opportunity. You plan shoots, scout golden hour spots, and build viral stories.", traits: ["Content creator", "Visual storyteller", "Trend-aware", "Reels expert", "Influencer"], color: "#06b6d4" },
  "Solo Explorer": { emoji: "🦋", description: "Freedom is your compass. You make decisions on the fly and find beautiful connections when alone.", traits: ["Independent", "Introspective", "Flexible", "Self-reliant", "Empowered"], color: "#6366f1" },
  "Adventure Seeker": { emoji: "🏔️", description: "Mountains, oceans, deserts — you chase the adrenaline. Bungee jumping before breakfast is your vibe.", traits: ["Thrill-seeker", "Physical", "Outdoorsy", "Risk-taker", "Survivalist"], color: "#ef4444" },
  "Romantic Planner": { emoji: "💕", description: "Sunsets, candlelit dinners, and surprise moments — you curate experiences for the one you love.", traits: ["Thoughtful", "Detail-oriented", "Emotional", "Couple-first", "Surprise expert"], color: "#ec4899" },
  "Spiritual Traveler": { emoji: "🌸", description: "Temples, meditations, ancient cultures — you travel to find meaning.", traits: ["Mindful", "Cultural depth", "Yoga lover", "Pilgrimage", "Healing focus"], color: "#22c55e" },
};

export const analyzePersonality = async (answers) => {
  // Score locally first for fast response
  const scores = Object.fromEntries(Object.keys(PERSONALITY_TRAITS).map((k) => [k, 0]));
  if (answers.accommodation === "hostel") scores["Backpacker"] += 3;
  if (answers.accommodation === "luxury_hotel") scores["Luxury Explorer"] += 3;
  if (answers.budget === "backpacking") scores["Backpacker"] += 2;
  if (answers.budget === "luxury") scores["Luxury Explorer"] += 2;
  if (answers.activity === "photography") scores["Creator Traveler"] += 3;
  if (answers.activity === "hiking") scores["Adventure Seeker"] += 3;
  if (answers.activity === "temples") scores["Spiritual Traveler"] += 3;
  if (answers.activity === "romance") scores["Romantic Planner"] += 3;
  if (answers.companion === "solo") scores["Solo Explorer"] += 3;
  if (answers.companion === "partner") scores["Romantic Planner"] += 2;

  const winner = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];

  // If Gemini available, enrich the description
  let description = PERSONALITY_TRAITS[winner].description;
  if (GEMINI_API_KEY) {
    try {
      const prompt = `${LOOPI_SYSTEM}\n\nA traveler took a personality quiz. Based on their answers: ${JSON.stringify(answers)}, they are a "${winner}" type traveler. Write a 2-sentence personalized description of their travel style. Be specific and inspiring.`;
      description = await callGemini(prompt, 100);
    } catch {
      // Fallback to static description
    }
  }

  return {
    type: winner,
    emoji: PERSONALITY_TRAITS[winner].emoji,
    description,
    traits: PERSONALITY_TRAITS[winner].traits,
    color: PERSONALITY_TRAITS[winner].color,
    confidence: Math.min(95, 60 + scores[winner] * 5),
    ai_generated: !!GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  };
};

// ============================================================
// AI Itinerary Generator
// ============================================================
export const generateItinerary = async (tripData) => {
  const { destinations, startDate, endDate, mood, budget, travelType } = tripData;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  let itineraryText = null;
  if (GEMINI_API_KEY && destinations?.length) {
    try {
      const prompt = `${LOOPI_SYSTEM}\n\nCreate a detailed ${totalDays}-day travel itinerary for: ${destinations.join(", ")}.\n\nTrip details:\n- Travel mood: ${mood || "balanced"}\n- Total budget: ₹${budget || 100000}\n- Travel style: ${travelType || "mixed"}\n- Start: ${startDate}, End: ${endDate}\n\nFor each day provide:\n1. City name\n2. 3-4 activities with times, costs in INR, and category\n3. One dining recommendation\n\nFormat as structured JSON with this shape:\n{ "days": [ { "dayNumber": 1, "cityName": "Tokyo", "activities": [ { "activityName": "...", "category": "Cultural", "startTime": "09:00", "cost": 0, "emoji": "⛩️", "durationMinutes": 120 } ] } ] }`;

      const text = await callGemini(prompt, 1500);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) itineraryText = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.warn("Gemini itinerary generation failed, using template:", e.message);
    }
  }

  if (itineraryText?.days) {
    const days = itineraryText.days.map((d, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return { ...d, dayNumber: i + 1, date: date.toISOString().split("T")[0] };
    });
    return { days, totalDays, aiGenerated: true };
  }

  // Fallback template
  const TEMPLATES = {
    "Adventure Rush": [
      { activityName: "Morning hike to viewpoint", category: "Adventure", cost: 500, emoji: "🏔️", durationMinutes: 180, startTime: "06:00" },
      { activityName: "Local market & street food", category: "Food", cost: 400, emoji: "🍜", durationMinutes: 90, startTime: "12:00" },
      { activityName: "Kayaking/water sport", category: "Adventure", cost: 2000, emoji: "🚣", durationMinutes: 120, startTime: "15:00" },
    ],
    default: [
      { activityName: "Morning sightseeing", category: "Museum", cost: 500, emoji: "🏛️", durationMinutes: 120, startTime: "09:00" },
      { activityName: "Local food experience", category: "Food", cost: 600, emoji: "🍽️", durationMinutes: 90, startTime: "13:00" },
      { activityName: "Sunset viewpoint", category: "Nature", cost: 0, emoji: "🌅", durationMinutes: 60, startTime: "18:00" },
    ],
  };

  const template = TEMPLATES[mood] || TEMPLATES.default;
  const days = [];
  for (let i = 0; i < Math.min(totalDays, 10); i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const cityIdx = Math.floor(i / Math.max(1, totalDays / Math.max(destinations?.length || 1, 1)));
    days.push({
      dayNumber: i + 1,
      date: date.toISOString().split("T")[0],
      cityName: destinations?.[Math.min(cityIdx, (destinations?.length || 1) - 1)] || "Your Destination",
      activities: template.map((t, j) => ({ ...t, sortOrder: j })),
      aiGenerated: false,
    });
  }
  return { days, totalDays, aiGenerated: false };
};

// ============================================================
// AI Chat Response — Gemini-powered
// ============================================================
export const getChatResponse = async (message, context = {}) => {
  let content = "";
  let aiPowered = false;

  if (GEMINI_API_KEY) {
    try {
      const contextStr = Object.keys(context).length
        ? `\n\nUser's current trip context: ${JSON.stringify(context)}`
        : "";
      const prompt = `${LOOPI_SYSTEM}${contextStr}\n\nUser: ${message}\n\nLoopi:`;
      content = await callGemini(prompt, 600);
      aiPowered = true;
    } catch (e) {
      console.warn("Gemini chat failed:", e.message);
      content = getFallbackResponse(message);
    }
  } else {
    content = getFallbackResponse(message);
  }

  return {
    role: "assistant",
    content,
    timestamp: new Date().toISOString(),
    ai_powered: aiPowered,
  };
};

function getFallbackResponse(message) {
  const msg = message.toLowerCase();
  if (msg.includes("budget") || msg.includes("money")) return "💰 Smart budgeting tips:\n\n• Book flights 8–12 weeks early — save up to 30%\n• Use transit day passes vs taxis\n• Mix restaurant meals with street food\n• Pre-book attractions for 15–20% off\n\nWant a full budget breakdown for your destination?";
  if (msg.includes("weather") || msg.includes("climate") || msg.includes("best time")) return "🌤️ Best travel timing depends on your destination! Generally:\n\n• **Japan**: March–April (cherry blossoms) or Oct–Nov (foliage)\n• **Bali**: May–September (dry season)\n• **Europe**: April–June or September–October\n• **Iceland**: June–August (midnight sun) or Jan–Feb (northern lights)\n\nWhich destination are you planning?";
  if (msg.includes("pack") || msg.includes("luggage")) return "🎒 Universal packing essentials:\n\n• Comfortable walking shoes (you'll walk 15k+ steps/day)\n• Lightweight layers for temperature changes\n• Universal power adapter\n• Portable charger / power bank\n• Copies of all documents\n• Cash in local currency\n• Prescription meds + doctor's note\n\nTell me your destination for a customized list!";
  return "✨ I'm Loopi, your AI travel companion!\n\nI can help with:\n🗺️ **Itinerary planning** — day-by-day schedules\n💰 **Budget optimization** — save more, experience more\n🌤️ **Travel timing** — when to go where\n🍜 **Food guides** — eat like a local\n🏨 **Accommodation** — best value stays\n\nWhat's your next adventure?";
}
