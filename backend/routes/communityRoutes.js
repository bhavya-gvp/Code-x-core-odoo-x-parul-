/**
 * communityRoutes.js — Community posts, likes, comments
 */

import { Router } from "express";
import { protect, optionalAuth } from "../middleware/authMiddleware.js";
import {
  getFeed,
  getTrending,
  createPost,
  getPost,
  deletePost,
  toggleLike,
  getComments,
  addComment,
} from "../controllers/communityController.js";
import {
  createPostValidator,
  addCommentValidator,
  idParamValidator,
  paginationValidator,
} from "../validators/tripValidator.js";

const router = Router();

// Public (optional auth for like status)
router.get("/feed",      optionalAuth, paginationValidator, getFeed);
router.get("/trending",  getTrending);
router.get("/:id",       optionalAuth, idParamValidator, getPost);
router.get("/:id/comments", getComments);

// Authenticated
router.use(protect);
router.post("/posts",              createPostValidator, createPost);
router.delete("/:id",              idParamValidator, deletePost);
router.post("/:id/like",           idParamValidator, toggleLike);
router.post("/:id/comments",       addCommentValidator, addComment);

export default router;
