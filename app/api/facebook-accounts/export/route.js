import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const accounts = await prisma.facebookAccount.findMany({
      orderBy: { updatedAt: 'desc' },
    })

    // Format each account into a text block
    const textContent = accounts
      .map((account) => {
        const sections = [
          `Account Details for ${account.userId}`,
          '----------------------------------------',
          `User ID: ${account.userId}`,
          `Password: ${account.password}`,
          account.email ? `Email: ${account.email}` : null,
          account.emailPassword
            ? `Email Password: ${account.emailPassword}`
            : null,
          `2FA Secret: ${account.twoFASecret}`,
          account.tags ? `Tags: ${account.tags}` : null,
          `Created: ${new Date(account.createdAt).toLocaleString()}`,
          `Last Updated: ${new Date(account.updatedAt).toLocaleString()}`,
          '\n',
        ].filter(Boolean)

        return sections.join('\n')
      })
      .join('\n')

    // Create text encoder
    const encoder = new TextEncoder()
    const data = encoder.encode(textContent)

    // Generate timestamp for filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `facebook-accounts-${timestamp}.txt`

    // Return properly encoded response
    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
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
