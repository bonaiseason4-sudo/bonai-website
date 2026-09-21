import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { Attachment, Playlist, Video } from '../types/content'
import { demoPlaylists, demoVideos } from './demoData'

export const usingDemoData = !isSupabaseConfigured

export async function getPlaylists(): Promise<Playlist[]> {
  if (!supabase) {
    return demoPlaylists.map((playlist) => ({
      ...playlist,
      video_count: demoVideos.filter((video) => video.playlist_id === playlist.id && video.is_active).length,
    }))
  }

  const [{ data: playlists, error: playlistError }, { data: videos, error: videoError }] = await Promise.all([
    supabase.from('playlists').select('*').eq('is_active', true).order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
    supabase.from('videos').select('playlist_id').eq('is_active', true),
  ])

  if (playlistError) throw playlistError
  if (videoError) throw videoError

  const counts = new Map<string, number>()
  for (const video of videos ?? []) counts.set(video.playlist_id, (counts.get(video.playlist_id) ?? 0) + 1)

  return (playlists ?? []).map((playlist) => ({ ...playlist, video_count: counts.get(playlist.id) ?? 0 })) as Playlist[]
}

export async function getPlaylist(id: string): Promise<Playlist | null> {
  if (!supabase) return demoPlaylists.find((playlist) => playlist.id === id && playlist.is_active) ?? null

  const { data, error } = await supabase.from('playlists').select('*').eq('id', id).eq('is_active', true).maybeSingle()
  if (error) throw error
  return data as Playlist | null
}

export async function getPlaylistVideos(playlistId: string): Promise<Video[]> {
  if (!supabase) {
    return demoVideos.filter((video) => video.playlist_id === playlistId && video.is_active).sort((a, b) => a.sort_order - b.sort_order)
  }

  const { data, error } = await supabase.from('videos').select('*').eq('playlist_id', playlistId).eq('is_active', true).order('sort_order', { ascending: true }).order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as Video[]
}

export async function getVideoAttachments(videoId: string): Promise<Attachment[]> {
  if (!supabase || !videoId) return []

  const { data, error } = await supabase.from('attachments').select('*').eq('video_id', videoId).eq('is_active', true).order('sort_order', { ascending: true }).order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as Attachment[]
}
