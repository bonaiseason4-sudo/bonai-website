import { Router } from 'express'
import { ProgressController } from '../controllers/attendance.controller'
import { requireAuth } from '../middleware/auth'

export const progressRoutes = Router()

progressRoutes.use(requireAuth)
progressRoutes.get('/', ProgressController.show)
