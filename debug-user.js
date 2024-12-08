const { PrismaClient } = require('@prisma/client')
const CryptoJS = require('crypto-js')

const prisma = new PrismaClient()
const key = process.env.ENCRYPTION_KEY

function decrypt(encryptedText) {
  if (!encryptedText) return encryptedText
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, key)
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8)
    if (decryptedText.startsWith('v1:')) {
      return decryptedText.substring(3)
    }
    return decryptedText
  } catch (error) {
    console.error('Decryption error:', error)
    return encryptedText
  }
}

async function debugUser(username) {
  try {
    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      console.log('User not found')
      return
    }

    console.log('User found:')
    console.log('ID:', user.id)
    console.log('Username:', user.username)
    console.log('Encrypted password:', user.password)
    console.log('Decrypted password:', decrypt(user.password))
    console.log('2FA Enabled:', user.twoFAEnabled)
    console.log('2FA Secret exists:', !!user.twoFASecret)
  } catch (error) {
    console.error('Debug error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

const username = process.argv[2]
if (!username) {
  console.log('Usage: node debug-user.js <username>')
  process.exit(1)
}

debugUser(username)
