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
    return NextResponse.json(notes)
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json(
      { error: 'Error fetching notes' },
      { status: 500 }
    )
  }
}

export async function POST(req) {
  try {
    const data = await req.json()
    const note = await prisma.note.create({
      data: {
        title: data.title,
        content: data.content,
        isPinned: data.isPinned || false,
      },
    })
    return NextResponse.json(note)
  } catch (error) {
    console.error('Error creating note:', error)
    return NextResponse.json(
      { error: 'Error creating note' },
      { status: 500 }
    )
  }
}

export async function PUT(req) {
  try {
    const data = await req.json()
    const note = await prisma.note.update({
      where: { id: data.id },
      data: {
        title: data.title,
        content: data.content,
        isPinned: data.isPinned,
      },
    })
    return NextResponse.json(note)
  } catch (error) {
    console.error('Error updating note:', error)
    return NextResponse.json(
      { error: 'Error updating note' },
      { status: 500 }
    )
  }
}

export async function DELETE(req) {
  try {
    const data = await req.json()
    await prisma.note.delete({
      where: { id: data.id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting note:', error)
    return NextResponse.json(
      { error: 'Error deleting note' },
      { status: 500 }
    )
  }
}