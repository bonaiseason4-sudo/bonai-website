-- Bunay schema for Cloudflare D1 (SQLite).
-- Booleans are stored as INTEGER 0/1; timestamps as ISO-8601 TEXT.

CREATE TABLE IF NOT EXISTS playlists (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 120),
  description TEXT,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  playlist_id TEXT NOT NULL REFERENCES playlists(id) ON UPDATE CASCADE ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 160),
  description TEXT,
  drive_file_id TEXT,
  video_url TEXT,
  video_source TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  is_quiz INTEGER NOT NULL DEFAULT 0 CHECK (is_quiz IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY,
  video_id TEXT NOT NULL REFERENCES videos(id) ON UPDATE CASCADE ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 160),
  description TEXT,
  url TEXT NOT NULL CHECK (length(trim(url)) >= 10),
  file_type TEXT NOT NULL DEFAULT 'OTHER' CHECK (file_type IN ('PDF', 'POWERPOINT', 'WORD', 'SPREADSHEET', 'GOOGLE_FORM', 'GEMINI_QUIZ', 'LINK', 'OTHER')),
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_playlists_active_sort ON playlists (is_active, sort_order, created_at);
CREATE INDEX IF NOT EXISTS idx_videos_playlist_active_sort ON videos (playlist_id, is_active, sort_order, created_at);
CREATE INDEX IF NOT EXISTS idx_attachments_video_active_sort ON attachments (video_id, is_active, sort_order, created_at);
