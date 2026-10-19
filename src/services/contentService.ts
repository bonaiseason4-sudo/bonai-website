import { ApiError, apiRequest, apiUrl } from '../lib/api'
import type { Attachment, Playlist, Video } from '../types/content'
import { demoPlaylists, demoVideos } from './demoData'

const forceDemo = import.meta.env.VITE_USE_DEMO_DATA === 'true'

export const usingDemoData = !apiUrl || forceDemo

// Admins read from /api/admin, which also returns hidden content.
const base = (admin: boolean) => (admin ? '/api/admin' : '/api')

export async function getPlaylists(admin = false): Promise<Playlist[]> {
  if (usingDemoData) {
    return demoPlaylists.map((playlist) => ({
      ...playlist,
      video_count: demoVideos.filter((video) => video.playlist_id === playlist.id && video.is_active && !video.isQuiz).length,
    }))
  }

  return apiRequest<Playlist[]>(`${base(admin)}/playlists`)
}

export async function getPlaylist(id: string, admin = false): Promise<Playlist | null> {
  if (usingDemoData) return demoPlaylists.find((playlist) => playlist.id === id && playlist.is_active) ?? null

  try {
    return await apiRequest<Playlist>(`${base(admin)}/playlists/${encodeURIComponent(id)}`)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export async function getPlaylistVideos(playlistId: string, admin = false): Promise<Video[]> {
  if (usingDemoData) {
    return demoVideos.filter((video) => video.playlist_id === playlistId && video.is_active).sort((a, b) => a.sort_order - b.sort_order)
  }

  return apiRequest<Video[]>(`${base(admin)}/playlists/${encodeURIComponent(playlistId)}/videos`)
}

export async function getVideoAttachments(videoId: string, admin = false): Promise<Attachment[]> {
  if (usingDemoData || !videoId) return []

  return apiRequest<Attachment[]>(`${base(admin)}/videos/${encodeURIComponent(videoId)}/attachments`)
}
