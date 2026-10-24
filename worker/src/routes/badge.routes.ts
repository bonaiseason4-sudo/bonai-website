import { Router } from 'express'
import { BadgeController } from '../controllers/badge.controller'
import { requireAuth } from '../middleware/auth'

export const badgeRoutes = Router()

badgeRoutes.use(requireAuth)
badgeRoutes.get('/', BadgeController.index)
badgeRoutes.post('/seen', BadgeController.seen)
