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

    // Create text encoder
    const encoder = new TextEncoder()
    const data = encoder.encode(textContent)

    // Generate timestamp for filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `notes-${timestamp}.txt`

    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
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
