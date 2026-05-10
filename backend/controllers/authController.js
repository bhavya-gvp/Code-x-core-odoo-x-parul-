import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import { uploadToCloudinary } from "../config/cloudinary.js";
import pool from "../config/db.js";

// ============================================================
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
// ============================================================
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, country } = req.body;

  const existing = await User.findByEmail(email);
  if (existing) {
    return res.status(409).json({ success: false, message: "Email already registered." });
  }

  const user = await User.create({ name, email, password, country });
  const token = generateToken(user.id, user.email, user.role);

  res.status(201).json({
    success: true,
    message: "Account created successfully!",
    data: {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token,
    },
  });
});

// ============================================================
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
// ============================================================
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findByEmail(email);
  if (!user) {
    return res.status(401).json({ success: false, message: "Invalid email or password." });
  }

  const isMatch = await User.verifyPassword(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: "Invalid email or password." });
  }

  const token = generateToken(user.id, user.email, user.role);
  const stats = await User.getStats(user.id);

  res.json({
    success: true,
    message: "Login successful!",
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profile_image: user.profile_image,
        country: user.country,
        bio: user.bio,
        travel_personality: user.travel_personality,
        role: user.role,
        is_verified: user.is_verified,
        ...stats,
      },
      token,
    },
  });
});

// ============================================================
// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
// ============================================================
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  const stats = await User.getStats(req.user.id);

  res.json({
    success: true,
    data: { ...user, ...stats },
  });
});

// ============================================================
// @desc    Update current user profile
// @route   PUT /api/auth/profile
// @access  Private
// ============================================================
export const updateProfile = asyncHandler(async (req, res) => {
  let profileImageUrl = undefined;

  // Handle Cloudinary image upload if file is present
  if (req.file) {
    try {
      const result = await uploadToCloudinary(req.file.buffer, "traveloop/profiles", `user_${req.user.id}`);
      profileImageUrl = result.secure_url;
    } catch {
      // Fallback: skip image upload, don't fail the whole request
      console.warn("Cloudinary upload failed, skipping image update");
    }
  }

  const data = { ...req.body };
  if (profileImageUrl) data.profile_image = profileImageUrl;

  const updated = await User.updateProfile(req.user.id, data);

  res.json({
    success: true,
    message: "Profile updated successfully.",
    data: updated,
  });
});

// ============================================================
// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
// ============================================================
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findByEmail(req.user.email);
  const isMatch = await User.verifyPassword(currentPassword, user.password);
  if (!isMatch) {
    return res.status(400).json({ success: false, message: "Current password is incorrect." });
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await pool.execute("UPDATE users SET password = ? WHERE id = ?", [hashed, req.user.id]);

  res.json({ success: true, message: "Password changed successfully." });
});
