/**
 * packingEngine.js — Rule-Based Packing Recommendation Engine
 *
 * Generates a personalized packing list using a multi-factor rule matrix:
 *  1. Destination climate zone
 *  2. Trip duration
 *  3. Activities planned
 *  4. Travel personality type
 *  5. Travel group type (solo, couple, family)
 *
 * Output: categorized packing list with priority scores and reasons
 *
 * No external API. Pure rule-based logic.
 */

import { CLIMATE_ZONES, TRAVEL_PERSONALITIES } from "../config/constants.js";

// Base rules — always packed regardless of destination
const BASE_RULES = [
  { item: "Passport / ID",         category: "Documents",   priority: 10, reason: "Always required" },
  { item: "Travel Insurance docs", category: "Documents",   priority: 10, reason: "Essential for any trip" },
  { item: "Flight tickets / e-visa", category: "Documents", priority: 10, reason: "Print and digital copies" },
  { item: "Debit/Credit cards",    category: "Essentials",  priority: 10, reason: "Backup payment methods" },
  { item: "Phone charger",         category: "Electronics", priority: 9,  reason: "Never leave without it" },
  { item: "Power bank (20,000mAh)", category: "Electronics", priority: 8, reason: "Long travel days drain battery" },
  { item: "Universal adapter",     category: "Electronics", priority: 7,  reason: "Check destination voltage" },
  { item: "Medications (prescription)", category: "Medical", priority: 10, reason: "Doctor's note recommended" },
  { item: "First aid kit",         category: "Medical",     priority: 7,  reason: "Cuts, blisters, headaches" },
  { item: "Reusable water bottle", category: "Essentials",  priority: 8,  reason: "Hydration + eco-friendly" },
  { item: "Travel pillow",         category: "Essentials",  priority: 5,  reason: "For long flights/trains" },
  { item: "Earphones / AirPods",   category: "Electronics", priority: 7,  reason: "Entertainment + noise cancelling" },
];

// Climate-specific rules
const CLIMATE_RULES = {
  TROPICAL: [
    { item: "Sunscreen SPF 50+",     category: "Essentials",  priority: 9, reason: "UV index is extreme" },
    { item: "Insect repellent",      category: "Essentials",  priority: 9, reason: "Mosquitoes are prevalent" },
    { item: "Lightweight clothing",  category: "Clothing",    priority: 8, reason: "Linen/cotton for heat" },
    { item: "Swimwear (2 sets)",     category: "Clothing",    priority: 8, reason: "Beaches, pools, waterfalls" },
    { item: "Flip flops",            category: "Clothing",    priority: 7, reason: "Coastal terrain" },
    { item: "Waterproof bag",        category: "Essentials",  priority: 6, reason: "Humidity and water activities" },
    { item: "After-sun lotion",      category: "Toiletries",  priority: 6, reason: "Soothe sun exposure" },
    { item: "Rain poncho",           category: "Clothing",    priority: 5, reason: "Sudden tropical showers" },
  ],
  COLD: [
    { item: "Thermal base layer (2x)", category: "Clothing",  priority: 10, reason: "Critical for sub-zero temps" },
    { item: "Insulated jacket",      category: "Clothing",    priority: 10, reason: "Windproof and waterproof" },
    { item: "Woolen gloves",         category: "Clothing",    priority: 8,  reason: "Frostbite prevention" },
    { item: "Thermal socks (3 pairs)", category: "Clothing",  priority: 8,  reason: "Keeps extremities warm" },
    { item: "Balaclava / neck gaiter", category: "Clothing",  priority: 7,  reason: "Face coverage in wind" },
    { item: "Hand warmers",          category: "Essentials",  priority: 6,  reason: "Disposable backup heat" },
    { item: "Lip balm (SPF)",        category: "Toiletries",  priority: 6,  reason: "Cold air chaps lips fast" },
    { item: "Snow boots (waterproof)", category: "Clothing",  priority: 9,  reason: "For icy/snowy terrain" },
  ],
  DESERT: [
    { item: "Loose long sleeves",    category: "Clothing",    priority: 9, reason: "Sun protection + modesty" },
    { item: "Wide brim hat",         category: "Clothing",    priority: 9, reason: "Essential sun protection" },
    { item: "Sunscreen SPF 50+",     category: "Essentials",  priority: 9, reason: "Intense UV radiation" },
    { item: "Electrolyte sachets",   category: "Medical",     priority: 8, reason: "Dehydration prevention" },
    { item: "Sand-proof bag",        category: "Essentials",  priority: 6, reason: "Protects electronics" },
    { item: "Scarf / keffiyeh",      category: "Clothing",    priority: 7, reason: "Sand storms + modesty" },
  ],
  MOUNTAIN: [
    { item: "Trekking poles",        category: "Adventure Gear", priority: 8, reason: "Joint support on steep terrain" },
    { item: "Hiking boots (broken in)", category: "Clothing", priority: 10, reason: "Never use new boots on trek" },
    { item: "Altitude sickness meds (Diamox)", category: "Medical", priority: 8, reason: "Consult doctor before" },
    { item: "Energy bars / trail mix", category: "Essentials", priority: 7, reason: "Emergency high-calorie food" },
    { item: "Headlamp",              category: "Adventure Gear", priority: 7, reason: "Early morning starts" },
    { item: "Waterproof backpack cover", category: "Adventure Gear", priority: 6, reason: "Mountain rain is unpredictable" },
  ],
  MONSOON: [
    { item: "Compact umbrella",      category: "Essentials",  priority: 9, reason: "Daily rain guaranteed" },
    { item: "Waterproof sandals",    category: "Clothing",    priority: 8, reason: "Wet streets all day" },
    { item: "Dry bag for electronics", category: "Electronics", priority: 9, reason: "Protect from rain" },
    { item: "Anti-fungal powder",    category: "Medical",     priority: 6, reason: "Prevent humidity-related issues" },
    { item: "Quick-dry clothing",    category: "Clothing",    priority: 8, reason: "Clothes dry faster in humidity" },
  ],
  TEMPERATE: [
    { item: "Light jacket / hoodie", category: "Clothing",    priority: 7, reason: "Morning/evening chill" },
    { item: "Comfortable walking shoes", category: "Clothing", priority: 9, reason: "Expect 15,000+ steps/day" },
    { item: "Layer-able clothing",   category: "Clothing",    priority: 7, reason: "Temperature swings" },
  ],
};

