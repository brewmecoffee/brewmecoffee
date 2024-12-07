import { authenticator } from 'otplib'

export function generate2FACode(secret) {
  try {
    return authenticator.generate(secret)
  } catch (error) {
    console.error('Error generating 2FA code:', error)
    return '------'
  }
}