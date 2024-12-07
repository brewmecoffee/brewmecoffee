import { NextResponse } from 'next/server'
import prisma from '@/utils/prisma'
import JSZip from 'jszip'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    // Fetch all messages ordered by date
    const messages = await prisma.message.findMany({
      orderBy: { createdAt: 'asc' },
    })

    // Create text content for messages
    const textContent = messages
      .filter(msg => msg.type === 'text')
      .map(msg => {
        return [
          `Date: ${new Date(msg.createdAt).toLocaleString()}`,
          `From: ${msg.sender}`,
          `Message: ${msg.content}`,
          '----------------------------------------'
        ].join('\n')
      })
      .join('\n\n')

    // Create zip file
    const zip = new JSZip()
    
    // Add text messages file
    zip.file('messages.txt', textContent)

    // Add media files if they exist
    const mediaMessages = messages.filter(msg => msg.type === 'media')
    if (mediaMessages.length > 0) {
      const mediaFolder = zip.folder('media')
      for (const msg of mediaMessages) {
        try {
          const filePath = join(process.cwd(), 'public', msg.content)
          const fileContent = await readFile(filePath)
          const fileName = msg.content.split('/').pop()
          mediaFolder.file(fileName, fileContent)
        } catch (err) {
          console.error(`Error adding file to zip: ${msg.content}`, err)
        }
      }
    }

    // Generate zip file
    const zipBlob = await zip.generateAsync({ type: 'blob' })

    // Set headers for file download
    const headers = new Headers()
    headers.set('Content-Type', 'application/zip')
    headers.set('Content-Disposition', `attachment; filename="messenger-export-${new Date().toISOString().replace(/[:.]/g, '-')}.zip"`)

    return new NextResponse(zipBlob, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error('Error exporting messages:', error)
    return NextResponse.json(
      { error: 'Error exporting messages' },
      { status: 500 }
    )
  }
}