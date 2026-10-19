import { db } from '../config/db'

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
}
