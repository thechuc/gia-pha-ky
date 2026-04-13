const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient({
  datasourceUrl: 'file:./dev.db'
})

async function main() {
  console.log('Testing JS prisma connection...')
  try {
    const family = await prisma.family.findMany()
    console.log('Families found:', family.length)
  } catch (e) {
    console.error('Failed to find families:', e)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
