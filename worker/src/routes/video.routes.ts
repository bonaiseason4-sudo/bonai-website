import { Router } from 'express'
import { VideoController } from '../controllers/video.controller'

export const videoRoutes = Router()

videoRoutes.get('/:id/attachments', VideoController.attachments)
