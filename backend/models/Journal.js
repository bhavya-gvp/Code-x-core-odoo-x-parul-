import pool from "../config/db.js";

// ============================================================
// Journal Model
// ============================================================
export const Journal = {
  async create({ tripId, userId, title, content, mood, location, color, images }) {
    await pool.execute(
      `INSERT INTO journals (trip_id, user_id, title, content, mood, location, color, images)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [tripId, userId, title, content, mood || null, location || null,
       color || "#6366f1", images ? JSON.stringify(images) : null]
    );
    const [rows] = await pool.execute("SELECT * FROM journals WHERE id = LAST_INSERT_ID()");
    const j = rows[0];
    if (j?.images && typeof j.images === "string") j.images = JSON.parse(j.images);
    return j;
  },

  async getByTrip(tripId, userId) {
    const [rows] = await pool.execute(
      "SELECT * FROM journals WHERE trip_id = ? AND user_id = ? ORDER BY created_at DESC",
      [tripId, userId]
    );
    return rows.map((j) => ({ ...j, images: j.images ? JSON.parse(j.images) : [] }));
  },

  async getById(id, userId) {
    const [rows] = await pool.execute(
      "SELECT * FROM journals WHERE id = ? AND user_id = ? LIMIT 1",
      [id, userId]
    );
    const j = rows[0];
    if (!j) return null;
    if (j.images && typeof j.images === "string") j.images = JSON.parse(j.images);
    return j;
  },

  async update(id, userId, data) {
    const allowed = ["title", "content", "mood", "location", "color", "images"];
    const updates = [];
    const values = [];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(key === "images" ? JSON.stringify(data[key]) : data[key]);
      }
    }
    if (!updates.length) return this.getById(id, userId);
    values.push(id, userId);
    await pool.execute(`UPDATE journals SET ${updates.join(", ")} WHERE id = ? AND user_id = ?`, values);
    return this.getById(id, userId);
  },

  async delete(id, userId) {
    const [result] = await pool.execute(
      "DELETE FROM journals WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    return result.affectedRows > 0;
  },

  async search(userId, query) {
    const [rows] = await pool.execute(
      `SELECT j.*, t.title AS trip_title
       FROM journals j
       JOIN trips t ON j.trip_id = t.id
       WHERE j.user_id = ? AND MATCH(j.title, j.content) AGAINST(? IN BOOLEAN MODE)
       ORDER BY j.created_at DESC LIMIT 20`,
      [userId, query + "*"]
    );
    return rows;
  },
};

// ============================================================
// CommunityPost Model
// ============================================================
export const CommunityPost = {
  async create({ userId, tripId, caption, imageUrl, images, tags, visibility }) {
    await pool.execute(
      `INSERT INTO community_posts (user_id, trip_id, caption, image_url, images, tags, visibility)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, tripId || null, caption, imageUrl || null,
       images ? JSON.stringify(images) : null,
       tags ? JSON.stringify(tags) : null,
       visibility || "public"]
    );
    const [rows] = await pool.execute("SELECT * FROM community_posts WHERE id = LAST_INSERT_ID()");
    return this._hydrate(rows[0]);
  },

  async getAll({ page = 1, limit = 20, requestingUserId = null } = {}) {
    const offset = (page - 1) * limit;
    const [rows] = await pool.execute(
      `SELECT cp.*,
              u.name AS author_name, u.profile_image AS author_image,
              t.title AS trip_title
       FROM community_posts cp
       JOIN users u ON cp.user_id = u.id
       LEFT JOIN trips t ON cp.trip_id = t.id
       WHERE cp.visibility = 'public'
       ORDER BY cp.created_at DESC
       LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`
    );

    // Attach like status if user is authenticated
    if (requestingUserId) {
      const postIds = rows.map((p) => p.id);
      if (postIds.length) {
        const placeholders = postIds.map(() => "?").join(",");
        const [likes] = await pool.execute(
          `SELECT post_id FROM post_likes WHERE user_id = ? AND post_id IN (${placeholders})`,
          [requestingUserId, ...postIds]
        );
        const likedSet = new Set(likes.map((l) => l.post_id));
        rows.forEach((p) => (p.is_liked = likedSet.has(p.id)));
      }
    }
    return rows.map(this._hydrate);
  },

  async toggleLike(postId, userId) {
    const [existing] = await pool.execute(
      "SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?",
      [postId, userId]
    );
    if (existing.length) {
      await pool.execute("DELETE FROM post_likes WHERE post_id = ? AND user_id = ?", [postId, userId]);
      await pool.execute("UPDATE community_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = ?", [postId]);
      return { liked: false };
    } else {
      await pool.execute("INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)", [postId, userId]);
      await pool.execute("UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = ?", [postId]);
      return { liked: true };
    }
  },

  async delete(id, userId) {
    const [result] = await pool.execute(
      "DELETE FROM community_posts WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    return result.affectedRows > 0;
  },

  _hydrate(post) {
    if (!post) return null;
    return {
      ...post,
      tags: post.tags ? JSON.parse(post.tags) : [],
      images: post.images ? JSON.parse(post.images) : [],
    };
  },
};
