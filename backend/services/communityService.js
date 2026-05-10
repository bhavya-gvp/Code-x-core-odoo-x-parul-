/**
 * communityService.js — Business logic for community posts, likes, saves, comments
 *
 * Responsibilities:
 *  - Post creation and deletion with ownership validation
 *  - Atomic like/unlike with counter sync
 *  - Trending score computation
 *  - Comment threading
 *  - Feed assembly
 */

import { communityRepository } from "../repositories/CommunityRepository.js";
import { AppError } from "../utils/AppError.js";
import logger from "../utils/logger.js";

export class CommunityService {
  // ── Get paginated public feed ──────────────────────────
  async getFeed(queryParams, requestingUserId) {
    return communityRepository.getFeed({
      ...queryParams,
      requestingUserId,
    });
  }

  // ── Get trending posts ─────────────────────────────────
  async getTrendingPosts(limit = 6) {
    return communityRepository.getTrendingPosts(Number(limit));
  }

  // ── Create post ────────────────────────────────────────
  async createPost(userId, data) {
    const { caption, trip_id, image_url, images, tags, visibility } = data;

    if (!caption?.trim()) throw AppError.badRequest("Caption is required.");

    const post = await communityRepository.createPost({
      userId, tripId: trip_id, caption: caption.trim(),
      imageUrl: image_url, images, tags, visibility,
    });

    logger.info("Community post created", { postId: post?.id, userId });
    return post;
  }

  // ── Get single post ────────────────────────────────────
  async getPost(postId, requestingUserId) {
    const post = await communityRepository.getPostById(postId, requestingUserId);
    if (!post) throw AppError.notFound("Post");
    return post;
  }

  // ── Toggle like (atomic) ───────────────────────────────
  async toggleLike(postId, userId) {
    const post = await communityRepository.getPostById(postId, null);
    if (!post) throw AppError.notFound("Post");

    const result = await communityRepository.toggleLike(postId, userId);
    logger.info("Post like toggled", { postId, userId, liked: result.liked });
    return result;
  }

  // ── Add comment ────────────────────────────────────────
  async addComment(postId, userId, content, parentId = null) {
    if (!content?.trim()) throw AppError.badRequest("Comment content is required.");

    const post = await communityRepository.getPostById(postId, null);
    if (!post) throw AppError.notFound("Post");

    return communityRepository.addComment({ postId, userId, content: content.trim(), parentId });
  }

  // ── Get comments for a post ────────────────────────────
  async getComments(postId) {
    // Build threaded structure from flat list
    const flat = await communityRepository.getComments(postId);
    return buildCommentTree(flat);
  }

  // ── Delete post (owner only) ───────────────────────────
  async deletePost(postId, userId) {
    const post = await communityRepository.getPostById(postId, null);
    if (!post)           throw AppError.notFound("Post");
    if (post.user_id !== userId) throw AppError.forbidden("Only the post author can delete.");

    await communityRepository.query(
      "UPDATE community_posts SET deleted_at = NOW() WHERE id = ?",
      [postId]
    );
    logger.info("Post deleted", { postId, userId });
    return true;
  }
}

// ── Build nested comment tree ──────────────────────────────
function buildCommentTree(flatComments) {
  const map = {};
  const roots = [];

  for (const c of flatComments) {
    map[c.id] = { ...c, replies: [] };
  }

  for (const c of flatComments) {
    if (c.parent_id && map[c.parent_id]) {
      map[c.parent_id].replies.push(map[c.id]);
    } else {
      roots.push(map[c.id]);
    }
  }

  return roots;
}

export const communityService = new CommunityService();
export default communityService;
