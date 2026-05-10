/**
 * naturalLanguageParser.js
 *
 * Lightweight rule-based NLP parser.
 * Extracts: destination, budget, duration, mood, travelers, travel style
 * from free-text prompts — zero external API dependency.
 */

// ── Known destinations (name → dataset key) ────────────────
const DESTINATION_MAP = {
  // International
  japan: "TOKYO", tokyo: "TOKYO", kyoto: "KYOTO", osaka: "OSAKA",
  bali: "BALI", indonesia: "BALI",
  thailand: "BANGKOK", bangkok: "BANGKOK",
  paris: "PARIS", france: "PARIS", europe: "PARIS",
  dubai: "DUBAI", uae: "DUBAI",
  // Indian
  goa: "GOA",
  manali: "MANALI", himachal: "MANALI", "himachal pradesh": "MANALI",
  kerala: "KERALA", munnar: "KERALA", alleppey: "KERALA",
  jaipur: "RAJASTHAN", rajasthan: "RAJASTHAN", udaipur: "RAJASTHAN",
  rishikesh: "RISHIKESH", uttarakhand: "RISHIKESH",
  ahmedabad: "AHMEDABAD", gujarat: "AHMEDABAD",
  mumbai: "MUMBAI", bombay: "MUMBAI",
  delhi: "DELHI", "new delhi": "DELHI",
  bangalore: "BANGALORE", bengaluru: "BANGALORE",
  coorg: "COORG", kodagu: "COORG",
  ooty: "OOTY", "ooty tamil": "OOTY",
  ladakh: "LADAKH", leh: "LADAKH",
  darjeeling: "DARJEELING", sikkim: "DARJEELING",
  andaman: "ANDAMAN", "port blair": "ANDAMAN",
};

// ── Mood keyword map ───────────────────────────────────────
const MOOD_MAP = [
  { keywords: ["peace", "peaceful", "calm", "slow", "quiet", "relax", "relaxing", "chill", "rest", "unwind"], mood: "Relax" },
  { keywords: ["adventure", "adrenaline", "thrill", "extreme", "exciting", "rush", "trek", "trekking", "hike", "hiking", "rafting", "skydive"], mood: "Adventure Rush" },
  { keywords: ["nature", "forest", "mountain", "hills", "detox", "green", "wildlife", "waterfall", "offbeat", "off-beat", "organic"], mood: "Nature Detox" },
  { keywords: ["romantic", "romance", "couple", "honeymoon", "anniversary", "love", "partner", "wife", "husband", "girlfriend", "boyfriend"], mood: "Romantic Escape" },
  { keywords: ["friends", "friend", "group", "gang", "squad", "social", "party", "nightlife", "pub", "bar", "festival", "fun"], mood: "Social Trip" },
  { keywords: ["burnout", "stress", "burn out", "heal", "healing", "recover", "recovery", "mental", "digital detox", "break"], mood: "Burnout Recovery" },
];

// ── Travel style keyword map ───────────────────────────────
const STYLE_MAP = [
  { keywords: ["solo", "alone", "myself", "me myself", "single"], style: "Solo Adventure" },
  { keywords: ["couple", "romantic", "honeymoon", "partner", "wife", "husband", "girlfriend", "boyfriend", "anniversary"], style: "Couple Trip" },
  { keywords: ["family", "kids", "children", "parents", "parents", "siblings"], style: "Family Trip" },
  { keywords: ["friends", "friend", "group", "gang", "squad"], style: "Friend Group" },
  { keywords: ["backpack", "backpacking", "budget travel", "hostel", "cheap"], style: "Backpacking" },
  { keywords: ["work", "business", "conference", "meeting", "collab"], style: "Work/Collab" },
];

// ── Duration keyword map ───────────────────────────────────
const DURATION_MAP = [
  { pattern: /(\d+)\s*-?\s*day/i,          extract: (m) => ({ days: parseInt(m[1]) }) },
  { pattern: /(\d+)\s*-?\s*night/i,        extract: (m) => ({ days: parseInt(m[1]) + 1 }) },
  { pattern: /(\d+)\s*-?\s*week/i,         extract: (m) => ({ days: parseInt(m[1]) * 7 }) },
  { pattern: /weekend|2\s*day/i,           extract: () => ({ days: 2 }) },
  { pattern: /long\s*weekend|3\s*day/i,    extract: () => ({ days: 3 }) },
  { pattern: /week(?!end)/i,               extract: () => ({ days: 7 }) },
  { pattern: /fortnight|two\s*week/i,      extract: () => ({ days: 14 }) },
  { pattern: /quick|short|micro/i,         extract: () => ({ days: 2 }) },
];

