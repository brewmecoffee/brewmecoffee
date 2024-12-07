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
          `Code Snippet: ${snippet.name}`,
          `Language: ${snippet.language}`,
          '----------------------------------------',
          snippet.content,
          '',
          `Created: ${new Date(snippet.createdAt).toLocaleString()}`,
          `Last Updated: ${new Date(snippet.updatedAt).toLocaleString()}`,
          '',
          '========================================',
          '',
        ].join('\n')
      })
      .join('\n')

    // Create text encoder
    const encoder = new TextEncoder()
    const data = encoder.encode(textContent)

    // Generate timestamp for filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `code-snippets-${timestamp}.txt`

    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
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
