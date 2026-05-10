/**
 * ApiResponse — Standardized API response envelope
 *
 * Enforces consistent shape across ALL endpoints:
 * {
 *   success: boolean,
 *   message: string,
 *   data: any,
 *   meta: object,       // pagination, counts
 *   error: object,      // only on failure
 *   timestamp: string,
 *   requestId: string
 * }
 *
 * Usage in controllers:
 *   ApiResponse.success(res, { trip }, "Trip created.", 201);
 *   ApiResponse.error(res, err, 404);
 *   ApiResponse.paginated(res, trips, { page, limit, total });
 */

import { v4 as uuidv4 } from "uuid";

export class ApiResponse {
  /**
   * Send a success response
   * @param {import("express").Response} res
   * @param {any} data — Payload
   * @param {string} message — Human-readable success message
   * @param {number} statusCode — HTTP status (default 200)
   * @param {object} meta — Optional metadata (pagination, etc.)
   */
  static success(res, data = null, message = "Success", statusCode = 200, meta = null) {
    const body = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId || uuidv4(),
    };
    if (meta) body.meta = meta;
    return res.status(statusCode).json(body);
  }

  /**
   * Send a paginated list response
   * @param {import("express").Response} res
   * @param {Array} items — Array of records
   * @param {object} pagination — { page, limit, total }
   * @param {string} message
   */
  static paginated(res, items, { page, limit, total }, message = "Success") {
    const totalPages = Math.ceil(total / limit);
    return ApiResponse.success(res, items, message, 200, {
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(total),
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      count: items.length,
    });
  }

  /**
   * Send an error response
   * @param {import("express").Response} res
   * @param {import("./AppError.js").AppError | Error} err
   * @param {number} statusCode — Override status code
   */
  static error(res, err, statusCode = null) {
    const status = statusCode || err.statusCode || 500;
    const body = {
      success: false,
      message: err.message || "An unexpected error occurred.",
      error: {
        code: err.code || "INTERNAL_SERVER_ERROR",
        ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
      },
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId || uuidv4(),
    };
    return res.status(status).json(body);
  }

  /**
   * Send a 201 Created response
   */
  static created(res, data, message = "Resource created successfully.") {
    return ApiResponse.success(res, data, message, 201);
  }

  /**
   * Send a 204 No Content response (for deletes)
   */
  static noContent(res) {
    return res.status(204).send();
  }

  /**
   * Send validation error response
   * @param {import("express").Response} res
   * @param {Array} errors — express-validator error array
   */
  static validationError(res, errors) {
    return res.status(422).json({
      success: false,
      message: "Validation failed. Please check the provided data.",
      error: {
        code: "VALIDATION_ERROR",
        fields: errors.map((e) => ({
          field: e.path || e.param,
          message: e.msg,
          value: e.value,
        })),
      },
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId,
    });
  }
}

export default ApiResponse;
