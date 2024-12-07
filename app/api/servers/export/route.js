import { NextResponse } from 'next/server'
import prisma from '@/utils/prisma'
import { decrypt } from '@/utils/crypto'

export async function GET() {
  try {
    const servers = await prisma.server.findMany({
      orderBy: { updatedAt: 'desc' },
    })

    // Format each server into a text block
    const textContent = servers.map(server => {
      try {
        const customFields = typeof server.customFields === 'string'
          ? JSON.parse(server.customFields)
          : server.customFields || {}

        const sections = [
          `Server Details for ${server.serverIp}`,
          '----------------------------------------',
          `Server IP: ${server.serverIp}`,
          `Root Password: ${server.rootPassword ? decrypt(server.rootPassword) : ''}`,
          ...Object.entries(customFields || {}).map(([key, value]) => `${key}: ${value}`),
          `Created: ${new Date(server.createdAt).toLocaleString()}`,
          `Last Updated: ${new Date(server.updatedAt).toLocaleString()}`,
          '\n'
        ]

        return sections.join('\n')
      } catch (err) {
        console.error(`Error processing server ${server.serverIp}:`, err)
        return `Error processing server ${server.serverIp}\n\n`
      }
    }).join('\n')

    // Generate timestamp for filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `servers-${timestamp}.txt`

    // Set headers for file download
    const headers = new Headers()
    headers.set('Content-Type', 'text/plain')
    headers.set('Content-Disposition', `attachment; filename="${filename}"`)

    return new NextResponse(textContent, {
      status: 200,
      headers
    })
  } catch (error) {
    console.error('Error exporting servers:', error)
    return NextResponse.json(
      { error: 'Error exporting servers' },
      { status: 500 }
    )
  }
}