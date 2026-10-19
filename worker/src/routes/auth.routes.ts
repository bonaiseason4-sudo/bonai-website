import { Router } from 'express'
import { AuthController } from '../controllers/auth.controller'
import { requireAuth } from '../middleware/auth'

export const authRoutes = Router()

authRoutes.post('/register', AuthController.register)
authRoutes.post('/login', AuthController.login)
authRoutes.get('/me', requireAuth, AuthController.me)
authRoutes.post('/logout', requireAuth, AuthController.logout)
