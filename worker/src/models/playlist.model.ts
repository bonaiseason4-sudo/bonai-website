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

// is_active is not editable from the site; hide or show playlists from the database only.
export type PlaylistInput = Pick<PlaylistRow, 'id' | 'title' | 'description' | 'image_url' | 'sort_order'>

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

  // Playlist badges are only awarded and listed while their playlist is on the site.
  async findActiveIds(): Promise<Set<string>> {
    const { results } = await db.prepare('SELECT id FROM playlists WHERE is_active = 1').all<{ id: string }>()
    return new Set(results.map((row) => row.id))
  },

  // Admin: active playlists only (hidden ones are managed in the database), counting hidden lessons too.
  async findAll(): Promise<PlaylistRow[]> {
    const { results } = await db
      .prepare(
        `SELECT p.*, (SELECT COUNT(*) FROM videos v WHERE v.playlist_id = p.id AND v.is_quiz = 0) AS video_count
         FROM playlists p
         WHERE p.is_active = 1
         ORDER BY p.sort_order, p.created_at`,
      )
      .all<PlaylistRow>()
    return results
  },

  async create(data: PlaylistInput): Promise<PlaylistRow> {
    const row = await db
      .prepare('INSERT INTO playlists (id, title, description, image_url, sort_order) VALUES (?, ?, ?, ?, ?) RETURNING *')
      .bind(data.id, data.title, data.description, data.image_url, data.sort_order)
      .first<PlaylistRow>()
    return row!
  },

  // Only active playlists can be edited. Changing the id cascades to the playlist's videos (ON UPDATE CASCADE).
  async update(id: string, data: PlaylistInput): Promise<PlaylistRow | null> {
    const update = db
      .prepare('UPDATE playlists SET id = ?, title = ?, description = ?, image_url = ?, sort_order = ? WHERE id = ? AND is_active = 1 RETURNING *')
      .bind(data.id, data.title, data.description, data.image_url, data.sort_order, id)
    if (data.id === id) return update.first<PlaylistRow>()
    // Completion badges keep the playlist id only inside rule_params JSON (no FK), so follow the rename by hand.
    const [result] = await db.batch<PlaylistRow>([
      update,
      db
        .prepare(
          "UPDATE badges SET rule_params = json_set(rule_params, '$.playlist_id', ?) WHERE rule_type = 'complete_playlist' AND json_extract(rule_params, '$.playlist_id') = ? AND EXISTS (SELECT 1 FROM playlists WHERE id = ?)",
        )
        .bind(data.id, id, data.id),
    ])
    return result.results[0] ?? null
  },

  // Deletes the playlist's videos and their attachments too (ON DELETE CASCADE).
  async delete(id: string): Promise<boolean> {
    const result = await db.prepare('DELETE FROM playlists WHERE id = ? AND is_active = 1').bind(id).run()
    return result.meta.changes > 0
  },
}
