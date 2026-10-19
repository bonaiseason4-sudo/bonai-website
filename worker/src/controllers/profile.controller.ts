import type { Request, Response } from 'express'
import { hashPassword } from '../lib/crypto'
import { arabicName, phone as readPhone } from '../lib/validate'
import { SessionModel } from '../models/session.model'
import { UserModel, type UserRow } from '../models/user.model'
import { profileView } from '../views/user.view'

export const ProfileController = {
  async show(_req: Request, res: Response) {
    res.json({ profile: profileView(res.locals.user) })
  },

  // Send only the fields to change, e.g. {name} or {phone}.
  async update(req: Request, res: Response) {
    const body = req.body ?? {}
    const user = await UserModel.updateProfile((res.locals.user as UserRow).id, {
      name: 'name' in body ? arabicName(body.name) : undefined,
      phone: 'phone' in body ? readPhone(body.phone) : undefined,
    })
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
