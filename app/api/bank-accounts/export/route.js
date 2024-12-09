import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const accounts = await prisma.bankAccount.findMany({
      orderBy: { updatedAt: 'desc' },
    })

    const textContent = accounts
      .map((account) => {
        const sections = [
          `Bank Account Details for ${account.holderName}`,
          '----------------------------------------',
          `Account Holder: ${account.holderName}`,
          `Account Number: ${account.accountNumber}`,
          `Bank Name: ${account.bankName}`,
          `IFSC Code: ${account.ifsc}`,
          account.swiftCode ? `Swift Code: ${account.swiftCode}` : null,
          account.upi ? `UPI: ${account.upi}` : null,
          account.netBankingId
            ? `Net Banking ID: ${account.netBankingId}`
            : null,
          account.netBankingPassword
            ? `Net Banking Password: ${account.netBankingPassword}`
            : null,
          `Created: ${new Date(account.createdAt).toLocaleString()}`,
          `Last Updated: ${new Date(account.updatedAt).toLocaleString()}`,
          '\n',
        ].filter(Boolean)

        return sections.join('\n')
      })
      .join('\n')

    // Generate timestamp for filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `bank-accounts-${timestamp}.txt`

    // Create Buffer from text content
    const buffer = Buffer.from(textContent, 'utf-8')

    // Return response with Buffer
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
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