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
  created_at: string
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
}
