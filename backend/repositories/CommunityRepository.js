/**
 * CommunityRepository — SQL for community posts, likes, saves, comments
 */

import { BaseRepository } from "./BaseRepository.js";
import { PAGINATION } from "../config/constants.js";

class CommunityRepository extends BaseRepository {
  constructor() { super("community_posts"); }

  async getFeed({ page = 1, limit = PAGINATION.COMMUNITY_LIMIT, requestingUserId } = {}) {
    const safeLimit = Math.min(Number(limit), 50);
    const offset    = (Math.max(Number(page), 1) - 1) * safeLimit;

    const [countRows, rows] = await Promise.all([
      this.query("SELECT COUNT(*) AS total FROM community_posts WHERE visibility = 'public' AND deleted_at IS NULL"),
      this.query(
        `SELECT p.*,
                u.name AS author_name, u.profile_image AS author_image,
                u.travel_personality AS author_personality,
                ${requestingUserId
                  ? `(SELECT COUNT(*) FROM post_likes WHERE post_id = p.id AND user_id = ?) AS is_liked_by_me,`
                  : "0 AS is_liked_by_me,"}
                t.title AS trip_title
         FROM community_posts p
         JOIN users u ON p.user_id = u.id
         LEFT JOIN trips t ON p.trip_id = t.id
         WHERE p.visibility = 'public' AND p.deleted_at IS NULL
         ORDER BY p.likes_count DESC, p.created_at DESC
         LIMIT ? OFFSET ?`,
        requestingUserId
          ? [requestingUserId, safeLimit, offset]
          : [safeLimit, offset]
      ),
    ]);

    return {
      rows,
      total: Number(countRows[0]?.total || 0),
      page: Number(page),
      limit: safeLimit,
    };
  }

  async createPost({ userId, tripId, caption, imageUrl, images, tags, visibility }) {
    await this.query(
      `INSERT INTO community_posts (user_id, trip_id, caption, image_url, images, tags, visibility)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, tripId || null, caption, imageUrl || null,
       images ? JSON.stringify(images) : null,
       tags ? JSON.stringify(tags) : null,
       visibility || "public"]
    );
    const rows = await this.query(
      "SELECT * FROM community_posts WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
      [userId]
    );
    return rows[0];
  }

  // Atomic like toggle — returns new state
  async toggleLike(postId, userId) {
    const existing = await this.query(
      "SELECT id FROM post_likes WHERE post_id = ? AND user_id = ? LIMIT 1",
      [postId, userId]
    );

    if (existing.length > 0) {
      // Unlike
      await this.query("DELETE FROM post_likes WHERE post_id = ? AND user_id = ?", [postId, userId]);
      await this.query(
        "UPDATE community_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = ?",
        [postId]
      );
      return { liked: false };
    } else {
      // Like
      await this.query("INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)", [postId, userId]);
      await this.query("UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = ?", [postId]);
      return { liked: true };
    }
  }

  // Trending score: (likes * 3 + saves * 2 + comments) / hours_since_post
  async getTrendingPosts(limit = 6) {
    return this.query(
      `SELECT p.*,
              u.name AS author_name, u.profile_image AS author_image,
              ((p.likes_count * 3 + p.saves_count * 2 + p.comments_count) /
               GREATEST(TIMESTAMPDIFF(HOUR, p.created_at, NOW()), 1)) AS trend_score
       FROM community_posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.visibility = 'public' AND p.deleted_at IS NULL
         AND p.created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
       ORDER BY trend_score DESC
       LIMIT ?`,
      [Number(limit)]
    );
  }

  async getPostById(postId, requestingUserId) {
    const rows = await this.query(
      `SELECT p.*, u.name AS author_name, u.profile_image AS author_image,
              ${requestingUserId
                ? `(SELECT COUNT(*) FROM post_likes WHERE post_id = p.id AND user_id = ?) AS is_liked_by_me`
                : "0 AS is_liked_by_me"}
       FROM community_posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ? AND p.deleted_at IS NULL LIMIT 1`,
      requestingUserId ? [requestingUserId, postId] : [postId]
    );
    return rows[0] || null;
  }

  async addComment({ postId, userId, content, parentId }) {
    await this.query(
      "INSERT INTO comments (post_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)",
      [postId, userId, content, parentId || null]
    );
    await this.query("UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = ?", [postId]);
    const rows = await this.query(
      `SELECT c.*, u.name AS author_name, u.profile_image AS author_image
       FROM comments c JOIN users u ON c.user_id = u.id
       WHERE c.post_id = ? ORDER BY c.created_at DESC LIMIT 1`,
      [postId]
    );
    return rows[0];
  }

  async getComments(postId) {
    return this.query(
      `SELECT c.*, u.name AS author_name, u.profile_image AS author_image
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = ? AND c.deleted_at IS NULL
       ORDER BY c.created_at ASC`,
      [postId]
    );
  }
}

export const communityRepository = new CommunityRepository();
export default communityRepository;
