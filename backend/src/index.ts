import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import { healthRouter } from './modules/health'
import { integrationRouter } from './modules/integrations/integration.router'
import { kpiRouter } from './modules/kpi'
import { dashboardRouter } from './modules/dashboard/dashboard.router'
import { authRouter } from './modules/auth/auth.router'
import { sharingRouter } from './modules/sharing/sharing.router'
import { shareRouter } from './modules/sharing/share.router'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true, // Allow cookies
}))
app.use(express.json())
app.use(cookieParser())

// Routes
app.use('/health', healthRouter)
app.use('/api/auth', authRouter)
app.use('/api/integrations', integrationRouter)
app.use('/api/kpis', kpiRouter)
app.use('/api/dashboards', dashboardRouter)
app.use('/api/sharing', sharingRouter)
app.use('/api/share', shareRouter)  // Public route for accessing shared resources

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
})

export default app
