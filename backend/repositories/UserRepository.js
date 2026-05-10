/**
 * UserRepository — All SQL for the users domain
 */

import { BaseRepository } from "./BaseRepository.js";

class UserRepository extends BaseRepository {
  constructor() { super("users"); }

  async findByEmail(email) {
    const rows = await this.query(
      "SELECT * FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1",
      [email]
    );
    return rows[0] || null;
  }

  async findById(id) {
    const rows = await this.query(
      "SELECT id, name, email, profile_image, country, bio, travel_personality, followers_count, following_count, trips_count, countries_visited, is_verified, role, created_at FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1",
      [id]
    );
    return rows[0] || null;
  }

  async create({ name, email, hashedPassword }) {
    await this.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword]
    );
    return this.findByEmail(email);
  }

  async updateProfile(id, data) {
    const allowed = ["name", "bio", "country", "profile_image", "travel_personality"];
    const { clause, values } = this.buildUpdateClause(data, allowed);
    if (!clause) return this.findById(id);
    await this.query(`UPDATE users SET ${clause} WHERE id = ?`, [...values, id]);
    return this.findById(id);
  }

  async updatePassword(id, hashedPassword) {
    return this.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, id]);
  }

  async getPasswordHash(id) {
    const rows = await this.query("SELECT password FROM users WHERE id = ? LIMIT 1", [id]);
    return rows[0]?.password || null;
  }

  async follow(followerId, followingId) {
    await this.query(
      "INSERT IGNORE INTO user_followers (follower_id, following_id) VALUES (?, ?)",
      [followerId, followingId]
    );
    await Promise.all([
      this.query("UPDATE users SET following_count = following_count + 1 WHERE id = ?", [followerId]),
      this.query("UPDATE users SET followers_count = followers_count + 1 WHERE id = ?", [followingId]),
    ]);
  }

  async unfollow(followerId, followingId) {
    const result = await this.query(
      "DELETE FROM user_followers WHERE follower_id = ? AND following_id = ?",
      [followerId, followingId]
    );
    if (result.affectedRows > 0) {
      await Promise.all([
        this.query("UPDATE users SET following_count = GREATEST(following_count - 1, 0) WHERE id = ?", [followerId]),
        this.query("UPDATE users SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = ?", [followingId]),
      ]);
    }
    return result.affectedRows > 0;
  }

  async isFollowing(followerId, followingId) {
    const rows = await this.query(
      "SELECT 1 FROM user_followers WHERE follower_id = ? AND following_id = ? LIMIT 1",
      [followerId, followingId]
    );
    return rows.length > 0;
  }

  async getAdminStats() {
    const rows = await this.query(
      `SELECT COUNT(*) AS total_users,
              SUM(is_verified = 1) AS verified_users,
              SUM(role = 'admin') AS admin_count,
              AVG(trips_count) AS avg_trips_per_user
       FROM users WHERE deleted_at IS NULL`
    );
    return rows[0];
  }
}

export const userRepository = new UserRepository();
export default userRepository;
