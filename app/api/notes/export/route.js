import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const notes = await prisma.note.findMany({
      orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
    })

    // Format notes into readable text content
    const textContent = notes
      .map((note) => {
        return [
          `Title: ${note.title}`,
          `${note.isPinned ? '[Pinned Note]' : ''}`,
          '----------------------------------------',
          note.content,
          '',
          `Created: ${new Date(note.createdAt).toLocaleString()}`,
          `Last Updated: ${new Date(note.updatedAt).toLocaleString()}`,
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
    const filename = `notes-${timestamp}.txt`

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
    console.error('Error exporting notes:', error)
    return NextResponse.json(
      { error: 'Error exporting notes' },
      { status: 500 }
    )
  }
}