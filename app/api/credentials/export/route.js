import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const credentials = await prisma.credential.findMany({
      orderBy: { updatedAt: 'desc' },
    })

    // Format credentials into readable text content
    const textContent = credentials.map(cred => {
      try {
        const customFields = JSON.parse(cred.customFields || '{}')
        
        return [
          `Credential Details for ${cred.service} (${cred.serviceType})`,
          '----------------------------------------',
          `Service: ${cred.service}`,
          `Type: ${cred.serviceType}`,
          cred.username ? `Username: ${cred.username}` : null,
          cred.email ? `Email: ${cred.email}` : null,
          `Password: ${cred.password}`,
          // Add custom fields if they exist
          ...Object.entries(customFields).map(([key, value]) => `${key}: ${value}`),
          `Created: ${new Date(cred.createdAt).toLocaleString()}`,
          `Last Updated: ${new Date(cred.updatedAt).toLocaleString()}`,
          '',
          '========================================',
          ''
        ].filter(Boolean).join('\n')
      } catch (error) {
        console.error(`Error processing credential ${cred.service}:`, error)
        return [
          `Error processing credential for ${cred.service}`,
          '----------------------------------------',
          'Failed to process custom fields',
          '',
          '========================================',
          ''
        ].join('\n')
      }
    }).join('\n')

    // Generate timestamp for filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `credentials-${timestamp}.txt`

    return new NextResponse(textContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting credentials:', error)
    return NextResponse.json(
      { error: 'Error exporting credentials' },
      { status: 500 }
    )
  }
}
