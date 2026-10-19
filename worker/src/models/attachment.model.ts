import { db } from '../config/db'

export const ATTACHMENT_TYPES = ['PDF', 'POWERPOINT', 'WORD', 'SPREADSHEET', 'GOOGLE_FORM', 'GEMINI_QUIZ', 'LINK', 'OTHER'] as const

export interface AttachmentRow {
  id: string
  video_id: string
  title: string
  description: string | null
  url: string
  file_type: string
  sort_order: number
  is_active: number
  created_at: string
}

export type AttachmentInput = Omit<AttachmentRow, 'created_at'>

function values(data: AttachmentInput) {
  return [data.id, data.video_id, data.title, data.description, data.url, data.file_type, data.sort_order, data.is_active]
}

export const AttachmentModel = {
  async findActiveByVideo(videoId: string): Promise<AttachmentRow[]> {
    const { results } = await db
      .prepare(
        `SELECT a.* FROM attachments a
         JOIN videos v ON v.id = a.video_id
         JOIN playlists p ON p.id = v.playlist_id
         WHERE a.video_id = ? AND a.is_active = 1 AND v.is_active = 1 AND p.is_active = 1
         ORDER BY a.sort_order, a.created_at`,
      )
      .bind(videoId)
      .all<AttachmentRow>()
    return results
  },

  // Admin: includes hidden attachments.
  async findAllByVideo(videoId: string): Promise<AttachmentRow[]> {
    const { results } = await db.prepare('SELECT * FROM attachments WHERE video_id = ? ORDER BY sort_order, created_at').bind(videoId).all<AttachmentRow>()
    return results
  },

  async create(data: AttachmentInput): Promise<AttachmentRow> {
    const row = await db
      .prepare('INSERT INTO attachments (id, video_id, title, description, url, file_type, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *')
      .bind(...values(data))
      .first<AttachmentRow>()
    return row!
  },

  async update(id: string, data: AttachmentInput): Promise<AttachmentRow | null> {
    return db
      .prepare('UPDATE attachments SET id = ?, video_id = ?, title = ?, description = ?, url = ?, file_type = ?, sort_order = ?, is_active = ? WHERE id = ? RETURNING *')
      .bind(...values(data), id)
      .first<AttachmentRow>()
  },

  async delete(id: string): Promise<boolean> {
    const result = await db.prepare('DELETE FROM attachments WHERE id = ?').bind(id).run()
    return result.meta.changes > 0
  },
}
