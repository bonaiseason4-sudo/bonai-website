import type { Request, Response } from 'express'
import { AttachmentModel } from '../models/attachment.model'
import { attachmentView } from '../views/attachment.view'

export const VideoController = {
  async attachments(req: Request<{ id: string }>, res: Response) {
    const attachments = await AttachmentModel.findActiveByVideo(req.params.id)
    res.json(attachments.map(attachmentView))
  },
}
