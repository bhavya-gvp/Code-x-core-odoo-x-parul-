/**
 * communityController.js — Community posts, likes, comments, saves
 *
 * Routes:
 *  GET    /api/community/feed          — Paginated public feed
 *  GET    /api/community/trending      — Trending posts (computed score)
 *  POST   /api/community/posts         — Create post
 *  GET    /api/community/:id           — Get single post
 *  DELETE /api/community/:id           — Delete post (owner)
 *  POST   /api/community/:id/like      — Toggle like
 *  GET    /api/community/:id/comments  — Get threaded comments
 *  POST   /api/community/:id/comments  — Add comment
 */

import asyncHandler from "express-async-handler";
import { communityService } from "../services/communityService.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const getFeed = asyncHandler(async (req, res) => {
  const result = await communityService.getFeed(req.query, req.user?.id);
  ApiResponse.paginated(res, result.rows, {
    page: result.page, limit: result.limit, total: result.total,
  });
});

export const getTrending = asyncHandler(async (req, res) => {
  const posts = await communityService.getTrendingPosts(req.query.limit);
  ApiResponse.success(res, posts, "Trending posts retrieved.");
});

export const createPost = asyncHandler(async (req, res) => {
  const post = await communityService.createPost(req.user.id, req.body);
  ApiResponse.created(res, post, "Post published.");
});

export const getPost = asyncHandler(async (req, res) => {
  const post = await communityService.getPost(req.params.id, req.user?.id);
  ApiResponse.success(res, post);
});

export const deletePost = asyncHandler(async (req, res) => {
  await communityService.deletePost(req.params.id, req.user.id);
  ApiResponse.success(res, null, "Post deleted.");
});

export const toggleLike = asyncHandler(async (req, res) => {
  const result = await communityService.toggleLike(req.params.id, req.user.id);
  ApiResponse.success(res, result, result.liked ? "Post liked." : "Post unliked.");
});

export const getComments = asyncHandler(async (req, res) => {
  const comments = await communityService.getComments(req.params.id);
  ApiResponse.success(res, comments);
});

export const addComment = asyncHandler(async (req, res) => {
  const comment = await communityService.addComment(
    req.params.id, req.user.id, req.body.content, req.body.parent_id
  );
  ApiResponse.created(res, comment, "Comment posted.");
});
