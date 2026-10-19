import { db } from '../config/db'

export interface PlaylistRow {
  id: string
  title: string
  description: string | null
  image_url: string | null
  sort_order: number
  is_active: number
  created_at: string
  video_count?: number
}

export const PlaylistModel = {
  async findAllActive(): Promise<PlaylistRow[]> {
    const { results } = await db
      .prepare(
        `SELECT p.*, (
           SELECT COUNT(*) FROM videos v WHERE v.playlist_id = p.id AND v.is_active = 1 AND v.is_quiz = 0
         ) AS video_count
         FROM playlists p
         WHERE p.is_active = 1
         ORDER BY p.sort_order, p.created_at`,
      )
      .all<PlaylistRow>()
    return results
  },

  async findActiveById(id: string): Promise<PlaylistRow | null> {
    return db.prepare('SELECT * FROM playlists WHERE id = ? AND is_active = 1').bind(id).first<PlaylistRow>()
  },
}
