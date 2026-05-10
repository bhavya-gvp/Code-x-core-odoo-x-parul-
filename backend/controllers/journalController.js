import asyncHandler from "express-async-handler";
import { Journal, CommunityPost } from "../models/Journal.js";
import { uploadToCloudinary } from "../config/cloudinary.js";

// ============================================================
// JOURNALS
// ============================================================

export const createJournal = asyncHandler(async (req, res) => {
  let images = req.body.images || [];

  if (req.files?.length) {
    const uploads = await Promise.all(
      req.files.map((f) => uploadToCloudinary(f.buffer, "traveloop/journals"))
    );
    images = uploads.map((u) => u.secure_url);
  }

  const { trip_id, title, content, mood, location, color } = req.body;
  const journal = await Journal.create({
    tripId: trip_id, userId: req.user.id, title, content,
    mood, location, color, images,
  });
  res.status(201).json({ success: true, message: "Journal entry created.", data: journal });
});

export const getJournals = asyncHandler(async (req, res) => {
  const journals = await Journal.getByTrip(req.params.tripId, req.user.id);
  res.json({ success: true, count: journals.length, data: journals });
});

export const updateJournal = asyncHandler(async (req, res) => {
  const updated = await Journal.update(req.params.id, req.user.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: "Journal not found." });
  res.json({ success: true, data: updated });
});

export const deleteJournal = asyncHandler(async (req, res) => {
  const deleted = await Journal.delete(req.params.id, req.user.id);
  if (!deleted) return res.status(404).json({ success: false, message: "Journal not found." });
  res.json({ success: true, message: "Journal deleted." });
});

export const searchJournals = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ success: false, message: "Search query required." });
  const results = await Journal.search(req.user.id, q);
  res.json({ success: true, count: results.length, data: results });
});

// ============================================================
// COMMUNITY POSTS
// ============================================================

export const getCommunityFeed = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const posts = await CommunityPost.getAll({
    page, limit, requestingUserId: req.user?.id,
  });
  res.json({ success: true, count: posts.length, data: posts });
});

export const createCommunityPost = asyncHandler(async (req, res) => {
  let imageUrl = null;
  if (req.file) {
    try {
      const result = await uploadToCloudinary(req.file.buffer, "traveloop/posts");
      imageUrl = result.secure_url;
    } catch { /* skip */ }
  }

  const { trip_id, caption, tags, visibility } = req.body;
  const post = await CommunityPost.create({
    userId: req.user.id, tripId: trip_id, caption, imageUrl,
    tags: tags ? JSON.parse(tags) : [],
    visibility: visibility || "public",
  });
  res.status(201).json({ success: true, message: "Post published!", data: post });
});

export const toggleLike = asyncHandler(async (req, res) => {
  const result = await CommunityPost.toggleLike(req.params.id, req.user.id);
  res.json({ success: true, ...result });
});

export const deleteCommunityPost = asyncHandler(async (req, res) => {
  const deleted = await CommunityPost.delete(req.params.id, req.user.id);
  if (!deleted) return res.status(404).json({ success: false, message: "Post not found." });
  res.json({ success: true, message: "Post deleted." });
});
