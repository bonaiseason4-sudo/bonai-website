import type { Request, Response } from 'express'
import { PlaylistModel } from '../models/playlist.model'
import { VideoModel } from '../models/video.model'
import { playlistView } from '../views/playlist.view'
import { videoView } from '../views/video.view'

export const PlaylistController = {
  async index(_req: Request, res: Response) {
    const playlists = await PlaylistModel.findAllActive()
    res.json(playlists.map(playlistView))
  },

  async show(req: Request<{ id: string }>, res: Response) {
    const playlist = await PlaylistModel.findActiveById(req.params.id)
    if (!playlist) {
      res.status(404).set('Cache-Control', 'no-store').json({ error: 'Playlist not found' })
      return
    }
    res.json(playlistView(playlist))
  },

  async videos(req: Request<{ id: string }>, res: Response) {
    const videos = await VideoModel.findActiveByPlaylist(req.params.id)
    res.json(videos.map(videoView))
  },
}
