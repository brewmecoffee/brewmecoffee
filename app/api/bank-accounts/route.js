import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
import CryptoJS from 'crypto-js'

const prisma = new PrismaClient()
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || 'your-secret-key-at-least-32-chars-long'

const encrypt = (text) => {
  if (!text) return null
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString()
}

const decrypt = (ciphertext) => {
  if (!ciphertext) return null
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}

export async function GET() {
  try {
    const accounts = await prisma.bankAccount.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Decrypt sensitive data
    const decryptedAccounts = accounts.map((account) => ({
      ...account,
      netBankingPassword: account.netBankingPassword
        ? decrypt(account.netBankingPassword)
        : null,
    }))

    return NextResponse.json(decryptedAccounts)
  } catch (error) {
    console.error('Error fetching accounts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const data = await request.json()

    // Encrypt sensitive data
    const account = await prisma.bankAccount.create({
      data: {
        holderName: data.holderName,
        accountNumber: data.accountNumber,
        bankName: data.bankName,
        ifsc: data.ifsc,
        swiftCode: data.swiftCode,
        upi: data.upi,
        netBankingId: data.netBankingId,
        netBankingPassword: data.netBankingPassword
          ? encrypt(data.netBankingPassword)
          : null,
      },
    })

    return NextResponse.json(account)
  } catch (error) {
    console.error('Error creating account:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    const data = await request.json()

    const account = await prisma.bankAccount.update({
      where: { id: data.id },
      data: {
        holderName: data.holderName,
        accountNumber: data.accountNumber,
        bankName: data.bankName,
        ifsc: data.ifsc,
        swiftCode: data.swiftCode,
        upi: data.upi,
        netBankingId: data.netBankingId,
        netBankingPassword: data.netBankingPassword
          ? encrypt(data.netBankingPassword)
          : null,
      },
    })

    return NextResponse.json(account)
  } catch (error) {
    console.error('Error updating account:', error)
    return NextResponse.json(
      { error: 'Failed to update account' },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json()

    await prisma.bankAccount.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    )
  }
}
