import { Router } from 'express'
import { ProfileController } from '../controllers/profile.controller'
import { requireAuth } from '../middleware/auth'

export const profileRoutes = Router()

profileRoutes.use(requireAuth)
profileRoutes.get('/', ProfileController.show)
profileRoutes.patch('/', ProfileController.update)
profileRoutes.put('/password', ProfileController.changePassword)
