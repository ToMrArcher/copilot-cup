import { Router } from 'express'
import { prisma } from '../db/client'

export const healthRouter = Router()

healthRouter.get('/', async (_req, res) => {
  const startTime = Date.now()
  
  let dbStatus = 'unknown'
  let dbLatency = 0
  
  try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    dbLatency = Date.now() - dbStart
    dbStatus = 'connected'
  } catch (error) {
    dbStatus = 'disconnected'
    console.error('Database health check failed:', error)
  }

  const health = {
    status: dbStatus === 'connected' ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    responseTime: Date.now() - startTime,
    services: {
      database: {
        status: dbStatus,
        latency: dbLatency,
      },
    },
  }

  const statusCode = health.status === 'healthy' ? 200 : 503
  res.status(statusCode).json(health)
})
