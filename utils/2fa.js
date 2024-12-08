// utils/2fa.js
import { authenticator } from 'otplib'
import QRCode from 'qrcode'

// Existing function for generating 2FA codes
export function generate2FACode(secret) {
  try {
    return authenticator.generate(secret)
  } catch (error) {
    console.error('Error generating 2FA code:', error)
    return '------'
  }
}

// New function for initial 2FA setup
export function generate2FASecret(username) {
  try {
    const secret = authenticator.generateSecret()
    const otpauth_url = authenticator.keyuri(username, 'BharatiyanNews', secret)
    return {
      secret,
      otpauth_url,
    }
  } catch (error) {
    console.error('Error generating 2FA secret:', error)
    throw new Error('Failed to generate 2FA secret')
  }
}

// New function for verifying 2FA tokens
export function verify2FAToken(secret, token) {
  try {
    return authenticator.verify({
      secret,
      token,
      window: 1, // Allow 1 step before/after for time drift
    })
  } catch (error) {
    console.error('Error verifying 2FA token:', error)
    return false
  }
}

// New function to generate QR code for 2FA setup
export async function generateQRCode(otpauth_url) {
  try {
    return await QRCode.toDataURL(otpauth_url)
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

// New function to validate token format
export function isValidToken(token) {
  return /^\d{6}$/.test(token)
}
