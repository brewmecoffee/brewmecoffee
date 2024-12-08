const CryptoJS = require('crypto-js')
const key = process.env.ENCRYPTION_KEY

function encrypt(text) {
  if (!text) return text
  const paddedText = `v1:${text}`
  return CryptoJS.AES.encrypt(paddedText, key).toString()
}

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

const testPassword = 'testpassword123'
console.log('Original:', testPassword)

const encrypted1 = encrypt(testPassword)
console.log('Encrypted 1:', encrypted1)
console.log('Decrypted 1:', decrypt(encrypted1))

const encrypted2 = encrypt(testPassword)
console.log('Encrypted 2:', encrypted2)
console.log('Decrypted 2:', decrypt(encrypted2))

console.log('Decryptions match:', decrypt(encrypted1) === decrypt(encrypted2))
