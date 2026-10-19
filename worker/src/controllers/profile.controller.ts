import type { Request, Response } from 'express'
import { hashPassword } from '../lib/crypto'
import { SessionModel } from '../models/session.model'
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

  // Already logged in, so the old password isn't required. Other devices are logged out.
  async changePassword(req: Request, res: Response) {
    const password = typeof req.body?.password === 'string' ? req.body.password : ''
    if (!password) return void res.status(400).json({ error: 'Password is required' })

    const user = res.locals.user as UserRow
    await UserModel.updatePassword(user.id, await hashPassword(password))
    await SessionModel.deleteOthers(user.id, res.locals.token)
    res.status(204).end()
  },
}
