import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seedHistoricalData() {
  // Get the revenue data field
  const revenueField = await prisma.dataField.findFirst({
    where: { name: 'revenue' }
  });
  
  if (!revenueField) {
    console.log('No revenue field found');
    return;
  }
  
  console.log('Found revenue field:', revenueField.id);
  
  // Create historical data points for the past 7 days
  const today = new Date();
  const historicalValues = [
    { daysAgo: 6, value: [12000, 18000, 8500] },      // Total: 38500
    { daysAgo: 5, value: [15000, 20000, 10000] },     // Total: 45000
    { daysAgo: 4, value: [18000, 22000, 12000] },     // Total: 52000
    { daysAgo: 3, value: [22000, 25000, 15000] },     // Total: 62000
    { daysAgo: 2, value: [25000, 28000, 18000] },     // Total: 71000
    { daysAgo: 1, value: [28000, 30000, 22000] },     // Total: 80000
  ];
  
  for (const { daysAgo, value } of historicalValues) {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(12, 0, 0, 0);
    
    await prisma.dataValue.create({
      data: {
        dataFieldId: revenueField.id,
        value: value,
        syncedAt: date,
      }
    });
    console.log(`Created data for ${daysAgo} days ago: ${JSON.stringify(value)}`);
  }
  
  console.log('Historical data seeded successfully!');
}

seedHistoricalData()
  .then(() => prisma.$disconnect())
  .catch(e => { console.error(e); prisma.$disconnect(); });
