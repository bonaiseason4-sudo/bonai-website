-- User accounts and login sessions.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  -- Unique regardless of letter case ("Ali" and "ali" are the same user).
  username TEXT NOT NULL UNIQUE COLLATE NOCASE CHECK (length(trim(username)) BETWEEN 1 AND 50),
  -- Optional, not unique and not verified.
  phone TEXT,
  -- Format: pbkdf2-sha256$<iterations>$<salt base64>$<hash base64>
  password_hash TEXT NOT NULL,
  -- New accounts are always 'user'. Promote someone with:
  -- UPDATE users SET role = 'admin' WHERE username = '...';
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Only a SHA-256 of each session token is stored, so a leaked database can't be used to log in.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);
