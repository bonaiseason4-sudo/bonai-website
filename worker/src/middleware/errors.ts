import type { NextFunction, Request, Response } from 'express'

export function notFound(_req: Request, res: Response) {
  res.status(404).set('Cache-Control', 'no-store').json({ error: 'Not found' })
}

// Express only treats a middleware as an error handler when it declares all four parameters.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  res.set('Cache-Control', 'no-store')
  // Malformed JSON body from express.json().
  if ((error as { type?: string })?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Invalid JSON body' })
    return
  }
  console.error(error)
  res.status(500).json({ error: 'Internal server error' })
}
