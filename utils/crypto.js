// utils/crypto.js
import CryptoJS from 'crypto-js'

const key =
  process.env.ENCRYPTION_KEY ||
  process.env.NEXT_PUBLIC_ENCRYPTION_KEY ||
  'eT9QYgXmbJ4QFHss9fDkUm3Zd8VNyLC2'

// Enhanced encryption function that handles objects and arrays
export function encrypt(data) {
  if (!data) return data
  try {
    // If data is an object or array, stringify it first
    const textToEncrypt = typeof data === 'object' ? JSON.stringify(data) : String(data)
    const paddedText = `v1:${textToEncrypt}`
    return CryptoJS.AES.encrypt(paddedText, key).toString()
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

// Enhanced decryption function that handles objects and arrays
export function decrypt(encryptedText) {
  if (!encryptedText) return encryptedText
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, key)
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8)

    if (!decryptedText) {
      return encryptedText
    }

    // Remove version prefix
    const plainText = decryptedText.startsWith('v1:')
      ? decryptedText.substring(3)
      : decryptedText

    // Try parsing as JSON in case it's an encrypted object/array
    try {
      return JSON.parse(plainText)
    } catch {
      // If not valid JSON, return as is
      return plainText
    }
  } catch (error) {
    console.error('Decryption error:', error)
    return encryptedText
  }
}

// Facebook Account specific encryption/decryption
export function encryptFacebookAccount(account) {
  return {
    ...account,
    userId: encrypt(account.userId),
    password: encrypt(account.password),
    email: account.email ? encrypt(account.email) : null,
    emailPassword: account.emailPassword ? encrypt(account.emailPassword) : null,
    twoFASecret: encrypt(account.twoFASecret),
    tags: account.tags ? encrypt(account.tags) : ''
  }
}

export function decryptFacebookAccount(account) {
  if (!account) return account
  return {
    ...account,
    userId: decrypt(account.userId),
    password: decrypt(account.password),
    email: account.email ? decrypt(account.email) : null,
    emailPassword: account.emailPassword ? decrypt(account.emailPassword) : null,
    twoFASecret: decrypt(account.twoFASecret),
    tags: account.tags ? decrypt(account.tags) : ''
  }
}

// Utility functions for secure clipboard operations
export async function copyToClipboardSecurely(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()

      try {
        document.execCommand('copy')
        textArea.remove()
        return true
      } catch (err) {
        console.error('Failed to copy text:', err)
        textArea.remove()
        return false
      }
    }
  } catch (err) {
    console.error('Failed to copy text:', err)
    return false
  }
}

// Export utilities
export function prepareForExport(accounts, format = 'text') {
  // Ensure accounts is an array
  const accountsArray = Array.isArray(accounts) ? accounts : [accounts]

  // Decrypt all accounts
  const decryptedAccounts = accountsArray.map(decryptFacebookAccount)

  if (format === 'json') {
    return JSON.stringify(decryptedAccounts, null, 2)
  }

  // Default text format
  return decryptedAccounts.map(account => {
    return [
      `Account Details for ${account.userId}`,
      '----------------------------------------',
      `User ID: ${account.userId}`,
      `Password: ${account.password}`,
      account.email ? `Email: ${account.email}` : null,
      account.emailPassword ? `Email Password: ${account.emailPassword}` : null,
      `2FA Secret: ${account.twoFASecret}`,
      account.tags ? `Tags: ${account.tags}` : null,
      account.createdAt ? `Created: ${new Date(account.createdAt).toLocaleString()}` : null,
      account.updatedAt ? `Last Updated: ${new Date(account.updatedAt).toLocaleString()}` : null,
    ]
      .filter(Boolean)
      .join('\n')
  }).join('\n\n')
}