const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function deleteAllUsers() {
  try {
    const result = await prisma.user.deleteMany({})
    console.log(`Deleted ${result.count} users`)
  } catch (error) {
    console.error('Error deleting users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

deleteAllUsers()
