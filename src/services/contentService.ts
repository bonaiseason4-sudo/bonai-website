import type { Attachment, Playlist, Video } from '../types/content'
import { demoPlaylists, demoVideos } from './demoData'

const apiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '')
const forceDemo = import.meta.env.VITE_USE_DEMO_DATA === 'true'

export const usingDemoData = !apiUrl || forceDemo

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`)
  if (!response.ok) throw new Error(`API request failed (${response.status}): ${path}`)
  return response.json() as Promise<T>
}

export async function getPlaylists(): Promise<Playlist[]> {
  if (usingDemoData) {
    return demoPlaylists.map((playlist) => ({
      ...playlist,
      video_count: demoVideos.filter((video) => video.playlist_id === playlist.id && video.is_active && !video.isQuiz).length,
    }))
  }

  return request<Playlist[]>('/api/playlists')
}

export async function getPlaylist(id: string): Promise<Playlist | null> {
  if (usingDemoData) return demoPlaylists.find((playlist) => playlist.id === id && playlist.is_active) ?? null

  const response = await fetch(`${apiUrl}/api/playlists/${encodeURIComponent(id)}`)
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`API request failed (${response.status})`)
  return response.json() as Promise<Playlist>
}

export async function getPlaylistVideos(playlistId: string): Promise<Video[]> {
  if (usingDemoData) {
    return demoVideos.filter((video) => video.playlist_id === playlistId && video.is_active).sort((a, b) => a.sort_order - b.sort_order)
  }

  return request<Video[]>(`/api/playlists/${encodeURIComponent(playlistId)}/videos`)
}

export async function getVideoAttachments(videoId: string): Promise<Attachment[]> {
  if (usingDemoData || !videoId) return []

  return request<Attachment[]>(`/api/videos/${encodeURIComponent(videoId)}/attachments`)
}
