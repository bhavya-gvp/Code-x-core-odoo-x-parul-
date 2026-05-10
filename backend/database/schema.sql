-- ============================================================
-- Traveloop AI — Complete MySQL Database Schema
-- Production-grade relational schema with indexes & FKs
-- ============================================================

CREATE DATABASE IF NOT EXISTS traveloop_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE traveloop_db;

-- ============================================================
-- 1. USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(150)  NOT NULL UNIQUE,
  password      VARCHAR(255)  NOT NULL,
  profile_image VARCHAR(500)  DEFAULT NULL,
  country       VARCHAR(100)  DEFAULT NULL,
  bio           TEXT          DEFAULT NULL,
  travel_personality ENUM(
    'Backpacker', 'Luxury Explorer', 'Creator Traveler',
    'Solo Explorer', 'Adventure Seeker', 'Romantic Planner', 'Spiritual Traveler'
  ) DEFAULT NULL,
  followers_count INT UNSIGNED DEFAULT 0,
  following_count INT UNSIGNED DEFAULT 0,
  trips_count   INT UNSIGNED  DEFAULT 0,
  countries_visited INT UNSIGNED DEFAULT 0,
  is_verified   BOOLEAN       NOT NULL DEFAULT FALSE,
  role          ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_users_email (email),
  INDEX idx_users_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. TRIPS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS trips (
  id            VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  user_id       VARCHAR(36)   NOT NULL,
  title         VARCHAR(255)  NOT NULL,
  description   TEXT          DEFAULT NULL,
  cover_image   VARCHAR(500)  DEFAULT NULL,
  start_date    DATE          NOT NULL,
  end_date      DATE          NOT NULL,
  budget        DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  spent_amount  DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  mood          ENUM(
    'Relax', 'Burnout Recovery', 'Romantic Escape',
    'Social Trip', 'Adventure Rush', 'Nature Detox'
  ) DEFAULT NULL,
  travel_type   VARCHAR(100)  DEFAULT NULL,
  status        ENUM('planning', 'upcoming', 'ongoing', 'completed') NOT NULL DEFAULT 'planning',
  visibility    ENUM('private', 'friends', 'public') NOT NULL DEFAULT 'private',
  ai_generated  BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_trips_user_id (user_id),
  INDEX idx_trips_status (status),
  INDEX idx_trips_visibility (visibility),
  INDEX idx_trips_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. TRIP_CITIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS trip_cities (
  id            VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  trip_id       VARCHAR(36)   NOT NULL,
  city_name     VARCHAR(150)  NOT NULL,
  country       VARCHAR(100)  NOT NULL,
  latitude      DECIMAL(10,7) DEFAULT NULL,
  longitude     DECIMAL(10,7) DEFAULT NULL,
  start_date    DATE          DEFAULT NULL,
  end_date      DATE          DEFAULT NULL,
  order_index   INT UNSIGNED  NOT NULL DEFAULT 0,
  notes         TEXT          DEFAULT NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  INDEX idx_trip_cities_trip_id (trip_id),
  INDEX idx_trip_cities_order (trip_id, order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. ITINERARY_DAYS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS itinerary_days (
  id            VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  trip_id       VARCHAR(36)   NOT NULL,
  city_id       VARCHAR(36)   DEFAULT NULL,
  day_number    INT UNSIGNED  NOT NULL,
  date          DATE          NOT NULL,
  city_name     VARCHAR(150)  DEFAULT NULL,
  notes         TEXT          DEFAULT NULL,
  daily_budget  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (city_id) REFERENCES trip_cities(id) ON DELETE SET NULL,
  UNIQUE KEY uq_itinerary_day (trip_id, day_number),
  INDEX idx_itinerary_days_trip_id (trip_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. ACTIVITIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS activities (
  id              VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  itinerary_day_id VARCHAR(36)  NOT NULL,
  activity_name   VARCHAR(255)  NOT NULL,
  category        ENUM(
    'Adventure', 'Food', 'Nightlife', 'Spiritual', 'Nature',
    'Photography', 'Local Experience', 'Hidden Gems',
    'Shopping', 'Transport', 'Hotel', 'Museum', 'Beach', 'Other'
  ) NOT NULL DEFAULT 'Other',
  description     TEXT          DEFAULT NULL,
  location        VARCHAR(300)  DEFAULT NULL,
  cost            DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  duration_minutes INT UNSIGNED DEFAULT NULL,
  start_time      TIME          DEFAULT NULL,
  end_time        TIME          DEFAULT NULL,
  rating          DECIMAL(3,1)  DEFAULT NULL,
  is_booked       BOOLEAN       NOT NULL DEFAULT FALSE,
  booking_ref     VARCHAR(100)  DEFAULT NULL,
  emoji           VARCHAR(10)   DEFAULT '📍',
  notes           TEXT          DEFAULT NULL,
  sort_order      INT UNSIGNED  NOT NULL DEFAULT 0,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (itinerary_day_id) REFERENCES itinerary_days(id) ON DELETE CASCADE,
  INDEX idx_activities_day_id (itinerary_day_id),
  INDEX idx_activities_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. EXPENSES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS expenses (
  id            VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  trip_id       VARCHAR(36)   NOT NULL,
  user_id       VARCHAR(36)   NOT NULL,
  category      ENUM(
    'Flights', 'Hotels', 'Food', 'Transport',
    'Activities', 'Shopping', 'Visa', 'Insurance', 'Other'
  ) NOT NULL DEFAULT 'Other',
  amount        DECIMAL(12,2) NOT NULL,
  currency      VARCHAR(10)   NOT NULL DEFAULT 'INR',
  description   VARCHAR(500)  NOT NULL,
  expense_date  DATE          NOT NULL,
  receipt_url   VARCHAR(500)  DEFAULT NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_expenses_trip_id (trip_id),
  INDEX idx_expenses_category (category),
  INDEX idx_expenses_date (expense_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. PACKING_ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS packing_items (
  id            VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  trip_id       VARCHAR(36)   NOT NULL,
  item_name     VARCHAR(255)  NOT NULL,
  category      ENUM('Clothing', 'Electronics', 'Essentials', 'Documents', 'Other') NOT NULL DEFAULT 'Other',
  packed        BOOLEAN       NOT NULL DEFAULT FALSE,
  quantity      INT UNSIGNED  NOT NULL DEFAULT 1,
  notes         VARCHAR(500)  DEFAULT NULL,
  ai_suggested  BOOLEAN       NOT NULL DEFAULT FALSE,
  sort_order    INT UNSIGNED  NOT NULL DEFAULT 0,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  INDEX idx_packing_trip_id (trip_id),
  INDEX idx_packing_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. JOURNALS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS journals (
  id            VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  trip_id       VARCHAR(36)   NOT NULL,
  user_id       VARCHAR(36)   NOT NULL,
  title         VARCHAR(255)  NOT NULL,
  content       LONGTEXT      NOT NULL,
  mood          VARCHAR(50)   DEFAULT NULL,
  location      VARCHAR(200)  DEFAULT NULL,
  color         VARCHAR(20)   DEFAULT '#6366f1',
  images        JSON          DEFAULT NULL,
  ai_generated  BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_journals_trip_id (trip_id),
  INDEX idx_journals_user_id (user_id),
  FULLTEXT INDEX ft_journals_content (title, content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. COLLABORATORS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS collaborators (
  id            VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  trip_id       VARCHAR(36)   NOT NULL,
  user_id       VARCHAR(36)   NOT NULL,
  role          ENUM('owner', 'editor', 'viewer') NOT NULL DEFAULT 'viewer',
  invited_by    VARCHAR(36)   DEFAULT NULL,
  status        ENUM('pending', 'accepted', 'declined') NOT NULL DEFAULT 'pending',
  joined_at     TIMESTAMP     DEFAULT NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_collaborator (trip_id, user_id),
  INDEX idx_collaborators_trip_id (trip_id),
  INDEX idx_collaborators_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. VOTES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS votes (
  id              VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  trip_id         VARCHAR(36)   NOT NULL,
  collaborator_id VARCHAR(36)   NOT NULL,
  vote_type       ENUM('destination', 'activity', 'date', 'budget') NOT NULL,
  item_ref        VARCHAR(36)   NOT NULL,
  selected_option ENUM('yes', 'no', 'maybe') NOT NULL,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (collaborator_id) REFERENCES collaborators(id) ON DELETE CASCADE,
  UNIQUE KEY uq_vote (collaborator_id, vote_type, item_ref),
  INDEX idx_votes_trip_id (trip_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 11. COMMUNITY_POSTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS community_posts (
  id            VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  user_id       VARCHAR(36)   NOT NULL,
  trip_id       VARCHAR(36)   DEFAULT NULL,
  caption       TEXT          NOT NULL,
  image_url     VARCHAR(500)  DEFAULT NULL,
  images        JSON          DEFAULT NULL,
  tags          JSON          DEFAULT NULL,
  likes_count   INT UNSIGNED  NOT NULL DEFAULT 0,
  saves_count   INT UNSIGNED  NOT NULL DEFAULT 0,
  comments_count INT UNSIGNED NOT NULL DEFAULT 0,
  visibility    ENUM('public', 'friends') NOT NULL DEFAULT 'public',
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL,
  INDEX idx_community_posts_user_id (user_id),
  INDEX idx_community_posts_created_at (created_at),
  INDEX idx_community_posts_likes (likes_count DESC),
  FULLTEXT INDEX ft_community_caption (caption)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 12. POST_LIKES TABLE (Junction for likes)
-- ============================================================
CREATE TABLE IF NOT EXISTS post_likes (
  id            VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  post_id       VARCHAR(36)   NOT NULL,
  user_id       VARCHAR(36)   NOT NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_post_like (post_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 13. SAVED_TRIPS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS saved_trips (
  id            VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  user_id       VARCHAR(36)   NOT NULL,
  trip_id       VARCHAR(36)   NOT NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  UNIQUE KEY uq_saved_trip (user_id, trip_id),
  INDEX idx_saved_trips_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 14. USER_FOLLOWERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS user_followers (
  id            VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  follower_id   VARCHAR(36)   NOT NULL,
  following_id  VARCHAR(36)   NOT NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_follow (follower_id, following_id),
  INDEX idx_followers_following (following_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DEMO DATA SEED
-- ============================================================

-- Demo admin user (password: Admin@1234)
INSERT IGNORE INTO users (id, name, email, password, country, bio, travel_personality, role, is_verified)
VALUES (
  'usr_admin_001',
  'Arjun Mehta',
  'arjun@traveloop.ai',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewFnxMPDmNUWIKUe',
  'India',
  'Wanderer. Creator. Coffee addict.',
  'Creator Traveler',
  'admin',
  TRUE
);
