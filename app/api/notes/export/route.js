import { NextResponse } from 'next/server'
import prisma from '@/utils/prisma'

export async function GET() {
  try {
    const notes = await prisma.note.findMany({
      orderBy: [
        { isPinned: 'desc' },
        { updatedAt: 'desc' }
      ],
    })

    // Format notes into readable text content
    const textContent = notes.map(note => {
      return [
        `Title: ${note.title}`,
        `${note.isPinned ? '[Pinned Note]' : ''}`,
        '----------------------------------------',
        note.content,
        '',
        `Created: ${new Date(note.createdAt).toLocaleString()}`,
        `Last Updated: ${new Date(note.updatedAt).toLocaleString()}`,
        '========================================\n'
      ].filter(Boolean).join('\n')
    }).join('\n')

    // Generate timestamp for filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `notes-${timestamp}.txt`

    // Set headers for file download
    const headers = new Headers()
    headers.set('Content-Type', 'text/plain')
    headers.set('Content-Disposition', `attachment; filename="${filename}"`)

    return new NextResponse(textContent, {
      status: 200,
      headers
    })
  } catch (error) {
    console.error('Error exporting notes:', error)
    return NextResponse.json(
      { error: 'Error exporting notes' },
      { status: 500 }
    )
  }
}