/**
 * Seed demo users for testing
 * 
 * Run with: npx ts-node scripts/seed-users.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const DEMO_USERS = [
  {
    email: 'admin@checkin.no',
    password: 'Admin123!',
    name: 'Admin User',
    role: 'ADMIN' as const,
  },
  {
    email: 'editor@checkin.no',
    password: 'Editor123!',
    name: 'Editor User',
    role: 'EDITOR' as const,
  },
  {
    email: 'viewer@checkin.no',
    password: 'Viewer123!',
    name: 'Viewer User',
    role: 'VIEWER' as const,
  },
]

async function seedUsers() {
  console.log('🌱 Seeding demo users...\n')

  for (const userData of DEMO_USERS) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    })

    if (existingUser) {
      console.log(`⏭️  User ${userData.email} already exists, updating...`)
      
      const passwordHash = await bcrypt.hash(userData.password, 12)
      
      await prisma.user.update({
        where: { email: userData.email },
        data: {
          passwordHash,
          name: userData.name,
          role: userData.role,
        },
      })
    } else {
      console.log(`✨ Creating user ${userData.email}...`)
      
      const passwordHash = await bcrypt.hash(userData.password, 12)
      
      await prisma.user.create({
        data: {
          email: userData.email,
          passwordHash,
          name: userData.name,
          role: userData.role,
        },
      })
    }
  }

  console.log('\n✅ Demo users seeded successfully!\n')
  console.log('📋 Demo Credentials:')
  console.log('─'.repeat(50))
  for (const user of DEMO_USERS) {
    console.log(`   ${user.role.padEnd(8)} │ ${user.email.padEnd(25)} │ ${user.password}`)
  }
  console.log('─'.repeat(50))
}

seedUsers()
  .catch((error) => {
    console.error('Error seeding users:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
