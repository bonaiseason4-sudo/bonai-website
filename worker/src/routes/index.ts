import { Router } from 'express'
import { AttendanceController } from '../controllers/attendance.controller'
import { requireAuth } from '../middleware/auth'
import { cacheFor, noStore } from '../middleware/cache'
import { adminRoutes } from './admin.routes'
import { attendanceRoutes } from './attendance.routes'
import { authRoutes } from './auth.routes'
import { badgeRoutes } from './badge.routes'
import { playlistRoutes } from './playlist.routes'
import { profileRoutes } from './profile.routes'
import { progressRoutes } from './progress.routes'
import { videoRoutes } from './video.routes'

export const apiRoutes = Router()

// Per user although it sits under /playlists, so it must match before the cached mount below.
apiRoutes.get('/playlists/:id/my-attendance', noStore, requireAuth, AttendanceController.playlist)

// Public content is the same for everyone, so browsers may cache it briefly.
apiRoutes.use('/playlists', cacheFor(60), playlistRoutes)
apiRoutes.use('/videos', cacheFor(60), videoRoutes)

// Account responses are per user and must never be cached.
apiRoutes.use('/auth', noStore, authRoutes)
apiRoutes.use('/profile', noStore, profileRoutes)
apiRoutes.use('/attendance', noStore, attendanceRoutes)
apiRoutes.use('/progress', noStore, progressRoutes)
apiRoutes.use('/badges', noStore, badgeRoutes)
apiRoutes.use('/admin', noStore, adminRoutes)
