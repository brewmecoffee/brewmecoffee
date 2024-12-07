import { NextResponse } from 'next/server'
import prisma from '@/utils/prisma'
import { decrypt } from '@/utils/crypto'

export async function GET() {
  try {
    const accounts = await prisma.bankAccount.findMany({
      orderBy: { updatedAt: 'desc' },
    })

    // Format each account into a text block with decrypted values
    const textContent = accounts.map(account => {
      const sections = [
        `Bank Account Details for ${account.holderName}`,
        '----------------------------------------',
        `Account Holder: ${account.holderName}`,
        `Account Number: ${account.accountNumber}`,
        `Bank Name: ${account.bankName}`,
        `IFSC Code: ${account.ifsc}`,
        account.swiftCode ? `Swift Code: ${account.swiftCode}` : null,
        account.upi ? `UPI: ${account.upi}` : null,
        account.netBankingId ? `Net Banking ID: ${account.netBankingId}` : null,
        account.netBankingPassword ? `Net Banking Password: ${decrypt(account.netBankingPassword)}` : null,
        `Created: ${new Date(account.createdAt).toLocaleString()}`,
        `Last Updated: ${new Date(account.updatedAt).toLocaleString()}`,
        '\n'
      ].filter(Boolean)

      return sections.join('\n')
    }).join('\n')

    // Generate timestamp for filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `bank-accounts-${timestamp}.txt`

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