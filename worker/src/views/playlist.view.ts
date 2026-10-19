import type { PlaylistRow } from '../models/playlist.model'

// JSON shape sent to the frontend (matches src/types/content.ts in the React app).
export function playlistView(row: PlaylistRow) {
  return { ...row, is_active: row.is_active === 1 }
}
