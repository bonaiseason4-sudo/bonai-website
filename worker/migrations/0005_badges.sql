-- Badges (أوسمة). Each row says how it is earned: rule_type names a rule in src/lib/badges.ts and
-- rule_params (JSON) fills it in, so a new badge of an existing type is just a new row here.
-- Badges only reward what the student did; none is about absence, shields or late attendance.
--
-- icon:  flame | broadcast | star | crown | book | check | medal | secret (the site shows a medal for anything else)
-- color: coral | green | purple | gold | blue | bronze | silver (a tiered badge always shows its tier's color)
-- is_secret: shown as "وسام سري" until earned. is_active = 0: no longer awarded; students who earned it keep it.
CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  tier TEXT CHECK (tier IS NULL OR tier IN ('BRONZE', 'SILVER', 'GOLD')),
  rule_type TEXT NOT NULL,
  rule_params TEXT NOT NULL DEFAULT '{}',
  is_secret INTEGER NOT NULL DEFAULT 0 CHECK (is_secret IN (0, 1)),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Awarded badges. A row is never deleted, even when the student later removes a mark:
-- a badge, once earned, is kept. seen_at is set once the site has celebrated it.
CREATE TABLE IF NOT EXISTS user_badges (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES badges(id) ON UPDATE CASCADE ON DELETE CASCADE,
  awarded_at TEXT NOT NULL,
  seen_at TEXT,
  PRIMARY KEY (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges (badge_id);

INSERT OR IGNORE INTO badges (id, title, description, icon, color, tier, rule_type, rule_params, is_secret, sort_order) VALUES
  ('FIRST_LIVE', 'أول شعلة', 'تحضر أول درس مباشر في وقته، وتولّع أول شعلة ليك 🔥', 'flame', 'coral', NULL, 'first_live', '{}', 0, 10),
  ('STREAK_4', 'شعلة ٤', 'تحضر ٤ دروس مباشر ورا بعض في وقتها، وشعلتك تكبر', 'flame', 'coral', NULL, 'streak_reached', '{"n":4}', 0, 20),
  ('STREAK_10', 'شعلة ١٠', 'تحضر ١٠ دروس مباشر ورا بعض في وقتها. شعلة منوّرة!', 'flame', 'coral', NULL, 'streak_reached', '{"n":10}', 0, 30),
  ('LIVE_10', '١٠ محاضرات مباشر', 'تحضر ١٠ محاضرات مباشر في وقتها. حضورك بيفرّحنا!', 'broadcast', 'green', NULL, 'live_count', '{"n":10}', 0, 40),
  ('POINTS_100', 'أول ١٠٠ نقطة', 'تجمع أول ١٠٠ نقطة من حضورك ⭐', 'star', 'purple', NULL, 'points_reached', '{"n":100}', 0, 50),
  ('STREAK_20', 'شعلة ٢٠', 'تحضر ٢٠ درس مباشر ورا بعض في وقتها. بطل حقيقي! 👑', 'crown', 'gold', NULL, 'streak_reached', '{"n":20}', 1, 90);

-- Three completion badges for every playlist shown on the site today.
-- Badges for playlists created later are added by hand, for example for a playlist with ID NEW_ID and sort_order 5:
--   INSERT INTO badges (id, title, description, icon, color, tier, rule_type, rule_params, sort_order)
--   VALUES ('COMPLETE_NEW_ID_BRONZE', 'برونزي: <title>', '<description>', 'book', 'bronze', 'BRONZE',
--           'complete_playlist', '{"playlist_id":"NEW_ID","tier":"BRONZE"}', 115);
--   (and the same with SILVER/silver at 116 and GOLD/gold at 117; sort_order = 100 + playlist sort_order * 3 + 0/1/2).
-- A badge whose playlist is hidden or deleted is not awarded and is listed only for students who already earned it.
INSERT OR IGNORE INTO badges (id, title, description, icon, color, tier, rule_type, rule_params, sort_order)
SELECT 'COMPLETE_' || p.id || '_BRONZE', 'برونزي: ' || p.title,
       'تحضر كل دروس «' || p.title || '»، مباشر أو مسجّل',
       'book', 'bronze', 'BRONZE', 'complete_playlist', json_object('playlist_id', p.id, 'tier', 'BRONZE'), 100 + p.sort_order * 3
FROM playlists p WHERE p.is_active = 1;

INSERT OR IGNORE INTO badges (id, title, description, icon, color, tier, rule_type, rule_params, sort_order)
SELECT 'COMPLETE_' || p.id || '_SILVER', 'فضي: ' || p.title,
       'تحضر كل دروس «' || p.title || '»، وأكتر من نصها مباشر في وقته',
       'book', 'silver', 'SILVER', 'complete_playlist', json_object('playlist_id', p.id, 'tier', 'SILVER'), 100 + p.sort_order * 3 + 1
FROM playlists p WHERE p.is_active = 1;

INSERT OR IGNORE INTO badges (id, title, description, icon, color, tier, rule_type, rule_params, sort_order)
SELECT 'COMPLETE_' || p.id || '_GOLD', 'ذهبي: ' || p.title,
       'تحضر كل دروس «' || p.title || '» مباشر في وقتها 🏅',
       'book', 'gold', 'GOLD', 'complete_playlist', json_object('playlist_id', p.id, 'tier', 'GOLD'), 100 + p.sort_order * 3 + 2
FROM playlists p WHERE p.is_active = 1;
