import type { NextFunction, Request, Response } from 'express'

// Lets browsers reuse successful GET responses for `seconds`.
export function cacheFor(seconds: number) {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.set('Cache-Control', `public, max-age=${seconds}`)
    next()
  }
}

export function noStore(_req: Request, res: Response, next: NextFunction) {
  res.set('Cache-Control', 'no-store')
  next()
}
