import { NextResponse } from 'next/server'
import prisma from '@/utils/prisma'
import { decryptFacebookAccount, prepareForExport } from '@/utils/crypto'

export async function GET(req) {
  try {
    const accounts = await prisma.facebookAccount.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const content = prepareForExport(accounts)
    
    // Set appropriate headers for file download
    const headers = new Headers()
    headers.set('Content-Type', 'text/plain')
    headers.set(
      'Content-Disposition',
      `attachment; filename="facebook-accounts-${new Date().toISOString().split('T')[0]}.txt"`
    )

    return new NextResponse(content, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error('Error exporting accounts:', error)
    return NextResponse.json(
      { error: 'Error exporting accounts' },
      { status: 500 }
    )
  }
}

export async function POST(req) {
  try {
    const { id, format = 'text' } = await req.json()
    
    const account = await prisma.facebookAccount.findUnique({
      where: { id },
    })
    
    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    const content = prepareForExport(account, format)
    
    // Set appropriate headers for file download
    const headers = new Headers()
    headers.set('Content-Type', format === 'json' ? 'application/json' : 'text/plain')
    headers.set(
      'Content-Disposition',
      `attachment; filename="facebook-account-${account.id}.${format === 'json' ? 'json' : 'txt'}"`
    )

    return new NextResponse(content, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error('Error exporting account:', error)
    return NextResponse.json(
      { error: 'Error exporting account' },
      { status: 500 }
    )
  }
}