import { NextResponse } from 'next/server'
import prisma from '@/utils/prisma'
import { decrypt } from '@/utils/crypto'

export async function GET() {
  try {
    const accounts = await prisma.facebookAccount.findMany({
      orderBy: { createdAt: 'desc' },
    })

    // Format each account into a text block with decrypted values
    const textContent = accounts.map(account => {
      const sections = [
        `Account Details for ${account.userId}`,
        '----------------------------------------',
        `User ID: ${account.userId}`,
        `Password: ${decrypt(account.password)}`,
        account.email ? `Email: ${account.email}` : null,
        account.emailPassword ? `Email Password: ${decrypt(account.emailPassword)}` : null,
        `2FA Secret: ${decrypt(account.twoFASecret)}`,
        account.tags && account.tags !== '' ? `Tags: ${account.tags}` : null,
        `Created: ${new Date(account.createdAt).toLocaleString()}`,
        `Last Updated: ${new Date(account.updatedAt).toLocaleString()}`,
        '\n'
      ].filter(Boolean) // Remove null entries

      return sections.join('\n')
    }).join('\n')

    // Generate timestamp for filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `facebook-accounts-${timestamp}.txt`

    // Set headers for file download
    const headers = new Headers()
    headers.set('Content-Type', 'text/plain')
    headers.set('Content-Disposition', `attachment; filename="${filename}"`)

    return new NextResponse(textContent, {
      status: 200,
      headers
    })
  } catch (error) {
    console.error('Error exporting accounts:', error)
    return NextResponse.json(
      { error: 'Error exporting accounts' },
      { status: 500 }
    )
  }
}