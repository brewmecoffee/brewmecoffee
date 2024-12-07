import { NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import prisma from '@/utils/prisma'

export async function POST(req) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    const fileName = `${Date.now()}-${file.name}`
    const filePath = `/uploads/${fileName}`
    await writeFile(join(uploadDir, fileName), buffer)

    const mediaType = file.type.startsWith('image/') ? 'image' : 'video'

    // Save message in database with the file URL as content
    const message = await prisma.message.create({
      data: {
        content: filePath,  // Store the file path as content
        type: 'media',
        sender: 'User',
        mediaUrl: filePath,
        mediaType: mediaType
      }
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Error uploading file' },
      { status: 500 }
    )
  }
}