import { NextResponse } from 'next/server'
import prisma from '@/utils/prisma'

export async function DELETE() {
  try {
    // Delete all messages
    await prisma.message.deleteMany({})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting messages:', error)
    return NextResponse.json(
      { error: 'Error deleting messages' },
      { status: 500 }
    )
  }
}
