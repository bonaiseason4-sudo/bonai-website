-- Lesson attendance for the streak.
-- Each lesson has an attendance window (ISO UTC strings from Date.toISOString()).
-- Both NULL = the lesson is outside the streak (marking it still earns points).
ALTER TABLE videos ADD COLUMN attend_from TEXT;
ALTER TABLE videos ADD COLUMN attend_until TEXT;

-- One mark per student per lesson. Progress (streak, shields, points) is never stored:
-- the API recomputes it from these rows on every request.
CREATE TABLE IF NOT EXISTS attendances (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL REFERENCES videos(id) ON UPDATE CASCADE ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('LIVE', 'RECORDED')),
  marked_at TEXT NOT NULL,
  PRIMARY KEY (user_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_attendances_video ON attendances (video_id);
