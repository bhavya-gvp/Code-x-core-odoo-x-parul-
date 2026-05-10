-- ============================================================
-- Traveloop AI — Schema V4: Final Production Tables
-- Adds: activity_categories, destination_tags, trip_insights,
--       fatigue_scores, trip_notes, notifications,
--       collaborator_votes
-- MySQL 8.0 compatible
-- ============================================================
USE traveloop_db;

DROP PROCEDURE IF EXISTS safe_add_col;
DELIMITER //
CREATE PROCEDURE safe_add_col(IN tbl VARCHAR(64), IN col VARCHAR(64), IN def VARCHAR(400))
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tbl AND COLUMN_NAME = col
  ) THEN
    SET @s = CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN `', col, '` ', def);
    PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
  END IF;
END //
DELIMITER ;

-- ============================================================
-- 1. ACTIVITY_CATEGORIES — normalize activity types
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_categories (
  id          VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  name        VARCHAR(80)  NOT NULL UNIQUE,
  emoji       VARCHAR(10)  DEFAULT NULL,
  description VARCHAR(300) DEFAULT NULL,
  intensity   ENUM('low','medium','high') NOT NULL DEFAULT 'low',
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_act_cat_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed categories
INSERT IGNORE INTO activity_categories (name, emoji, description, intensity) VALUES
  ('Adventure',  '⚡', 'High-energy physical activities',        'high'),
  ('Culture',    '🏛️', 'Heritage, history, art experiences',    'low'),
  ('Nature',     '🌿', 'Outdoor and natural environment',        'medium'),
  ('Food',       '🍜', 'Culinary and gastronomic experiences',   'low'),
  ('Wellness',   '🧘', 'Relaxation and health activities',       'low'),
  ('Social',     '🥂', 'Nightlife and group social activities',  'low'),
  ('Shopping',   '🛍️', 'Markets, malls, local crafts',          'low'),
  ('Photography','📸', 'Photography-focused sightseeing',        'low'),
  ('Transport',  '🚂', 'Scenic routes and transit experiences',  'low');

-- Add category_id FK to activities table
CALL safe_add_col('activities', 'category_id', 'VARCHAR(36) DEFAULT NULL');

-- ============================================================
-- 2. DESTINATION_TAGS — many-to-many trip destination tagging
-- ============================================================
CREATE TABLE IF NOT EXISTS destination_tags (
  id             VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  destination_id VARCHAR(36)  NOT NULL,
  tag_id         VARCHAR(36)  NOT NULL,
  tagged_by      VARCHAR(36)  DEFAULT NULL,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_dest_tag (destination_id, tag_id),
  FOREIGN KEY (tagged_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_dest_tags_dest (destination_id),
  INDEX idx_dest_tags_tag  (tag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. TRIP_INSIGHTS — AI-generated insights per trip
-- ============================================================
CREATE TABLE IF NOT EXISTS trip_insights (
  id           VARCHAR(36)    NOT NULL DEFAULT (UUID()),
  trip_id      VARCHAR(36)    NOT NULL,
  insight_type VARCHAR(50)    NOT NULL,  -- 'destination','budget','mood','fatigue','duration'
  icon         VARCHAR(10)    DEFAULT NULL,
  title        VARCHAR(200)   DEFAULT NULL,
  body         TEXT           NOT NULL,
  score        DECIMAL(5,2)   DEFAULT NULL,
  is_warning   TINYINT(1)     NOT NULL DEFAULT 0,
  generated_at TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  INDEX idx_insights_trip   (trip_id),
  INDEX idx_insights_type   (insight_type),
  INDEX idx_insights_warn   (is_warning)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. FATIGUE_SCORES — per-trip fatigue analytics
-- ============================================================
CREATE TABLE IF NOT EXISTS fatigue_scores (
  id                  VARCHAR(36)    NOT NULL DEFAULT (UUID()),
  trip_id             VARCHAR(36)    NOT NULL UNIQUE,
  overall_score       TINYINT UNSIGNED NOT NULL DEFAULT 0,  -- 0–100
  label               VARCHAR(100)   NOT NULL DEFAULT 'Comfortable',
  city_switches       TINYINT        NOT NULL DEFAULT 0,
  avg_activities_day  DECIMAL(4,2)   NOT NULL DEFAULT 0,
  high_intensity_days TINYINT        NOT NULL DEFAULT 0,
  rest_days           TINYINT        NOT NULL DEFAULT 0,
  recommendation      TEXT           DEFAULT NULL,
  calculated_at       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  INDEX idx_fatigue_score (overall_score),
  INDEX idx_fatigue_trip  (trip_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. TRIP_NOTES — rich freeform notes per trip
-- ============================================================
CREATE TABLE IF NOT EXISTS trip_notes (
  id         VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  trip_id    VARCHAR(36)  NOT NULL,
  user_id    VARCHAR(36)  NOT NULL,
  title      VARCHAR(200) NOT NULL DEFAULT 'Note',
  content    TEXT         NOT NULL,
  color      VARCHAR(7)   NOT NULL DEFAULT '#6366f1',  -- hex color
  is_pinned  TINYINT(1)   NOT NULL DEFAULT 0,
  deleted_at TIMESTAMP    NULL DEFAULT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notes_trip    (trip_id, deleted_at),
  INDEX idx_notes_pinned  (trip_id, is_pinned)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. NOTIFICATIONS — platform notification system
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  user_id     VARCHAR(36)  NOT NULL,
  type        VARCHAR(50)  NOT NULL,  -- 'trip_invite','like','comment','system','ai_insight'
  title       VARCHAR(200) NOT NULL,
  body        TEXT         DEFAULT NULL,
  entity_type VARCHAR(50)  DEFAULT NULL,  -- 'trip','post','comment'
  entity_id   VARCHAR(36)  DEFAULT NULL,
  action_url  VARCHAR(300) DEFAULT NULL,
  is_read     TINYINT(1)   NOT NULL DEFAULT 0,
  read_at     TIMESTAMP    NULL DEFAULT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notif_user_read  (user_id, is_read, created_at),
  INDEX idx_notif_entity     (entity_type, entity_id),
  INDEX idx_notif_type       (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. COLLABORATOR_VOTES — group consensus on trip decisions
-- ============================================================
CREATE TABLE IF NOT EXISTS collaborator_votes (
  id             VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  trip_id        VARCHAR(36)  NOT NULL,
  collaborator_id VARCHAR(36) NOT NULL,
  vote_topic     VARCHAR(100) NOT NULL,  -- 'destination','date','budget','activity'
  vote_option    VARCHAR(200) NOT NULL,  -- the option being voted on
  vote_value     TINYINT      NOT NULL DEFAULT 1, -- 1=yes, -1=no, 0=neutral (Borda count)
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_collab_vote (trip_id, collaborator_id, vote_topic, vote_option),
  FOREIGN KEY (trip_id)        REFERENCES trips(id)        ON DELETE CASCADE,
  FOREIGN KEY (collaborator_id) REFERENCES collaborators(id) ON DELETE CASCADE,
  INDEX idx_votes_trip    (trip_id, vote_topic),
  INDEX idx_votes_collab  (collaborator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. SAVED_POSTS — ensure table exists (alias for post_saves)
-- ============================================================
CREATE TABLE IF NOT EXISTS saved_posts (
  id         VARCHAR(36) NOT NULL DEFAULT (UUID()),
  post_id    VARCHAR(36) NOT NULL,
  user_id    VARCHAR(36) NOT NULL,
  created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_saved_post (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)           ON DELETE CASCADE,
  INDEX idx_saved_posts_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. PERFORMANCE INDEXES (additional coverage)
-- ============================================================
DROP PROCEDURE IF EXISTS safe_add_col;

DROP PROCEDURE IF EXISTS safe_idx;
DELIMITER //
CREATE PROCEDURE safe_idx(IN idx VARCHAR(64), IN tbl VARCHAR(64), IN cols VARCHAR(200))
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tbl AND INDEX_NAME = idx
  ) THEN
    SET @s = CONCAT('CREATE INDEX `', idx, '` ON `', tbl, '` (', cols, ')');
    PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
  END IF;
END //
DELIMITER ;

-- Trips dashboard queries
CALL safe_idx('idx_trips_status_created',  'trips',   'status, created_at');
CALL safe_idx('idx_trips_budget_range',    'trips',   'budget, status');
CALL safe_idx('idx_trips_visibility_pub',  'trips',   'visibility, deleted_at');

-- Expenses analytics
CALL safe_idx('idx_expenses_category',     'expenses', 'trip_id, category');
CALL safe_idx('idx_expenses_user_date',    'expenses', 'user_id, expense_date');

-- Community feed
CALL safe_idx('idx_posts_user_created',    'community_posts', 'user_id, created_at');

-- Notifications unread count (most frequent query)
CALL safe_idx('idx_notif_unread',          'notifications', 'user_id, is_read');

DROP PROCEDURE IF EXISTS safe_idx;

-- ============================================================
-- Final verification
-- ============================================================
SELECT
  TABLE_NAME AS `Table`,
  TABLE_ROWS AS `Est. Rows`
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'traveloop_db'
ORDER BY TABLE_NAME;
