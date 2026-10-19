import { Router } from 'express'
import { cacheFor, noStore } from '../middleware/cache'
import { authRoutes } from './auth.routes'
import { playlistRoutes } from './playlist.routes'
import { profileRoutes } from './profile.routes'
import { videoRoutes } from './video.routes'

export const apiRoutes = Router()

// Public content is the same for everyone, so browsers may cache it briefly.
apiRoutes.use('/playlists', cacheFor(60), playlistRoutes)
apiRoutes.use('/videos', cacheFor(60), videoRoutes)

// Account responses are per user and must never be cached.
apiRoutes.use('/auth', noStore, authRoutes)
apiRoutes.use('/profile', noStore, profileRoutes)
