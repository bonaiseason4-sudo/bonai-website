import type { NextFunction, Request, Response } from 'express'
import { ValidationError } from '../lib/validate'

export function notFound(_req: Request, res: Response) {
  res.status(404).set('Cache-Control', 'no-store').json({ error: 'Not found' })
}

// Express only treats a middleware as an error handler when it declares all four parameters.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  res.set('Cache-Control', 'no-store')
  const message = String((error as Error)?.message ?? error)

  // Malformed JSON body from express.json().
  if ((error as { type?: string })?.type === 'entity.parse.failed') return void res.status(400).json({ error: 'Invalid JSON body' })
  if (error instanceof ValidationError) return void res.status(400).json({ error: error.message, code: error.code })

  // D1 constraint violations from admin writes.
  if (message.includes('UNIQUE constraint failed')) return void res.status(409).json({ error: 'This ID is already used', code: 'DUPLICATE_ID' })
  if (message.includes('FOREIGN KEY constraint failed')) return void res.status(400).json({ error: 'The parent ID does not exist', code: 'MISSING_PARENT' })
  if (message.includes('CHECK constraint failed')) return void res.status(400).json({ error: 'Some values are not allowed', code: 'INVALID_VALUE' })

  console.error(error)
  res.status(500).json({ error: 'Internal server error' })
}
