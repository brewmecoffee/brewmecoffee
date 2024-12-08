import { NextResponse } from 'next/server'
import prisma from '@/utils/prisma'
import { encrypt } from '@/utils/crypto'

export async function GET() {
  try {
    const servers = await prisma.server.findMany({
      orderBy: { createdAt: 'desc' },
    })

    // Parse the customFields JSON string for each server
    const parsedServers = servers.map((server) => ({
      ...server,
      customFields: JSON.parse(server.customFields),
    }))

    return NextResponse.json(parsedServers)
  } catch (error) {
    console.error('Error fetching servers:', error)
    return NextResponse.json(
      { error: 'Error fetching servers' },
      { status: 500 }
    )
  }
}

export async function POST(req) {
  try {
    const data = await req.json()
    const server = await prisma.server.create({
      data: {
        serverIp: data.serverIp,
        rootPassword: encrypt(data.rootPassword), // Encrypt password before saving
        customFields: JSON.stringify(data.customFields || {}),
      },
    })

    // Parse customFields before returning
    return NextResponse.json({
      ...server,
      customFields: JSON.parse(server.customFields),
    })
  } catch (error) {
    console.error('Error creating server:', error)
    return NextResponse.json(
      { error: 'Error creating server' },
      { status: 500 }
    )
  }
}

export async function PUT(req) {
  try {
    const data = await req.json()
    const server = await prisma.server.update({
      where: { id: data.id },
      data: {
        serverIp: data.serverIp,
        rootPassword: encrypt(data.rootPassword), // Encrypt password before saving
        customFields: JSON.stringify(data.customFields || {}),
      },
    })

    // Parse customFields before returning
    return NextResponse.json({
      ...server,
      customFields: JSON.parse(server.customFields),
    })
  } catch (error) {
    console.error('Error updating server:', error)
    return NextResponse.json(
      { error: 'Error updating server' },
      { status: 500 }
    )
  }
}

export async function DELETE(req) {
  try {
    const data = await req.json()
    await prisma.server.delete({
      where: { id: data.id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting server:', error)
    return NextResponse.json(
      { error: 'Error deleting server' },
      { status: 500 }
    )
  }
}
