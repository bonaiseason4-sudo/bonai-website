import type { NextFunction, Request, Response } from 'express'

export function notFound(_req: Request, res: Response) {
  res.status(404).set('Cache-Control', 'no-store').json({ error: 'Not found' })
}

export function methodNotAllowed(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next()
  res.status(405).set('Cache-Control', 'no-store').json({ error: 'Method not allowed' })
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(error)
  res.status(500).set('Cache-Control', 'no-store').json({ error: 'Internal server error' })
}
