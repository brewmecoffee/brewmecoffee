import CryptoJS from 'crypto-js'

// Use a development key if no environment variable is set
const key = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "eT9QYgXmbJ4QFHss9fDkUm3Zd8VNyLC2"

export function encrypt(text) {
  if (!text) return text
  try {
    // Add some padding and versioning to help with decryption validation
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

    // Check if decryption was successful and has our version prefix
    if (!decryptedText) {
      // Try decrypting without version prefix for backward compatibility
      return encryptedText // Return original text if can't decrypt (might be unencrypted)
    }

    if (decryptedText.startsWith('v1:')) {
      return decryptedText.substring(3) // Remove the version prefix
    }

    return decryptedText // For backward compatibility with existing data
  } catch (error) {
    console.error('Decryption error:', error)
    // Return the original text if decryption fails (might be unencrypted)
    return encryptedText
  }
}