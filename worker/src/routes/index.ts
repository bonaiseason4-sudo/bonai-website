import { Router } from 'express'
import { cacheFor } from '../middleware/cache'
import { playlistRoutes } from './playlist.routes'
import { videoRoutes } from './video.routes'

export const apiRoutes = Router()

apiRoutes.use(cacheFor(60))
apiRoutes.use('/playlists', playlistRoutes)
apiRoutes.use('/videos', videoRoutes)