// ── Budget keyword extractor ───────────────────────────────
function parseBudget(text) {
  const lower = text.toLowerCase();

  // Explicit numbers: ₹50000, 50k, 2 lakh, 2.5L
  let m;

  m = text.match(/₹?\s*(\d+(?:\.\d+)?)\s*(?:l|lakh|lac)/i);
  if (m) return Math.round(parseFloat(m[1]) * 100000);

  m = text.match(/₹?\s*(\d+(?:\.\d+)?)\s*k/i);
  if (m) return Math.round(parseFloat(m[1]) * 1000);

  m = text.match(/₹\s*(\d{3,7})/);
  if (m) return parseInt(m[1]);

  m = text.match(/(\d{4,7})\s*(?:rupee|inr|rs)/i);
  if (m) return parseInt(m[1]);

  // Budget category words → estimated totals
  if (/\bvery cheap\b|\bmicro\b|\bsuper cheap\b/.test(lower)) return 2000;
  if (/\bcheap\b|\blow budget\b|\bbudget trip\b|\bshoestring\b/.test(lower)) return 8000;
  if (/\bmoderate\b|\breasonable\b|\bmid\b/.test(lower)) return 30000;
  if (/\bluxury\b|\bpremium\b|\bexpensive\b|\brich\b/.test(lower)) return 250000;

  return null; // unknown
}

// ── Traveler count extractor ───────────────────────────────
function parseTravelers(text) {
  let m;
  m = text.match(/(\d+)\s*(?:people|person|traveler|traveller|pax|adult|friend)/i);
  if (m) return parseInt(m[1]);
  if (/\bsolo\b|\bjust me\b|\balone\b/.test(text.toLowerCase())) return 1;
  if (/\bcouple\b|\btwo of us\b|\bboth of us\b/.test(text.toLowerCase())) return 2;
  if (/\bfamily\b/.test(text.toLowerCase())) return 4;
  if (/\bgroup\b|\bfriends\b/.test(text.toLowerCase())) return 5;
  return null;
}

// ── Destination extractor ──────────────────────────────────
function parseDestination(text) {
  const lower = text.toLowerCase();
  // Sort by length descending so multi-word matches win
  const entries = Object.entries(DESTINATION_MAP).sort((a, b) => b[0].length - a[0].length);
  for (const [keyword, destKey] of entries) {
    if (lower.includes(keyword)) return destKey;
  }
  return null;
}

// ── Mood extractor ─────────────────────────────────────────
function parseMood(text) {
  const lower = text.toLowerCase();
  for (const { keywords, mood } of MOOD_MAP) {
    if (keywords.some(k => lower.includes(k))) return mood;
  }
  return null;
}

// ── Travel style extractor ─────────────────────────────────
function parseTravelStyle(text) {
  const lower = text.toLowerCase();
  for (const { keywords, style } of STYLE_MAP) {
    if (keywords.some(k => lower.includes(k))) return style;
  }
  return null;
}

// ── Duration extractor ─────────────────────────────────────
function parseDuration(text) {
  for (const { pattern, extract } of DURATION_MAP) {
    const m = text.match(pattern);
    if (m) return extract(m).days;
  }
  return null;
}

// ── MAIN EXPORT ────────────────────────────────────────────
/**
 * parse(prompt) → structured intent object
 */
export function parse(prompt) {
  if (!prompt || typeof prompt !== "string") return {};

  const text = prompt.trim();

  const destKey     = parseDestination(text);
  const budget      = parseBudget(text);
  const days        = parseDuration(text);
  const mood        = parseMood(text);
  const travelStyle = parseTravelStyle(text);
  const travelers   = parseTravelers(text);

  // Derive start/end dates (today + duration)
  let start_date = null, end_date = null;
  if (days) {
    const start = new Date();
    start.setDate(start.getDate() + 14); // plan 2 weeks from now
    const end = new Date(start);
    end.setDate(end.getDate() + days - 1);
    start_date = start.toISOString().split("T")[0];
    end_date   = end.toISOString().split("T")[0];
  }

  return {
    destinationKey: destKey,
    destinations:   destKey ? [destKey.charAt(0) + destKey.slice(1).toLowerCase()] : [],
    budget:         budget   || null,
    days:           days     || null,
    mood:           mood     || null,
    travel_type:    travelStyle || null,
    travelers:      travelers || null,
    start_date,
    end_date,
    raw: text,
    confidence: _confidence({ destKey, budget, days, mood, travelStyle, travelers }),
  };
}

function _confidence(parts) {
  const filled = Object.values(parts).filter(Boolean).length;
  return Math.round((filled / Object.keys(parts).length) * 100);
}

export default { parse };
