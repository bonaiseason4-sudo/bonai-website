import { db } from '../config/db'
import type { AttendanceKind } from '../lib/progress'

export const ATTENDANCE_KINDS: readonly AttendanceKind[] = ['LIVE', 'RECORDED']

export interface AttendanceRow {
  user_id: string
  video_id: string
  kind: AttendanceKind
  marked_at: string
}

// A mark with its lesson's window end, which decides whether it was on time.
export interface AttendanceWithWindow extends AttendanceRow {
  attend_until: string | null
}

export const AttendanceModel = {
  // All of the user's marks; marks on hidden lessons are simply ignored by computeProgress.
  async findByUser(userId: string): Promise<AttendanceRow[]> {
    const { results } = await db.prepare('SELECT * FROM attendances WHERE user_id = ?').bind(userId).all<AttendanceRow>()
    return results
  },

  async findByPlaylist(userId: string, playlistId: string): Promise<AttendanceWithWindow[]> {
    const { results } = await db
      .prepare(
        `SELECT a.*, v.attend_until FROM attendances a
         JOIN videos v ON v.id = a.video_id
         WHERE a.user_id = ? AND v.playlist_id = ?
         ORDER BY v.sort_order, v.created_at`,
      )
      .bind(userId, playlistId)
      .all<AttendanceWithWindow>()
    return results
  },

  async findOne(userId: string, videoId: string): Promise<AttendanceWithWindow | null> {
    return db
      .prepare(
        `SELECT a.*, v.attend_until FROM attendances a
         JOIN videos v ON v.id = a.video_id
         WHERE a.user_id = ? AND a.video_id = ?`,
      )
      .bind(userId, videoId)
      .first<AttendanceWithWindow>()
  },

  // Marking again replaces the kind and time of the existing mark.
  async upsert(userId: string, videoId: string, kind: AttendanceKind, markedAt: string): Promise<AttendanceRow> {
    const row = await db
      .prepare(
        `INSERT INTO attendances (user_id, video_id, kind, marked_at) VALUES (?, ?, ?, ?)
         ON CONFLICT(user_id, video_id) DO UPDATE SET kind = excluded.kind, marked_at = excluded.marked_at
         RETURNING *`,
      )
      .bind(userId, videoId, kind, markedAt)
      .first<AttendanceRow>()
    return row!
  },

  async delete(userId: string, videoId: string): Promise<boolean> {
    const result = await db.prepare('DELETE FROM attendances WHERE user_id = ? AND video_id = ?').bind(userId, videoId).run()
    return result.meta.changes > 0
  },
}
