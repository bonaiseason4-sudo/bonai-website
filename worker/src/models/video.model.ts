import { db } from '../config/db'

export interface VideoRow {
  id: string
  playlist_id: string
  title: string
  description: string | null
  drive_file_id: string | null
  video_url: string | null
  video_source: string | null
  sort_order: number
  is_active: number
  is_quiz: number
  // Attendance window (ISO UTC); both null = the lesson is outside the streak.
  attend_from: string | null
  attend_until: string | null
  created_at: string
}

export type VideoInput = Omit<VideoRow, 'created_at'>

export type AttendableLesson = Pick<VideoRow, 'id' | 'playlist_id' | 'attend_from' | 'attend_until'>

const COLUMNS = 'id, playlist_id, title, description, drive_file_id, video_url, video_source, sort_order, is_active, is_quiz, attend_from, attend_until'

function values(data: VideoInput) {
  return [data.id, data.playlist_id, data.title, data.description, data.drive_file_id, data.video_url, data.video_source, data.sort_order, data.is_active, data.is_quiz, data.attend_from, data.attend_until]
}

export const VideoModel = {
  async findActiveByPlaylist(playlistId: string): Promise<VideoRow[]> {
    const { results } = await db
      .prepare(
        `SELECT v.* FROM videos v
         JOIN playlists p ON p.id = v.playlist_id
         WHERE v.playlist_id = ? AND v.is_active = 1 AND p.is_active = 1
         ORDER BY v.sort_order, v.created_at`,
      )
      .bind(playlistId)
      .all<VideoRow>()
    return results
  },

  // Admin: includes hidden videos.
  async findAllByPlaylist(playlistId: string): Promise<VideoRow[]> {
    const { results } = await db.prepare('SELECT * FROM videos WHERE playlist_id = ? ORDER BY sort_order, created_at').bind(playlistId).all<VideoRow>()
    return results
  },

  // Every lesson a student can mark attendance on (active, not a quiz, in an active playlist), across all playlists.
  async findAttendable(): Promise<AttendableLesson[]> {
    const { results } = await db
      .prepare(
        `SELECT v.id, v.playlist_id, v.attend_from, v.attend_until FROM videos v
         JOIN playlists p ON p.id = v.playlist_id
         WHERE v.is_active = 1 AND v.is_quiz = 0 AND p.is_active = 1`,
      )
      .all<AttendableLesson>()
    return results
  },

  async create(data: VideoInput): Promise<VideoRow> {
    const row = await db
      .prepare(`INSERT INTO videos (${COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`)
      .bind(...values(data))
      .first<VideoRow>()
    return row!
  },

  // Changing the id cascades to the video's attachments (ON UPDATE CASCADE).
  async update(id: string, data: VideoInput): Promise<VideoRow | null> {
    return db
      .prepare(
        `UPDATE videos SET id = ?, playlist_id = ?, title = ?, description = ?, drive_file_id = ?, video_url = ?, video_source = ?, sort_order = ?, is_active = ?, is_quiz = ?,
             attend_from = ?, attend_until = ?
         WHERE id = ? RETURNING *`,
      )
      .bind(...values(data), id)
      .first<VideoRow>()
  },

  // Deletes the video's attachments too (ON DELETE CASCADE).
  async delete(id: string): Promise<boolean> {
    const result = await db.prepare('DELETE FROM videos WHERE id = ?').bind(id).run()
    return result.meta.changes > 0
  },
}
