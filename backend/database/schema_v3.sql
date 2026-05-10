-- ============================================================
-- Schema V3 — AI Trip Generation Engine columns
-- MySQL 8.0 compatible (no IF NOT EXISTS on ALTER)
-- ============================================================
USE traveloop_db;

DROP PROCEDURE IF EXISTS safe_add_column;
DELIMITER //
CREATE PROCEDURE safe_add_column(IN tbl VARCHAR(64), IN col VARCHAR(64), IN col_def VARCHAR(300))
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tbl AND COLUMN_NAME = col
  ) THEN
    SET @s = CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN `', col, '` ', col_def);
    PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
  END IF;
END //
DELIMITER ;

-- itinerary_days
CALL safe_add_column('itinerary_days', 'theme',       'VARCHAR(100) DEFAULT NULL');
CALL safe_add_column('itinerary_days', 'travel_note', 'TEXT DEFAULT NULL');

-- trip_cities
CALL safe_add_column('trip_cities', 'nights', 'INT NOT NULL DEFAULT 0');

-- activities
CALL safe_add_column('activities', 'time_slot',        'VARCHAR(20) DEFAULT NULL');
CALL safe_add_column('activities', 'duration_minutes', 'INT DEFAULT 60');
CALL safe_add_column('activities', 'estimated_cost',   'DECIMAL(10,2) DEFAULT 0');

-- trips
CALL safe_add_column('trips', 'ai_generated', 'TINYINT(1) NOT NULL DEFAULT 0');
CALL safe_add_column('trips', 'travelers',    'INT NOT NULL DEFAULT 1');
CALL safe_add_column('trips', 'cover_image',  'VARCHAR(500) DEFAULT NULL');

DROP PROCEDURE IF EXISTS safe_add_column;

-- Index for AI-generated trips
DROP PROCEDURE IF EXISTS safe_add_index;
DELIMITER //
CREATE PROCEDURE safe_add_index(IN idx VARCHAR(64), IN tbl VARCHAR(64), IN cols VARCHAR(200))
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

CALL safe_add_index('idx_trips_ai_generated', 'trips', 'ai_generated, user_id');
CALL safe_add_index('idx_activities_timeslot', 'activities', 'itinerary_day_id, time_slot');

DROP PROCEDURE IF EXISTS safe_add_index;

SELECT CONCAT('✅ Schema V3 applied') AS result;
