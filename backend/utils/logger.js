/**
 * Logger — Structured logging with Winston
 *
 * Outputs:
 *  - Console: colorized human-readable in development
 *  - File: JSON in production → logs/error.log + logs/combined.log
 *
 * Usage:
 *   logger.info("Trip created", { tripId, userId });
 *   logger.error("DB connection failed", { error: err.message });
 *   logger.warn("Rate limit approaching", { ip, count });
 */

import { createLogger, format, transports } from "winston";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, "..", "logs");

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const { combine, timestamp, printf, colorize, json, errors } = format;

// ── Custom console format ──────────────────────────────────
const devFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  const stackStr = stack ? `\n${stack}` : "";
  return `${ts} [${level}] ${message}${metaStr}${stackStr}`;
});

// ── Production JSON format ─────────────────────────────────
const prodFormat = combine(
  errors({ stack: true }),
  timestamp({ format: "YYYY-MM-DDTHH:mm:ss.SSSZ" }),
  json()
);

// ── Development console format ─────────────────────────────
const devConsoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: "HH:mm:ss" }),
  errors({ stack: true }),
  devFormat
);

const isDev = process.env.NODE_ENV !== "production";

const logger = createLogger({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  defaultMeta: {
    service: "traveloop-api",
    environment: process.env.NODE_ENV || "development",
  },
  transports: [
    // Console — always on
    new transports.Console({
      format: isDev ? devConsoleFormat : prodFormat,
      silent: process.env.NODE_ENV === "test",
    }),
    // Error log file
    new transports.File({
      filename: path.join(LOG_DIR, "error.log"),
      level: "error",
      format: prodFormat,
      maxsize: 5 * 1024 * 1024,  // 5MB
      maxFiles: 5,
    }),
    // Combined log file
    new transports.File({
      filename: path.join(LOG_DIR, "combined.log"),
      format: prodFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
    }),
  ],
  // Don't crash on uncaught exceptions
  exceptionHandlers: [
    new transports.File({ filename: path.join(LOG_DIR, "exceptions.log"), format: prodFormat }),
  ],
  rejectionHandlers: [
    new transports.File({ filename: path.join(LOG_DIR, "rejections.log"), format: prodFormat }),
  ],
});

// ── HTTP request logger (used by morgan stream) ────────────
logger.stream = {
  write: (message) => logger.http(message.trim()),
};

export default logger;
