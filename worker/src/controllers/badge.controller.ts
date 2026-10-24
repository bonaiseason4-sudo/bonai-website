import type { Request, Response } from 'express'
import type { UserRow } from '../models/user.model'
import { BadgeService } from '../services/badge.service'
import { ProgressService } from '../services/progress.service'

// The site sends the badges it celebrated, a few at a time.
const MAX_SEEN = 50

export const BadgeController = {
  // Awards anything newly earned first, so the album is never behind the student's progress.
  async index(_req: Request, res: Response) {
    const user = res.locals.user as UserRow
    res.json(await BadgeService.album(user, await ProgressService.forUser(user)))
  },

  async seen(req: Request, res: Response) {
    const ids: unknown = req.body?.badge_ids
    if (!Array.isArray(ids) || ids.length > MAX_SEEN || !ids.every((id) => typeof id === 'string')) {
      return void res.status(400).json({ error: `badge_ids must be a list of at most ${MAX_SEEN} badge IDs`, code: 'INVALID_BODY' })
    }
    await BadgeService.markSeen(res.locals.user, [...new Set(ids as string[])])
    res.status(204).end()
  },
}
