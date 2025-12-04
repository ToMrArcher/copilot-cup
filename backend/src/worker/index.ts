/**
 * Background Sync Worker
 * 
 * This worker runs independently from the main API server and handles
 * scheduled integration syncs. It polls for integrations due for sync
 * and processes them with proper error handling and retry logic.
 * 
 * Usage: npm run worker
 */

import { prisma } from '../db/client'
import {
  getIntegrationsDueForSync,
  executeSyncWithLogging,
} from '../services/sync.service'

// Configuration
const POLL_INTERVAL_MS = 30_000 // 30 seconds
const CONCURRENCY_LIMIT = 3 // Max parallel syncs
const RATE_LIMIT_DELAY_MS = 1_000 // 1 second between syncs to avoid API rate limits

// Worker state
let isRunning = true
let activeCount = 0

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Process a batch of integrations with concurrency limit
 */
async function processBatch(integrationIds: string[]): Promise<void> {
  const results: Promise<void>[] = []
  
  for (const id of integrationIds) {
    // Wait if we're at concurrency limit
    while (activeCount >= CONCURRENCY_LIMIT) {
      await sleep(100)
    }
    
    activeCount++
    
    const promise = (async () => {
      try {
        console.log(`🔄 Syncing integration ${id}...`)
        const result = await executeSyncWithLogging(id)
        
        if (result.success) {
          console.log(`✅ Integration ${id} synced: ${result.recordsCount} records in ${result.duration}ms`)
        } else {
          console.log(`❌ Integration ${id} failed: ${result.error}`)
        }
        
        // Rate limit delay between syncs
        await sleep(RATE_LIMIT_DELAY_MS)
      } catch (error) {
        console.error(`❌ Error syncing integration ${id}:`, error)
      } finally {
        activeCount--
      }
    })()
    
    results.push(promise)
  }
  
  // Wait for all syncs in this batch to complete
  await Promise.all(results)
}

/**
 * Main worker loop
 */
async function runWorkerLoop(): Promise<void> {
  console.log('🔄 Checking for integrations due for sync...')
  
  try {
    const integrations = await getIntegrationsDueForSync(10)
    
    if (integrations.length === 0) {
      console.log('💤 No integrations due for sync')
      return
    }
    
    console.log(`📋 Found ${integrations.length} integration(s) to sync`)
    
    await processBatch(integrations.map(i => i.id))
    
    console.log('✅ Batch complete')
  } catch (error) {
    console.error('❌ Worker loop error:', error)
  }
}

/**
 * Graceful shutdown handler
 */
async function shutdown(signal: string): Promise<void> {
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`)
  isRunning = false
  
  // Wait for active syncs to complete (max 30 seconds)
  const maxWait = 30_000
  const startTime = Date.now()
  
  while (activeCount > 0 && Date.now() - startTime < maxWait) {
    console.log(`⏳ Waiting for ${activeCount} active sync(s) to complete...`)
    await sleep(1000)
  }
  
  if (activeCount > 0) {
    console.log(`⚠️ Forcing shutdown with ${activeCount} active sync(s)`)
  }
  
  // Disconnect from database
  await prisma.$disconnect()
  console.log('👋 Worker shutdown complete')
  process.exit(0)
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  console.log('🚀 Sync Worker starting...')
  console.log(`   Poll interval: ${POLL_INTERVAL_MS / 1000}s`)
  console.log(`   Concurrency limit: ${CONCURRENCY_LIMIT}`)
  console.log(`   Rate limit delay: ${RATE_LIMIT_DELAY_MS}ms`)
  console.log('')
  
  // Set up signal handlers for graceful shutdown
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
  
  // Verify database connection
  try {
    await prisma.$connect()
    console.log('✅ Database connected')
  } catch (error) {
    console.error('❌ Failed to connect to database:', error)
    process.exit(1)
  }
  
  // Main loop
  while (isRunning) {
    await runWorkerLoop()
    
    if (isRunning) {
      console.log(`💤 Sleeping for ${POLL_INTERVAL_MS / 1000}s...`)
      await sleep(POLL_INTERVAL_MS)
    }
  }
}

// Run the worker
main().catch(error => {
  console.error('❌ Worker fatal error:', error)
  process.exit(1)
})
