import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "traveloop_fallback_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * Generate a signed JWT token for a user
 * @param {string} userId - User UUID
 * @param {string} email - User email
 * @param {string} role - User role
 * @returns {string} Signed JWT token
 */
export const generateToken = (userId, email, role = "user") => {
  return jwt.sign(
    { id: userId, email, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN, issuer: "traveloop-api" }
  );
};

/**
 * Verify a JWT token
 * @param {string} token
 * @returns {Object} Decoded payload
 */
export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

/**
 * Decode a token without verification (for logging)
 * @param {string} token
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};
