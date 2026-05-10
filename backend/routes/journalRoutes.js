import { Router } from "express";
import {
  createJournal, getJournals, updateJournal, deleteJournal, searchJournals,
  getCommunityFeed, createCommunityPost, toggleLike, deleteCommunityPost,
} from "../controllers/journalController.js";
import { protect, optionalAuth } from "../middleware/authMiddleware.js";
import { uploadJournalImages, uploadPostImage } from "../middleware/uploadMiddleware.js";
import { journalValidator, communityPostValidator, paginationValidator, validate } from "../utils/validators.js";

const router = Router();

// Journals
router.post("/", protect, uploadJournalImages, journalValidator, validate, createJournal);
router.get("/trip/:tripId", protect, getJournals);
router.get("/search", protect, searchJournals);
router.put("/:id", protect, updateJournal);
router.delete("/:id", protect, deleteJournal);

// Community
router.get("/community", optionalAuth, paginationValidator, validate, getCommunityFeed);
router.post("/community", protect, uploadPostImage, communityPostValidator, validate, createCommunityPost);
router.post("/community/:id/like", protect, toggleLike);
router.delete("/community/:id", protect, deleteCommunityPost);

export default router;