// Activity-specific rules
const ACTIVITY_RULES = {
  Adventure: [
    { item: "GoPro / action camera",  category: "Electronics", priority: 7, reason: "Capture adventure moments" },
    { item: "Dry bag",                category: "Adventure Gear", priority: 8, reason: "Water activity protection" },
    { item: "Waterproof watch",       category: "Electronics", priority: 5, reason: "Dive/water resistance" },
  ],
  Photography: [
    { item: "Camera + extra batteries", category: "Electronics", priority: 9, reason: "Primary content tool" },
    { item: "Tripod (mini)",          category: "Electronics", priority: 7, reason: "Low light shots" },
    { item: "Extra memory cards",     category: "Electronics", priority: 8, reason: "Never miss a shot" },
    { item: "ND filters",             category: "Electronics", priority: 5, reason: "Waterfalls, bright scenes" },
  ],
  "Local Experience": [
    { item: "Small local currency",   category: "Essentials",  priority: 8, reason: "Street food markets are cash-only" },
    { item: "Translation app offline", category: "Electronics", priority: 7, reason: "Communicate without internet" },
  ],
  Spiritual: [
    { item: "Modest clothing (2 sets)", category: "Clothing",  priority: 9, reason: "Required at temples/mosques" },
    { item: "Shawl / sarong",         category: "Clothing",    priority: 8, reason: "Shoulder cover at sacred sites" },
  ],
  Beach: [
    { item: "Reef-safe sunscreen",    category: "Essentials",  priority: 9, reason: "Protect marine ecosystems" },
    { item: "Waterproof phone pouch", category: "Electronics", priority: 8, reason: "Beach photography" },
    { item: "Rash guard",             category: "Clothing",    priority: 6, reason: "Extended sun exposure" },
  ],
};

