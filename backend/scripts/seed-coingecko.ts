/**
 * Seed CoinGecko Integration
 * 
 * Creates a ready-to-use CoinGecko API integration with common crypto data fields.
 * No API key required - CoinGecko's free tier works without authentication.
 * 
 * Run with: npx ts-node scripts/seed-coingecko.ts
 */

import { PrismaClient } from '@prisma/client'
import { encryptJson } from '../src/services/crypto.service'

const prisma = new PrismaClient()

const COINGECKO_INTEGRATION = {
  name: 'CoinGecko Crypto Prices',
  type: 'API' as const,
  config: {
    url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,cardano,dogecoin&vs_currencies=usd,eur,nok&include_24hr_change=true&include_market_cap=true',
    method: 'GET',
    authType: 'none',
    headers: {},
  },
  status: 'active',
}

// Data fields to extract from CoinGecko response
const DATA_FIELDS = [
  // Bitcoin
  { name: 'Bitcoin Price (USD)', path: 'bitcoin.usd', dataType: 'number' },
  { name: 'Bitcoin Price (EUR)', path: 'bitcoin.eur', dataType: 'number' },
  { name: 'Bitcoin Price (NOK)', path: 'bitcoin.nok', dataType: 'number' },
  { name: 'Bitcoin 24h Change (%)', path: 'bitcoin.usd_24h_change', dataType: 'number' },
  { name: 'Bitcoin Market Cap (USD)', path: 'bitcoin.usd_market_cap', dataType: 'number' },
  
  // Ethereum
  { name: 'Ethereum Price (USD)', path: 'ethereum.usd', dataType: 'number' },
  { name: 'Ethereum Price (EUR)', path: 'ethereum.eur', dataType: 'number' },
  { name: 'Ethereum 24h Change (%)', path: 'ethereum.usd_24h_change', dataType: 'number' },
  { name: 'Ethereum Market Cap (USD)', path: 'ethereum.usd_market_cap', dataType: 'number' },
  
  // Solana
  { name: 'Solana Price (USD)', path: 'solana.usd', dataType: 'number' },
  { name: 'Solana 24h Change (%)', path: 'solana.usd_24h_change', dataType: 'number' },
  
  // Cardano
  { name: 'Cardano Price (USD)', path: 'cardano.usd', dataType: 'number' },
  { name: 'Cardano 24h Change (%)', path: 'cardano.usd_24h_change', dataType: 'number' },
  
  // Dogecoin
  { name: 'Dogecoin Price (USD)', path: 'dogecoin.usd', dataType: 'number' },
  { name: 'Dogecoin 24h Change (%)', path: 'dogecoin.usd_24h_change', dataType: 'number' },
]

async function seedCoinGecko() {
  console.log('🪙 Seeding CoinGecko Integration...\n')

  // Encrypt the config (required by the integration router)
  const encryptedConfig = encryptJson(COINGECKO_INTEGRATION.config)

  // Check if integration already exists
  const existingIntegration = await prisma.integration.findFirst({
    where: { name: COINGECKO_INTEGRATION.name },
  })

  let integrationId: string

  if (existingIntegration) {
    console.log('⏭️  CoinGecko integration already exists, updating...')
    
    const updated = await prisma.integration.update({
      where: { id: existingIntegration.id },
      data: {
        config: encryptedConfig,
        status: COINGECKO_INTEGRATION.status,
      },
    })
    integrationId = updated.id
  } else {
    console.log('✨ Creating CoinGecko integration...')
    
    const created = await prisma.integration.create({
      data: {
        name: COINGECKO_INTEGRATION.name,
        type: COINGECKO_INTEGRATION.type,
        config: encryptedConfig,
        status: COINGECKO_INTEGRATION.status,
      },
    })
    integrationId = created.id
  }

  // Upsert data fields
  console.log('\n📊 Setting up data fields...')
  
  for (const field of DATA_FIELDS) {
    const existingField = await prisma.dataField.findFirst({
      where: {
        integrationId,
        path: field.path,
      },
    })

    if (existingField) {
      console.log(`   ⏭️  ${field.name} (exists)`)
    } else {
      await prisma.dataField.create({
        data: {
          integrationId,
          name: field.name,
          path: field.path,
          dataType: field.dataType,
        },
      })
      console.log(`   ✅ ${field.name}`)
    }
  }

  // Fetch current data to populate initial values
  console.log('\n🔄 Fetching current crypto prices...')
  
  try {
    const response = await fetch(COINGECKO_INTEGRATION.config.url)
    
    if (response.ok) {
      const data = await response.json() as Record<string, Record<string, unknown>>
      console.log('   ✅ Data fetched successfully!')
      
      // Get all data fields for this integration
      const dataFields = await prisma.dataField.findMany({
        where: { integrationId },
      })

      // Helper to get nested value by path
      const getValueByPath = (obj: Record<string, unknown>, path: string): unknown => {
        return path.split('.').reduce((current: unknown, key: string) => {
          return current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined
        }, obj as unknown)
      }

      // Store current values
      for (const field of dataFields) {
        const value = getValueByPath(data as Record<string, unknown>, field.path)
        if (value !== undefined) {
          await prisma.dataValue.create({
            data: {
              dataFieldId: field.id,
              value: value as number,
            },
          })
        }
      }
      console.log('   ✅ Initial values stored!')
      
      // Update integration lastSync
      await prisma.integration.update({
        where: { id: integrationId },
        data: { lastSync: new Date() },
      })
    } else {
      console.log(`   ⚠️  Could not fetch data: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    console.log(`   ⚠️  Could not fetch data: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  console.log('\n✅ CoinGecko integration seeded successfully!')
  console.log('\n📋 Available Data Fields:')
  console.log('─'.repeat(60))
  for (const field of DATA_FIELDS) {
    console.log(`   ${field.name.padEnd(35)} │ ${field.path}`)
  }
  console.log('─'.repeat(60))
  console.log('\n💡 You can now create KPIs using these data fields!')
  console.log('   Example formulas:')
  console.log('   - Bitcoin Price: {{bitcoin_usd}}')
  console.log('   - BTC/ETH Ratio: {{bitcoin_usd}} / {{ethereum_usd}}')
  console.log('   - Portfolio Value: ({{bitcoin_usd}} * 0.5) + ({{ethereum_usd}} * 2)')
}

seedCoinGecko()
  .catch((error) => {
    console.error('Error seeding CoinGecko:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
