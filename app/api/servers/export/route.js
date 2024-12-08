import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const servers = await prisma.server.findMany({
      orderBy: { updatedAt: 'desc' },
    })

    // Format each server into a text block
    const textContent = servers
      .map((server) => {
        try {
          const customFields =
            typeof server.customFields === 'string'
              ? JSON.parse(server.customFields)
              : server.customFields || {}

          const sections = [
            `Server Details for ${server.serverIp}`,
            '----------------------------------------',
            `Server IP: ${server.serverIp}`,
            `Root Password: ${server.rootPassword}`,
            ...Object.entries(customFields || {}).map(
              ([key, value]) => `${key}: ${value}`
            ),
            `Created: ${new Date(server.createdAt).toLocaleString()}`,
            `Last Updated: ${new Date(server.updatedAt).toLocaleString()}`,
            '\n',
          ]

          return sections.join('\n')
        } catch (err) {
          console.error(`Error processing server ${server.serverIp}:`, err)
          return `Error processing server ${server.serverIp}\n\n`
        }
      })
      .join('\n')

    // Create text encoder
    const encoder = new TextEncoder()
    const data = encoder.encode(textContent)

    // Generate timestamp for filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `servers-${timestamp}.txt`

    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting servers:', error)
    return NextResponse.json(
      { error: 'Error exporting servers' },
      { status: 500 }
    )
  }
}
