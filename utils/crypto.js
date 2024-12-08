// utils/crypto.js
import CryptoJS from 'crypto-js'

const key = process.env.ENCRYPTION_KEY || process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "eT9QYgXmbJ4QFHss9fDkUm3Zd8VNyLC2"

// Keep encryption for user authentication
export function encrypt(text) {
  if (!text) return text
  try {
    const paddedText = `v1:${text}`
    return CryptoJS.AES.encrypt(paddedText, key).toString()
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

export function decrypt(encryptedText) {
  if (!encryptedText) return encryptedText
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, key)
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8)

    if (!decryptedText) {
      return encryptedText
    }

    if (decryptedText.startsWith('v1:')) {
      return decryptedText.substring(3)
    }

    return decryptedText
  } catch (error) {
    console.error('Decryption error:', error)
    return encryptedText
  }
}

// Secure string comparison for authentication
export function compareSecurely(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false
  }
  return CryptoJS.SHA256(a).toString() === CryptoJS.SHA256(b).toString()
}

// Add a flag to indicate if a field should be encrypted
export function shouldEncrypt(fieldType) {
  // Only encrypt user authentication related fields
  return ['userPassword', 'sessionToken'].includes(fieldType)
}
