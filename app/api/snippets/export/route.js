import { NextResponse } from 'next/server'
import prisma from '@/utils/prisma'

export async function GET() {
  try {
    const snippets = await prisma.codeSnippet.findMany({
      orderBy: { updatedAt: 'desc' },
    })

    // Format snippets into readable text content
    const textContent = snippets.map(snippet => {
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
        ''
      ].join('\n')
    }).join('\n')

    // Generate timestamp for filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `code-snippets-${timestamp}.txt`

    // Set headers for file download
    const headers = new Headers()
    headers.set('Content-Type', 'text/plain')
    headers.set('Content-Disposition', `attachment; filename="${filename}"`)

    return new NextResponse(textContent, {
      status: 200,
      headers
    })
  } catch (error) {
    console.error('Error exporting snippets:', error)
    return NextResponse.json(
      { error: 'Error exporting snippets' },
      { status: 500 }
    )
  }
}