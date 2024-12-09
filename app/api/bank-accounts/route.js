import { NextResponse } from 'next/server'
import prisma from '@/utils/prisma'
import { encryptBankAccount, decryptBankAccount, prepareForExport } from '@/utils/crypto'

export async function GET() {
  try {
    const accounts = await prisma.bankAccount.findMany({
      orderBy: { createdAt: 'desc' },
    })
    // Decrypt accounts before sending to client
    const decryptedAccounts = accounts.map(decryptBankAccount)
    return NextResponse.json(decryptedAccounts)
  } catch (error) {
    console.error('Error fetching accounts:', error)
    return NextResponse.json(
      { error: 'Error fetching accounts' },
      { status: 500 }
    )
  }
}

export async function POST(req) {
  try {
    const data = await req.json()
    // Encrypt data before saving to database
    const encryptedData = encryptBankAccount(data)
    const account = await prisma.bankAccount.create({
      data: {
        holderName: encryptedData.holderName,
        accountNumber: encryptedData.accountNumber,
        bankName: encryptedData.bankName,
        ifsc: encryptedData.ifsc,
        swiftCode: encryptedData.swiftCode || null,
        upi: encryptedData.upi || null,
        netBankingId: encryptedData.netBankingId || null,
        netBankingPassword: encryptedData.netBankingPassword || null,
      },
    })
    // Decrypt before sending response
    return NextResponse.json(decryptBankAccount(account))
  } catch (error) {
    console.error('Error creating account:', error)
    return NextResponse.json(
      { error: 'Error creating account' },
      { status: 500 }
    )
  }
}

export async function PUT(req) {
  try {
    const data = await req.json()
    // Encrypt data before updating
    const encryptedData = encryptBankAccount(data)
    const account = await prisma.bankAccount.update({
      where: { id: data.id },
      data: {
        holderName: encryptedData.holderName,
        accountNumber: encryptedData.accountNumber,
        bankName: encryptedData.bankName,
        ifsc: encryptedData.ifsc,
        swiftCode: encryptedData.swiftCode || null,
        upi: encryptedData.upi || null,
        netBankingId: encryptedData.netBankingId || null,
        netBankingPassword: encryptedData.netBankingPassword || null,
      },
    })
    // Decrypt before sending response
    return NextResponse.json(decryptBankAccount(account))
  } catch (error) {
    console.error('Error updating account:', error)
    return NextResponse.json(
      { error: 'Error updating account' },
      { status: 500 }
    )
  }
}

export async function DELETE(req) {
  try {
    const data = await req.json()
    await prisma.bankAccount.delete({
      where: { id: data.id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json(
      { error: 'Error deleting account' },
      { status: 500 }
    )
  }
}

// Export handler
export async function PATCH(req) {
  try {
    const { format = 'text' } = await req.json()
    const accounts = await prisma.bankAccount.findMany({
      orderBy: { createdAt: 'desc' },
    })
    
    const content = prepareForExport(accounts, format)
    
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': format === 'json' ? 'application/json' : 'text/plain',
        'Content-Disposition': `attachment; filename="bank-accounts.${format === 'json' ? 'json' : 'txt'}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting accounts:', error)
    return NextResponse.json(
      { error: 'Error exporting accounts' },
      { status: 500 }
    )
  }
}