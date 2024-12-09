import { NextResponse } from 'next/server'
import prisma from '@/utils/prisma'
import { encryptFacebookAccount, decryptFacebookAccount, prepareForExport } from '@/utils/crypto'

export async function GET() {
  try {
    const accounts = await prisma.facebookAccount.findMany({
      orderBy: { createdAt: 'desc' },
    })
    // Decrypt accounts before sending to client
    const decryptedAccounts = accounts.map(decryptFacebookAccount)
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
    const encryptedData = encryptFacebookAccount(data)
    const account = await prisma.facebookAccount.create({
      data: {
        userId: encryptedData.userId,
        password: encryptedData.password,
        email: encryptedData.email,
        emailPassword: encryptedData.emailPassword || null,
        twoFASecret: encryptedData.twoFASecret,
        tags: encryptedData.tags || '',
      },
    })
    // Decrypt before sending response
    return NextResponse.json(decryptFacebookAccount(account))
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
    const encryptedData = encryptFacebookAccount(data)
    const account = await prisma.facebookAccount.update({
      where: { id: data.id },
      data: {
        userId: encryptedData.userId,
        password: encryptedData.password,
        email: encryptedData.email,
        emailPassword: encryptedData.emailPassword || null,
        twoFASecret: encryptedData.twoFASecret,
        tags: encryptedData.tags || '',
      },
    })
    // Decrypt before sending response
    return NextResponse.json(decryptFacebookAccount(account))
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
    await prisma.facebookAccount.delete({
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
    const accounts = await prisma.facebookAccount.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const content = prepareForExport(accounts, format)

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': format === 'json' ? 'application/json' : 'text/plain',
        'Content-Disposition': `attachment; filename="facebook-accounts.${format === 'json' ? 'json' : 'txt'}"`,
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