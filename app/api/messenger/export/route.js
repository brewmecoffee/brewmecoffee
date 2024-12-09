import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const messages = await prisma.message.findMany({
      orderBy: { createdAt: 'asc' },
    })

    // Format messages into readable text content
    const textContent = messages
      .map((msg) => {
        return [
          `From: ${msg.sender}`,
          `Type: ${msg.type}`,
          '----------------------------------------',
          msg.content,
          msg.mediaUrl ? `Media URL: ${msg.mediaUrl}` : null,
          msg.mediaType ? `Media Type: ${msg.mediaType}` : null,
          `Sent: ${new Date(msg.createdAt).toLocaleString()}`,
          msg.isEdited ? '(Edited)' : '',
          '========================================\n',
        ]
          .filter(Boolean)
          .join('\n')
      })
      .join('\n')

    // Create Buffer from text content
    const buffer = Buffer.from(textContent, 'utf-8')

    // Generate timestamp for filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `messages-${timestamp}.txt`

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
    console.error('Error exporting messages:', error)
    return NextResponse.json(
      { error: 'Error exporting messages' },
      { status: 500 }
    )
  }
}