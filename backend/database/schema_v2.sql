-- ============================================================
-- Traveloop AI — Enhanced Schema Addendum (V2)
-- MySQL 8.0 compatible version
-- Run AFTER the base schema.sql
-- ============================================================

USE traveloop_db;

-- ============================================================
-- A. ADD SOFT DELETE COLUMNS (MySQL 8.0 compatible)
-- Using stored procedures to add columns only if missing
-- ============================================================

DROP PROCEDURE IF EXISTS add_column_if_missing;
DELIMITER //
CREATE PROCEDURE add_column_if_missing(
  IN tbl VARCHAR(64),
  IN col VARCHAR(64),
  IN col_def VARCHAR(200)
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = tbl
      AND COLUMN_NAME  = col
  ) THEN
    SET @sql = CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN `', col, '` ', col_def);
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END //
DELIMITER ;

CALL add_column_if_missing('trips',           'deleted_at', 'TIMESTAMP NULL DEFAULT NULL');
CALL add_column_if_missing('journals',        'deleted_at', 'TIMESTAMP NULL DEFAULT NULL');
CALL add_column_if_missing('activities',      'deleted_at', 'TIMESTAMP NULL DEFAULT NULL');
CALL add_column_if_missing('community_posts', 'deleted_at', 'TIMESTAMP NULL DEFAULT NULL');
CALL add_column_if_missing('users',           'deleted_at', 'TIMESTAMP NULL DEFAULT NULL');

DROP PROCEDURE IF EXISTS add_column_if_missing;

-- ============================================================
-- B. COMPOSITE INDEXES (safely, skip if exists)
-- ============================================================

DROP PROCEDURE IF EXISTS create_index_if_missing;
DELIMITER //
CREATE PROCEDURE create_index_if_missing(
  IN idx_name  VARCHAR(64),
  IN tbl       VARCHAR(64),
  IN idx_cols  VARCHAR(200)
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = tbl
      AND INDEX_NAME   = idx_name
  ) THEN
    SET @sql = CONCAT('CREATE INDEX `', idx_name, '` ON `', tbl, '` (', idx_cols, ')');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END //
DELIMITER ;

CALL create_index_if_missing('idx_trips_deleted_at',       'trips',           'deleted_at');
CALL create_index_if_missing('idx_trips_user_status',      'trips',           'user_id, status, deleted_at');
CALL create_index_if_missing('idx_trips_user_created',     'trips',           'user_id, created_at');
CALL create_index_if_missing('idx_expenses_trip_date',     'expenses',        'trip_id, expense_date');
CALL create_index_if_missing('idx_activities_day_sort',    'activities',      'itinerary_day_id, sort_order');
CALL create_index_if_missing('idx_posts_visibility_likes', 'community_posts', 'visibility, likes_count, created_at');
CALL create_index_if_missing('idx_packing_trip_cat',       'packing_items',   'trip_id, category, sort_order');

DROP PROCEDURE IF EXISTS create_index_if_missing;

-- ============================================================
-- C. USER_PREFERENCES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id                  VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  user_id             VARCHAR(36)  NOT NULL UNIQUE,
  preferred_currency  CHAR(3)      NOT NULL DEFAULT 'INR',
  date_format         VARCHAR(20)  NOT NULL DEFAULT 'DD/MM/YYYY',
  notifications_email TINYINT(1)   NOT NULL DEFAULT 1,
  notifications_push  TINYINT(1)   NOT NULL DEFAULT 1,
  theme               ENUM('dark', 'light', 'system') NOT NULL DEFAULT 'dark',
  language            VARCHAR(10)  NOT NULL DEFAULT 'en',
  units               ENUM('metric', 'imperial')      NOT NULL DEFAULT 'metric',
  ai_personality      VARCHAR(100) DEFAULT NULL,
  privacy_show_trips  TINYINT(1)   NOT NULL DEFAULT 1,
  created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- D. ACTIVITY_LOGS TABLE (Audit Trail)
-- ============================================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     VARCHAR(36)     DEFAULT NULL,
  action      VARCHAR(100)    NOT NULL,
  entity_type VARCHAR(50)     DEFAULT NULL,
  entity_id   VARCHAR(36)     DEFAULT NULL,
  ip_address  VARCHAR(45)     DEFAULT NULL,
  user_agent  VARCHAR(300)    DEFAULT NULL,
  request_id  VARCHAR(36)     DEFAULT NULL,
  metadata    JSON            DEFAULT NULL,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_logs_user_id  (user_id),
  INDEX idx_logs_action   (action),
  INDEX idx_logs_entity   (entity_type, entity_id),
  INDEX idx_logs_created  (created_at),
  INDEX idx_logs_request  (request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- E. COMMENTS TABLE (Threaded community comments)
-- ============================================================

CREATE TABLE IF NOT EXISTS comments (
  id          VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  post_id     VARCHAR(36)  NOT NULL,
  user_id     VARCHAR(36)  NOT NULL,
  parent_id   VARCHAR(36)  DEFAULT NULL,
  content     TEXT         NOT NULL,
  likes_count INT UNSIGNED NOT NULL DEFAULT 0,
  deleted_at  TIMESTAMP    NULL DEFAULT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (post_id)   REFERENCES community_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)   REFERENCES users(id)           ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id)        ON DELETE CASCADE,
  INDEX idx_comments_post   (post_id, deleted_at),
  INDEX idx_comments_parent (parent_id),
  INDEX idx_comments_user   (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- F. TAGS + TRIP_TAGS (Many-to-many)
-- ============================================================

CREATE TABLE IF NOT EXISTS tags (
  id         VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  name       VARCHAR(50)  NOT NULL UNIQUE,
  emoji      VARCHAR(10)  DEFAULT NULL,
  category   VARCHAR(50)  DEFAULT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_tags_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS trip_tags (
  trip_id  VARCHAR(36) NOT NULL,
  tag_id   VARCHAR(36) NOT NULL,
  PRIMARY KEY (trip_id, tag_id),
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id)  REFERENCES tags(id)  ON DELETE CASCADE,
  INDEX idx_trip_tags_tag (tag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- G. POST_SAVES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS post_saves (
  id         VARCHAR(36) NOT NULL DEFAULT (UUID()),
  post_id    VARCHAR(36) NOT NULL,
  user_id    VARCHAR(36) NOT NULL,
  created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_post_save (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)           ON DELETE CASCADE,
  INDEX idx_post_saves_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- H. SEED: Default tags
-- ============================================================

INSERT IGNORE INTO tags (name, emoji, category) VALUES
  ('beach',         '🏖️', 'vibe'),
  ('mountains',     '🏔️', 'vibe'),
  ('foodie',        '🍜', 'interest'),
  ('budget-travel', '💸', 'style'),
  ('luxury',        '💎', 'style'),
  ('solo',          '🎒', 'companion'),
  ('couple',        '💑', 'companion'),
  ('family',        '👨‍👩‍👧', 'companion'),
  ('adventure',     '🧗', 'interest'),
  ('culture',       '🏛️', 'interest'),
  ('photography',   '📸', 'interest'),
  ('wellness',      '🧘', 'interest'),
  ('offbeat',       '🗺️', 'vibe'),
  ('roadtrip',      '🚗', 'style'),
  ('winter',        '❄️', 'season'),
  ('summer',        '☀️', 'season');

SELECT CONCAT('✅ Schema V2 applied — tables: ', COUNT(*)) AS result
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'traveloop_db';
