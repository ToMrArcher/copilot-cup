/**
 * Seed CoinGecko Historical Data
 * 
 * Fetches historical price data from CoinGecko and stores it as DataValues.
 * This gives you chart data for the past 30 days.
 * 
 * Run with: npx ts-node scripts/seed-coingecko-history.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// CoinGecko market chart API (free, no auth required)
// Returns prices for the last 30 days with daily granularity
const COINS = ['bitcoin', 'ethereum', 'solana', 'cardano', 'dogecoin']
const CURRENCY = 'usd'
const DAYS = 30

interface MarketChartResponse {
  prices: [number, number][] // [timestamp, price]
  market_caps: [number, number][]
  total_volumes: [number, number][]
}

async function fetchCoinHistory(coinId: string): Promise<MarketChartResponse | null> {
  const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=${CURRENCY}&days=${DAYS}`
  
  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.log(`   ⚠️  Failed to fetch ${coinId}: ${response.status}`)
      return null
    }
    return await response.json() as MarketChartResponse
  } catch (error) {
    console.log(`   ⚠️  Error fetching ${coinId}: ${error instanceof Error ? error.message : 'Unknown'}`)
    return null
  }
}

async function seedHistory() {
  console.log('📈 Seeding CoinGecko Historical Data...\n')
  console.log(`   Fetching ${DAYS} days of history for ${COINS.length} coins\n`)

  // Find the CoinGecko integration
  const integration = await prisma.integration.findFirst({
    where: { name: 'CoinGecko Crypto Prices' },
    include: { dataFields: true },
  })

  if (!integration) {
    console.error('❌ CoinGecko integration not found. Run seed-coingecko.ts first.')
    process.exit(1)
  }

  // Create a map of field paths to field IDs
  const fieldMap = new Map<string, string>()
  for (const field of integration.dataFields) {
    fieldMap.set(field.path, field.id)
  }

  let totalValues = 0

  for (const coinId of COINS) {
    console.log(`\n🪙 Fetching ${coinId}...`)
    
    // Rate limit: CoinGecko free tier allows ~10-30 calls/minute
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const history = await fetchCoinHistory(coinId)
    if (!history) continue

    const priceFieldPath = `${coinId}.usd`
    const priceFieldId = fieldMap.get(priceFieldPath)

    if (!priceFieldId) {
      console.log(`   ⚠️  No field found for ${priceFieldPath}`)
      continue
    }

    // Delete existing historical data for this field to avoid duplicates
    await prisma.dataValue.deleteMany({
      where: { dataFieldId: priceFieldId },
    })

    // Insert historical price data
    const priceValues = history.prices.map(([timestamp, price]) => ({
      dataFieldId: priceFieldId,
      value: price,
      syncedAt: new Date(timestamp),
    }))

    await prisma.dataValue.createMany({
      data: priceValues,
    })

    console.log(`   ✅ Stored ${priceValues.length} price points`)
    totalValues += priceValues.length

    // Also store market cap history if we have the field
    const mcapFieldPath = `${coinId}.usd_market_cap`
    const mcapFieldId = fieldMap.get(mcapFieldPath)

    if (mcapFieldId && history.market_caps) {
      await prisma.dataValue.deleteMany({
        where: { dataFieldId: mcapFieldId },
      })

      const mcapValues = history.market_caps.map(([timestamp, mcap]) => ({
        dataFieldId: mcapFieldId,
        value: mcap,
        syncedAt: new Date(timestamp),
      }))

      await prisma.dataValue.createMany({
        data: mcapValues,
      })

      console.log(`   ✅ Stored ${mcapValues.length} market cap points`)
      totalValues += mcapValues.length
    }
  }

  // Update integration lastSync
  await prisma.integration.update({
    where: { id: integration.id },
    data: { lastSync: new Date() },
  })

  console.log('\n' + '─'.repeat(50))
  console.log(`\n✅ Historical data seeded successfully!`)
  console.log(`   Total data points: ${totalValues}`)
  console.log(`   Date range: Last ${DAYS} days`)
  console.log('\n💡 Your KPI charts will now show historical trends!')
}

seedHistory()
  .catch((error) => {
    console.error('Error seeding history:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
