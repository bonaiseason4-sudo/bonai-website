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

export type PlaylistInput = Pick<PlaylistRow, 'id' | 'title' | 'description' | 'image_url' | 'sort_order' | 'is_active'>

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

  // Admin: includes hidden playlists; counts every lesson, hidden or not.
  async findAll(): Promise<PlaylistRow[]> {
    const { results } = await db
      .prepare(
        `SELECT p.*, (SELECT COUNT(*) FROM videos v WHERE v.playlist_id = p.id AND v.is_quiz = 0) AS video_count
         FROM playlists p
         ORDER BY p.sort_order, p.created_at`,
      )
      .all<PlaylistRow>()
    return results
  },

  async findById(id: string): Promise<PlaylistRow | null> {
    return db.prepare('SELECT * FROM playlists WHERE id = ?').bind(id).first<PlaylistRow>()
  },

  async create(data: PlaylistInput): Promise<PlaylistRow> {
    const row = await db
      .prepare('INSERT INTO playlists (id, title, description, image_url, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?) RETURNING *')
      .bind(data.id, data.title, data.description, data.image_url, data.sort_order, data.is_active)
      .first<PlaylistRow>()
    return row!
  },

  // Changing the id cascades to the playlist's videos (ON UPDATE CASCADE).
  async update(id: string, data: PlaylistInput): Promise<PlaylistRow | null> {
    return db
      .prepare('UPDATE playlists SET id = ?, title = ?, description = ?, image_url = ?, sort_order = ?, is_active = ? WHERE id = ? RETURNING *')
      .bind(data.id, data.title, data.description, data.image_url, data.sort_order, data.is_active, id)
      .first<PlaylistRow>()
  },

  // Deletes the playlist's videos and their attachments too (ON DELETE CASCADE).
  async delete(id: string): Promise<boolean> {
    const result = await db.prepare('DELETE FROM playlists WHERE id = ?').bind(id).run()
    return result.meta.changes > 0
  },
}