// Personality-specific additions
const PERSONALITY_RULES = {
  "Creator Traveler": [
    { item: "Ring light (portable)", category: "Electronics", priority: 7, reason: "Content creation anywhere" },
    { item: "Laptop / tablet",       category: "Electronics", priority: 8, reason: "Editing on the go" },
    { item: "HDMI adapter",          category: "Electronics", priority: 5, reason: "Connect to screens" },
  ],
  Backpacker: [
    { item: "Padlock (combination)", category: "Essentials",  priority: 8, reason: "Hostel locker security" },
    { item: "Sleeping bag liner",    category: "Essentials",  priority: 6, reason: "Cleanliness in shared dorms" },
    { item: "Quick-dry travel towel", category: "Essentials", priority: 7, reason: "Hostels often charge for towels" },
  ],
  "Luxury Explorer": [
    { item: "Formal outfit (1 set)", category: "Clothing",    priority: 7, reason: "Fine dining / events" },
    { item: "Laundry bag",           category: "Essentials",  priority: 5, reason: "Separate clean/dirty clothes" },
  ],
  "Adventure Seeker": [
    { item: "Satellite communicator (spot)", category: "Electronics", priority: 6, reason: "Remote area safety" },
    { item: "Emergency whistle",     category: "Adventure Gear", priority: 7, reason: "Distress signal tool" },
    { item: "Water purification tablets", category: "Medical", priority: 7, reason: "Remote water sources" },
  ],
};

/**
 * Generate packing list
 *
 * @param {object} params
 * @param {string} params.destination — City or country name
 * @param {number} params.durationDays — Trip length
 * @param {string[]} params.activityCategories — Unique activity types planned
 * @param {string} [params.personality] — Travel personality type
 * @param {string} [params.companion] — "solo" | "couple" | "family" | "group"
 * @returns {object} Packing list with categories and items
 */
export function generatePackingList({ destination, durationDays, activityCategories = [], personality, companion }) {
  const allItems = new Map(); // key: item name → avoid duplicates

  const addItem = (item) => {
    if (!allItems.has(item.item)) {
      allItems.set(item.item, item);
    }
  };

  // 1. Base rules
  BASE_RULES.forEach(addItem);

  // 2. Climate rules
  const zone = detectClimateZone(destination);
  (CLIMATE_RULES[zone] || CLIMATE_RULES.TEMPERATE).forEach(addItem);

  // 3. Duration-based clothing quantities
  const clothingCount = Math.min(durationDays, 7);
  addItem({ item: `T-shirts / tops (${clothingCount})`, category: "Clothing", priority: 8, reason: `${durationDays} day trip — plan to do 1 laundry` });
  addItem({ item: `Underwear (${clothingCount + 1})`,    category: "Clothing", priority: 9, reason: "One extra always useful" });
  addItem({ item: `Socks (${clothingCount})`,            category: "Clothing", priority: 8, reason: "Clean feet = happy traveler" });

  // 4. Activity rules
  for (const category of activityCategories) {
    const rules = ACTIVITY_RULES[category];
    if (rules) rules.forEach(addItem);
  }

  // 5. Personality rules
  if (personality && PERSONALITY_RULES[personality]) {
    PERSONALITY_RULES[personality].forEach(addItem);
  }

  // 6. Companion rules
  if (companion === "family") {
    addItem({ item: "Kids medications", category: "Medical", priority: 9, reason: "Children's dosage formulations" });
    addItem({ item: "Snacks for kids",  category: "Essentials", priority: 7, reason: "Travel hunger meltdowns" });
  }

  // ── Organize into categories ───────────────────────────
  const items = Array.from(allItems.values()).sort((a, b) => b.priority - a.priority);

  const categories = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push({ name: item.item, priority: item.priority, reason: item.reason, packed: false });
    return acc;
  }, {});

  const categoryList = Object.entries(categories)
    .map(([category, items]) => ({ category, items, count: items.length }))
    .sort((a, b) => {
      const order = ["Documents", "Medical", "Essentials", "Electronics", "Clothing", "Toiletries", "Adventure Gear", "Other"];
      return order.indexOf(a.category) - order.indexOf(b.category);
    });

  return {
    destination,
    climateZone: zone,
    durationDays,
    totalItems: items.length,
    categories: categoryList,
    essentialCount: items.filter((i) => i.priority >= 9).length,
    generatedAt: new Date().toISOString(),
  };
}

function detectClimateZone(destination) {
  if (!destination) return "TEMPERATE";
  const dest = destination.toLowerCase();
  for (const [zone, places] of Object.entries(CLIMATE_ZONES)) {
    if (places.some((p) => dest.includes(p.toLowerCase()))) return zone;
  }
  return "TEMPERATE";
}

export default { generatePackingList };
