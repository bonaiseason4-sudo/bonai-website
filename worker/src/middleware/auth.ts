import type { NextFunction, Request, Response } from 'express'
import { SessionModel } from '../models/session.model'
import type { UserRole, UserRow } from '../models/user.model'

export function bearerToken(req: Request): string | null {
  const match = req.get('Authorization')?.match(/^Bearer\s+(\S+)$/i)
  return match ? match[1] : null
}

// Rejects the request unless it carries a valid session token; puts the user in res.locals.user.
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = bearerToken(req)
  const user = token ? await SessionModel.findUserByToken(token) : null
  if (!user) {
    res.status(401).json({ error: 'Not logged in' })
    return
  }
  res.locals.user = user
  res.locals.token = token
  next()
}

// Use after requireAuth, e.g. router.post('/x', requireAuth, requireRole('admin'), handler).
export function requireRole(...roles: UserRole[]) {
  return (_req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes((res.locals.user as UserRow).role)) {
      res.status(403).json({ error: 'Not allowed' })
      return
    }
    next()
  }
}
