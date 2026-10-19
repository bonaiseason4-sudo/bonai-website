import { Router } from 'express'
import { PlaylistController } from '../controllers/playlist.controller'

export const playlistRoutes = Router()

playlistRoutes.get('/', PlaylistController.index)
playlistRoutes.get('/:id', PlaylistController.show)
playlistRoutes.get('/:id/videos', PlaylistController.videos)
