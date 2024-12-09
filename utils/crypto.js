// utils/crypto.js
import CryptoJS from 'crypto-js'

const key =
  process.env.ENCRYPTION_KEY ||
  process.env.NEXT_PUBLIC_ENCRYPTION_KEY ||
  'eT9QYgXmbJ4QFHss9fDkUm3Zd8VNyLC2'

// Base encryption function
export function encrypt(data) {
  if (!data) return data
  try {
    const textToEncrypt = typeof data === 'object' ? JSON.stringify(data) : String(data)
    const paddedText = `v1:${textToEncrypt}`
    return CryptoJS.AES.encrypt(paddedText, key).toString()
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

// Base decryption function
export function decrypt(encryptedText) {
  if (!encryptedText) return encryptedText
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, key)
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8)

    if (!decryptedText) {
      return encryptedText
    }

    const plainText = decryptedText.startsWith('v1:') 
      ? decryptedText.substring(3) 
      : decryptedText

    try {
      return JSON.parse(plainText)
    } catch {
      return plainText
    }
  } catch (error) {
    console.error('Decryption error:', error)
    return encryptedText
  }
}

// Facebook Account encryption/decryption
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

// Bank Account encryption/decryption
export function encryptBankAccount(account) {
  return {
    ...account,
    holderName: encrypt(account.holderName),
    accountNumber: encrypt(account.accountNumber),
    bankName: encrypt(account.bankName),
    ifsc: encrypt(account.ifsc),
    swiftCode: account.swiftCode ? encrypt(account.swiftCode) : null,
    upi: account.upi ? encrypt(account.upi) : null,
    netBankingId: account.netBankingId ? encrypt(account.netBankingId) : null,
    netBankingPassword: account.netBankingPassword ? encrypt(account.netBankingPassword) : null
  }
}

export function decryptBankAccount(account) {
  if (!account) return account
  return {
    ...account,
    holderName: decrypt(account.holderName),
    accountNumber: decrypt(account.accountNumber),
    bankName: decrypt(account.bankName),
    ifsc: decrypt(account.ifsc),
    swiftCode: account.swiftCode ? decrypt(account.swiftCode) : null,
    upi: account.upi ? decrypt(account.upi) : null,
    netBankingId: account.netBankingId ? decrypt(account.netBankingId) : null,
    netBankingPassword: account.netBankingPassword ? decrypt(account.netBankingPassword) : null
  }
}

// Server encryption/decryption
export function encryptServer(server) {
  const customFields = server.customFields 
    ? typeof server.customFields === 'string' 
      ? JSON.parse(server.customFields)
      : server.customFields
    : {}

  return {
    ...server,
    serverIp: encrypt(server.serverIp),
    rootPassword: encrypt(server.rootPassword),
    customFields: encrypt(customFields)
  }
}

export function decryptServer(server) {
  if (!server) return server

  const decryptedCustomFields = decrypt(server.customFields)
  const parsedCustomFields = typeof decryptedCustomFields === 'string'
    ? JSON.parse(decryptedCustomFields)
    : decryptedCustomFields

  return {
    ...server,
    serverIp: decrypt(server.serverIp),
    rootPassword: decrypt(server.rootPassword),
    customFields: parsedCustomFields
  }
}

// Export preparation for all account types
export function prepareForExport(data, format = 'text') {
  if (!data) return ''

  // Determine the type of data based on properties
  const isServer = 'serverIp' in (Array.isArray(data) ? data[0] || {} : data)
  const isFacebookAccount = !isServer && 'userId' in (Array.isArray(data) ? data[0] || {} : data)
  
  const accountsArray = Array.isArray(data) ? data : [data]
  
  const decryptedAccounts = accountsArray.map(account => {
    if (isServer) return decryptServer(account)
    if (isFacebookAccount) return decryptFacebookAccount(account)
    return decryptBankAccount(account)
  })
  
  if (format === 'json') {
    return JSON.stringify(decryptedAccounts, null, 2)
  }
  
  return decryptedAccounts.map(account => {
    if (isServer) {
      const customFieldsStr = Object.entries(account.customFields)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n')

      return [
        `Server Details for ${account.serverIp}`,
        '----------------------------------------',
        `Server IP: ${account.serverIp}`,
        `Root Password: ${account.rootPassword}`,
        customFieldsStr ? `\nCustom Fields:\n${customFieldsStr}` : null,
        account.createdAt ? `\nCreated: ${new Date(account.createdAt).toLocaleString()}` : null,
        account.updatedAt ? `Last Updated: ${new Date(account.updatedAt).toLocaleString()}` : null,
      ].filter(Boolean).join('\n')
    } else if (isFacebookAccount) {
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
      ].filter(Boolean).join('\n')
    } else {
      return [
        `Bank Account Details for ${account.holderName}`,
        '----------------------------------------',
        `Account Holder: ${account.holderName}`,
        `Bank Name: ${account.bankName}`,
        `Account Number: ${account.accountNumber}`,
        `IFSC Code: ${account.ifsc}`,
        account.swiftCode ? `SWIFT Code: ${account.swiftCode}` : null,
        account.upi ? `UPI ID: ${account.upi}` : null,
        account.netBankingId ? `Net Banking ID: ${account.netBankingId}` : null,
        account.netBankingPassword ? `Net Banking Password: ${account.netBankingPassword}` : null,
        account.createdAt ? `Created: ${new Date(account.createdAt).toLocaleString()}` : null,
        account.updatedAt ? `Last Updated: ${new Date(account.updatedAt).toLocaleString()}` : null,
      ].filter(Boolean).join('\n')
    }
  }).join('\n\n')
}

// Clipboard utilities
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

// Secure string comparison for authentication
export function compareSecurely(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false
  }
  return CryptoJS.SHA256(a).toString() === CryptoJS.SHA256(b).toString()
}