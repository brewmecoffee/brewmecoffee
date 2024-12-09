import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
import { decrypt } from '@/utils/crypto'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const servers = await prisma.server.findMany({
      orderBy: { updatedAt: 'desc' },
    })

    // Format each server into a text block
    const textContent = servers
      .map((server) => {
        try {
          // Handle encrypted serverIp and rootPassword
          const serverIp = typeof server.serverIp === 'string' && server.serverIp.startsWith('U2FsdGVkX1') 
            ? decrypt(server.serverIp) 
            : server.serverIp

          const rootPassword = typeof server.rootPassword === 'string' && server.rootPassword.startsWith('U2FsdGVkX1')
            ? decrypt(server.rootPassword)
            : server.rootPassword

          // Parse custom fields
          let customFields = {}
          try {
            if (typeof server.customFields === 'string') {
              // Handle encrypted custom fields
              if (server.customFields.startsWith('U2FsdGVkX1')) {
                const decrypted = decrypt(server.customFields)
                customFields = typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted
              } else {
                // Handle non-encrypted JSON string
                customFields = JSON.parse(server.customFields)
              }
            } else {
              // Handle case where customFields is already an object
              customFields = server.customFields || {}
            }
          } catch (e) {
            console.error('Error parsing custom fields:', e)
            customFields = {}
          }

          const sections = [
            `Server Details for ${serverIp}`,
            '----------------------------------------',
            `Server IP: ${serverIp}`,
            `Root Password: ${rootPassword}`,
            ...(Object.keys(customFields).length > 0 ? ['', 'Custom Fields:'] : []),
            ...Object.entries(customFields).map(
              ([key, value]) => {
                const decryptedValue = typeof value === 'string' && value.startsWith('U2FsdGVkX1')
                  ? decrypt(value)
                  : value
                return `${key}: ${decryptedValue}`
              }
            ),
            '',
            `Created: ${new Date(server.createdAt).toLocaleString()}`,
            `Last Updated: ${new Date(server.updatedAt).toLocaleString()}`,
            '\n',
          ]

          return sections.join('\n')
        } catch (err) {
          console.error(`Error processing server ${server.id}:`, err)
          return `Error processing server ID ${server.id}\n\n`
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