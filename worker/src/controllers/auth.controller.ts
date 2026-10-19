import type { Request, Response } from 'express'
import { hashPassword, verifyPassword } from '../lib/crypto'
import { SessionModel } from '../models/session.model'
import { UserModel, UsernameTakenError, type UserRow } from '../models/user.model'
import { userView } from '../views/user.view'

const MAX_USERNAME_LENGTH = 50
const MAX_PHONE_LENGTH = 30

function readString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export const AuthController = {
  async register(req: Request, res: Response) {
    const username = readString(req.body?.username).trim()
    const password = readString(req.body?.password)
    const phone = readString(req.body?.phone).trim() || null

    if (!username) return void res.status(400).json({ error: 'Username is required' })
    if (username.length > MAX_USERNAME_LENGTH) return void res.status(400).json({ error: `Username must be at most ${MAX_USERNAME_LENGTH} characters` })
    if (!password) return void res.status(400).json({ error: 'Password is required' })
    if (phone && phone.length > MAX_PHONE_LENGTH) return void res.status(400).json({ error: `Phone must be at most ${MAX_PHONE_LENGTH} characters` })

    let user: UserRow
    try {
      user = await UserModel.create({ username, phone, passwordHash: await hashPassword(password) })
    } catch (error) {
      if (error instanceof UsernameTakenError) return void res.status(409).json({ error: 'Username is already taken' })
      throw error
    }

    const token = await SessionModel.create(user.id)
    res.status(201).json({ user: userView(user), token })
  },

  async login(req: Request, res: Response) {
    const username = readString(req.body?.username).trim()
    const password = readString(req.body?.password)

    const user = username && password ? await UserModel.findByUsername(username) : null
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return void res.status(401).json({ error: 'Wrong username or password' })
    }

    const token = await SessionModel.create(user.id)
    res.json({ user: userView(user), token })
  },

  async me(_req: Request, res: Response) {
    res.json({ user: userView(res.locals.user) })
  },

  async logout(_req: Request, res: Response) {
    await SessionModel.delete(res.locals.token)
    res.status(204).end()
  },
}
