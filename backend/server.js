/**
 * ============================================================
 * Traveloop AI — Express.js Backend Server (v2)
 *
 * Architecture: Controller → Service → Repository
 * Security:     Helmet, CORS, Rate Limiting, Request IDs
 * Observability: Structured Winston logger, Morgan HTTP logs
 * Performance:  Compression, connection pooling, async handlers
 * ============================================================
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";

// ── Config & Utilities ────────────────────────────────────
import { testConnection } from "./config/db.js";
import logger from "./utils/logger.js";
import { ApiResponse } from "./utils/ApiResponse.js";
import { AppError } from "./utils/AppError.js";
import { RATE_LIMIT } from "./config/constants.js";

// ── Routes ────────────────────────────────────────────────
import authRoutes      from "./routes/authRoutes.js";
import tripRoutes      from "./routes/tripRoutes.js";
import itineraryRoutes from "./routes/itineraryRoutes.js";
import budgetRoutes    from "./routes/budgetRoutes.js";
import journalRoutes   from "./routes/journalRoutes.js";
import aiRoutes        from "./routes/aiRoutes.js";
import adminRoutes     from "./routes/adminRoutes.js";
import communityRoutes from "./routes/communityRoutes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// 1. SECURITY MIDDLEWARE
// ============================================================

// Helmet — secure HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Disabled for API server
}));

// CORS — whitelist frontend only
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://localhost:3001",
    ];
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new AppError("Not allowed by CORS.", 403));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
  exposedHeaders: ["X-Request-ID"],
}));

// ============================================================
// 2. RATE LIMITING
// ============================================================

// Global rate limiter
app.use(rateLimit({
  windowMs: RATE_LIMIT.GLOBAL_WINDOW_MS,
  max:      RATE_LIMIT.GLOBAL_MAX,
  standardHeaders: true,
  legacyHeaders:   false,
  handler: (_req, res) => {
    ApiResponse.error(res, AppError.rateLimited(), 429);
  },
}));

// Strict auth limiter (brute-force protection)
export const authLimiter = rateLimit({
  windowMs: RATE_LIMIT.AUTH_WINDOW_MS,
  max:      RATE_LIMIT.AUTH_MAX,
  message:  { success: false, message: "Too many auth attempts. Try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders:   false,
});

// AI endpoint limiter
export const aiLimiter = rateLimit({
  windowMs: RATE_LIMIT.AI_WINDOW_MS,
  max:      RATE_LIMIT.AI_MAX,
  message:  { success: false, message: "AI rate limit reached. Wait 1 minute." },
  standardHeaders: true,
  legacyHeaders:   false,
});

// ============================================================
// 3. PERFORMANCE MIDDLEWARE
// ============================================================

app.use(compression({
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) return false;
    return compression.filter(req, res);
  },
}));

// ============================================================
// 4. REQUEST ENRICHMENT
// ============================================================

// Attach unique request ID — enables distributed tracing
app.use((req, res, next) => {
  const requestId = req.headers["x-request-id"] || uuidv4();
  req.requestId   = requestId;
  res.locals.requestId = requestId;
  res.setHeader("X-Request-ID", requestId);
  next();
});

// HTTP request logging via Morgan → Winston
app.use(morgan(
  process.env.NODE_ENV === "production"
    ? ":method :url :status :res[content-length] - :response-time ms"
    : "dev",
  { stream: logger.stream }
));

// ============================================================
// 5. BODY PARSING
// ============================================================

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ============================================================
// 6. STATIC FILES
// ============================================================

app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
  maxAge: "7d",
  etag:   true,
  index:  false,
}));

// ============================================================
// 7. HEALTH CHECK (no auth, no rate limit)
// ============================================================

app.get("/health", (_req, res) => {
  res.json({
    status:      "✅ OK",
    service:     "Traveloop AI API",
    version:     "2.0.0",
    environment: process.env.NODE_ENV || "development",
    timestamp:   new Date().toISOString(),
    uptime:      `${Math.floor(process.uptime())}s`,
  });
});

// ============================================================
// 8. API ROUTES
// ============================================================

const API = "/api";

app.get(`${API}`, (_req, res) => {
  res.json({
    success: true,
    message: "🌍 Traveloop AI REST API v2",
    version: "2.0.0",
    architecture: "Controller → Service → Repository",
    endpoints: {
      auth:      `${API}/auth`,
      trips:     `${API}/trips`,
      itinerary: `${API}/itinerary`,
      budget:    `${API}/budget`,
      journals:  `${API}/journals`,
      ai:        `${API}/ai`,
    },
  });
});

app.use(`${API}/auth`,      authRoutes);
app.use(`${API}/trips`,     tripRoutes);
app.use(`${API}/itinerary`, itineraryRoutes);
app.use(`${API}/budget`,    budgetRoutes);
app.use(`${API}/journals`,  journalRoutes);
app.use(`${API}/ai`,        aiRoutes);
app.use(`${API}/admin`,     adminRoutes);
app.use(`${API}/community`, communityRoutes);

// ============================================================
// 9. ERROR HANDLING
// ============================================================

// 404 handler
app.use((req, res) => {
  ApiResponse.error(res, new AppError(`Route ${req.method} ${req.path} not found.`, 404), 404);
});

// Global error handler
app.use((err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational || false;

  // Log non-operational (programmer) errors
  if (!isOperational || statusCode >= 500) {
    logger.error("Unhandled error", {
      message:   err.message,
      stack:     err.stack,
      path:      req.path,
      method:    req.method,
      requestId: req.requestId,
      userId:    req.user?.id,
    });
  }

  ApiResponse.error(res, err, statusCode);
});

// ============================================================
// 10. GRACEFUL SHUTDOWN
// ============================================================

const gracefulShutdown = (signal) => {
  logger.info(`${signal} received — shutting down gracefully...`);
  server.close(() => {
    logger.info("HTTP server closed.");
    process.exit(0);
  });
  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error("Forced shutdown after timeout.");
    process.exit(1);
  }, 10_000);
};

// ============================================================
// 11. START SERVER
// ============================================================

let server;

const start = async () => {
  await testConnection();

  server = app.listen(PORT, () => {
    logger.info("🚀 Traveloop AI API started", {
      port:        PORT,
      environment: process.env.NODE_ENV || "development",
      version:     "2.0.0",
    });
    logger.info(`   → Health:  http://localhost:${PORT}/health`);
    logger.info(`   → API:     http://localhost:${PORT}/api`);
  });

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT",  () => gracefulShutdown("SIGINT"));
};

start().catch((err) => {
  logger.error("Failed to start server", { error: err.message });
  process.exit(1);
});
