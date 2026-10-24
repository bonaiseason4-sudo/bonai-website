import { Router } from 'express'
import { AttendanceController } from '../controllers/attendance.controller'
import { requireAuth } from '../middleware/auth'

// GET /api/playlists/:id/my-attendance is registered in routes/index.ts, ahead of the cached /playlists mount.
export const attendanceRoutes = Router()

attendanceRoutes.use(requireAuth)
attendanceRoutes.post('/', AttendanceController.mark)
attendanceRoutes.delete('/:videoId', AttendanceController.unmark)
