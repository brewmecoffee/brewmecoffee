import { NextResponse } from 'next/server'
import prisma from '@/utils/prisma'

export async function GET() {
  try {
    const messages = await prisma.message.findMany({
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Error fetching messages' },
      { status: 500 }
    )
  }
}

export async function POST(req) {
  try {
    const data = await req.json()
    const message = await prisma.message.create({
      data: {
        content: data.content,
        type: data.type || 'text',
        sender: data.sender || 'User',
        mediaUrl: data.mediaUrl,
        mediaType: data.mediaType
      },
    })
    return NextResponse.json(message)
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json(
      { error: 'Error creating message' },
      { status: 500 }
    )
  }
}