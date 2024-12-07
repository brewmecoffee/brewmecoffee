import { NextResponse } from 'next/server'
import prisma from '@/utils/prisma'

export async function PUT(req, { params }) {
  try {
    const { id } = params
    const data = await req.json()

    const message = await prisma.message.update({
      where: { id: parseInt(id) },
      data: {
        content: data.content,
        type: data.type || 'text',
        sender: data.sender || 'User',
        mediaUrl: data.mediaUrl || null,
        mediaType: data.mediaType || null,
        isEdited: true
      },
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error('Error updating message:', error)
    return NextResponse.json(
      { error: 'Error updating message' },
      { status: 500 }
    )
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params

    // Verify message exists
    const message = await prisma.message.findUnique({
      where: { id: parseInt(id) }
    })

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }

    // Delete message
    await prisma.message.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting message:', error)
    return NextResponse.json(
      { error: 'Error deleting message' },
      { status: 500 }
    )
  }
}