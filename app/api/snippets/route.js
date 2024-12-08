import { NextResponse } from 'next/server'
import prisma from '@/utils/prisma'

export async function GET() {
  try {
    const snippets = await prisma.codeSnippet.findMany({
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json(snippets)
  } catch (error) {
    console.error('Error fetching snippets:', error)
    return NextResponse.json(
      { error: 'Error fetching snippets' },
      { status: 500 }
    )
  }
}

export async function POST(req) {
  try {
    const data = await req.json()
    const snippet = await prisma.codeSnippet.create({
      data: {
        name: data.name,
        content: data.content,
        language: data.language,
      },
    })
    return NextResponse.json(snippet)
  } catch (error) {
    console.error('Error creating snippet:', error)
    return NextResponse.json(
      { error: 'Error creating snippet' },
      { status: 500 }
    )
  }
}

export async function PUT(req) {
  try {
    const data = await req.json()
    const snippet = await prisma.codeSnippet.update({
      where: { id: data.id },
      data: {
        name: data.name,
        content: data.content,
        language: data.language,
      },
    })
    return NextResponse.json(snippet)
  } catch (error) {
    console.error('Error updating snippet:', error)
    return NextResponse.json(
      { error: 'Error updating snippet' },
      { status: 500 }
    )
  }
}

export async function DELETE(req) {
  try {
    const data = await req.json()
    await prisma.codeSnippet.delete({
      where: { id: data.id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting snippet:', error)
    return NextResponse.json(
      { error: 'Error deleting snippet' },
      { status: 500 }
    )
  }
}
