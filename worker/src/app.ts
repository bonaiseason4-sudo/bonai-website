import cors from 'cors'
import express from 'express'
import { allowedOrigins } from './config/env'
import { errorHandler, notFound } from './middleware/errors'
import { apiRoutes } from './routes'

export const app = express()

app.disable('x-powered-by')
app.use(cors({
  origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
  methods: ['GET', 'POST', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}))
app.use(express.json({ limit: '10kb' }))

app.use('/api', apiRoutes)
app.use(notFound)
app.use(errorHandler)
