import { Router } from 'express'
import { AdminAttachmentController, AdminPlaylistController, AdminVideoController } from '../controllers/admin.controller'
import { requireAuth, requireRole } from '../middleware/auth'

// Everything here needs a logged-in admin. Reads include hidden (is_active = 0) content.
export const adminRoutes = Router()

adminRoutes.use(requireAuth, requireRole('admin'))

adminRoutes.get('/playlists', AdminPlaylistController.index)
adminRoutes.post('/playlists', AdminPlaylistController.create)
adminRoutes.get('/playlists/:id', AdminPlaylistController.show)
adminRoutes.put('/playlists/:id', AdminPlaylistController.update)
adminRoutes.delete('/playlists/:id', AdminPlaylistController.destroy)
adminRoutes.get('/playlists/:id/videos', AdminPlaylistController.videos)

adminRoutes.post('/videos', AdminVideoController.create)
adminRoutes.put('/videos/:id', AdminVideoController.update)
adminRoutes.delete('/videos/:id', AdminVideoController.destroy)
adminRoutes.get('/videos/:id/attachments', AdminVideoController.attachments)

adminRoutes.post('/attachments', AdminAttachmentController.create)
adminRoutes.put('/attachments/:id', AdminAttachmentController.update)
adminRoutes.delete('/attachments/:id', AdminAttachmentController.destroy)
