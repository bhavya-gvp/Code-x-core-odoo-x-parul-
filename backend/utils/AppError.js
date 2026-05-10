/**
 * AppError — Custom operational error class
 *
 * Distinguishes between:
 *  - Operational errors (expected, user-facing) → isOperational: true
 *  - Programmer errors (bugs) → isOperational: false
 *
 * Usage:
 *   throw new AppError("Trip not found.", 404);
 *   throw new AppError("Access denied.", 403, "FORBIDDEN");
 */

export class AppError extends Error {
  /**
   * @param {string} message — Human-readable error message
   * @param {number} statusCode — HTTP status code
   * @param {string} [code] — Optional machine-readable error code
   * @param {boolean} [isOperational=true] — Operational vs programmer error
   */
  constructor(message, statusCode = 500, code = null, isOperational = true) {
    super(message);

    this.statusCode = statusCode;
    this.status = statusCode >= 400 && statusCode < 500 ? "fail" : "error";
    this.code = code || this._defaultCode(statusCode);
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    // Capture stack trace, excluding constructor call
    Error.captureStackTrace(this, this.constructor);
  }

  _defaultCode(statusCode) {
    const codes = {
      400: "BAD_REQUEST",
      401: "UNAUTHORIZED",
      403: "FORBIDDEN",
      404: "NOT_FOUND",
      409: "CONFLICT",
      422: "UNPROCESSABLE_ENTITY",
      429: "RATE_LIMITED",
      500: "INTERNAL_SERVER_ERROR",
      503: "SERVICE_UNAVAILABLE",
    };
    return codes[statusCode] || "UNKNOWN_ERROR";
  }

  // ── Static factory methods for common errors ──────────────

  static notFound(resource = "Resource") {
    return new AppError(`${resource} not found.`, 404, "NOT_FOUND");
  }

  static unauthorized(message = "Authentication required.") {
    return new AppError(message, 401, "UNAUTHORIZED");
  }

  static forbidden(message = "Access denied.") {
    return new AppError(message, 403, "FORBIDDEN");
  }

  static badRequest(message = "Invalid request data.") {
    return new AppError(message, 400, "BAD_REQUEST");
  }

  static conflict(message = "Resource already exists.") {
    return new AppError(message, 409, "CONFLICT");
  }

  static rateLimited(message = "Too many requests. Please slow down.") {
    return new AppError(message, 429, "RATE_LIMITED");
  }

  static internal(message = "An internal error occurred.") {
    return new AppError(message, 500, "INTERNAL_SERVER_ERROR", false);
  }
}

export default AppError;
