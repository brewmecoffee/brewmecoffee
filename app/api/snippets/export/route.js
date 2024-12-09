import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const snippets = await prisma.codeSnippet.findMany({
      orderBy: { updatedAt: 'desc' },
    })

    // Format snippets into readable text content
    const textContent = snippets
      .map((snippet) => {
        return [
          `Snippet: ${snippet.name}`,
          `Language: ${snippet.language}`,
          '----------------------------------------',
          snippet.content,
          '',
          `Created: ${new Date(snippet.createdAt).toLocaleString()}`,
          `Last Updated: ${new Date(snippet.updatedAt).toLocaleString()}`,
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
    const filename = `snippets-${timestamp}.txt`

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
    console.error('Error exporting snippets:', error)
    return NextResponse.json(
      { error: 'Error exporting snippets' },
      { status: 500 }
    )
  }
}