import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { healthRouter } from './modules/health'
import { integrationRouter } from './modules/integrations/integration.router'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/health', healthRouter)
app.use('/api/integrations', integrationRouter)

// Placeholder routes for other feature modules
app.get('/api/kpis', (_req, res) => {
  res.json({ message: 'KPI module - coming soon' })
})

app.get('/api/dashboards', (_req, res) => {
  res.json({ message: 'Dashboard module - coming soon' })
})

app.get('/api/auth', (_req, res) => {
  res.json({ message: 'Auth module - coming soon' })
})

app.get('/api/sharing', (_req, res) => {
  res.json({ message: 'Sharing module - coming soon' })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
})

export default app
