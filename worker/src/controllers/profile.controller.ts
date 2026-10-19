import type { Request, Response } from 'express'
import { UserModel, type UserRow } from '../models/user.model'
import { profileView } from '../views/user.view'

const MAX_PHONE_LENGTH = 30

export const ProfileController = {
  async show(_req: Request, res: Response) {
    res.json({ profile: profileView(res.locals.user) })
  },

  async update(req: Request, res: Response) {
    const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() || null : null
    if (phone && phone.length > MAX_PHONE_LENGTH) return void res.status(400).json({ error: `Phone must be at most ${MAX_PHONE_LENGTH} characters` })

    const user = await UserModel.updateProfile((res.locals.user as UserRow).id, { phone })
    res.json({ profile: profileView(user) })
  },
}
