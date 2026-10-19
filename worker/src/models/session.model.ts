import { db } from '../config/db'
import { generateToken, sha256 } from '../lib/crypto'
import type { UserRow } from './user.model'

const SESSION_DAYS = 90

export const SessionModel = {
  // Creates a session and returns the raw token; only its hash is stored.
  async create(userId: string): Promise<string> {
    const token = generateToken()
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString()
    await db.batch([
      db.prepare("DELETE FROM sessions WHERE user_id = ? AND expires_at <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now')").bind(userId),
      db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').bind(await sha256(token), userId, expiresAt),
    ])
    return token
  },

  async findUserByToken(token: string): Promise<UserRow | null> {
    return db
      .prepare(
        `SELECT u.* FROM sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = ? AND s.expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
      )
      .bind(await sha256(token))
      .first<UserRow>()
  },

  async delete(token: string): Promise<void> {
    await db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(token)).run()
  },
}
