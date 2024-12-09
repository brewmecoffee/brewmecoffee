import { NextResponse } from 'next/server'
import prisma from '@/utils/prisma'
import { encryptServer, decryptServer, prepareForExport } from '@/utils/crypto'

export async function GET() {
  try {
    const servers = await prisma.server.findMany({
      orderBy: { createdAt: 'desc' },
    })
    // Decrypt servers before sending to client
    const decryptedServers = servers.map(decryptServer)
    return NextResponse.json(decryptedServers)
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
    // Encrypt data before saving to database
    const encryptedData = encryptServer(data)
    const server = await prisma.server.create({
      data: {
        serverIp: encryptedData.serverIp,
        rootPassword: encryptedData.rootPassword,
        customFields: typeof encryptedData.customFields === 'string' 
          ? encryptedData.customFields 
          : JSON.stringify(encryptedData.customFields)
      },
    })
    // Decrypt before sending response
    return NextResponse.json(decryptServer(server))
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
    // Encrypt data before updating
    const encryptedData = encryptServer(data)
    const server = await prisma.server.update({
      where: { id: data.id },
      data: {
        serverIp: encryptedData.serverIp,
        rootPassword: encryptedData.rootPassword,
        customFields: typeof encryptedData.customFields === 'string' 
          ? encryptedData.customFields 
          : JSON.stringify(encryptedData.customFields)
      },
    })
    // Decrypt before sending response
    return NextResponse.json(decryptServer(server))
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

// Export handler
export async function PATCH(req) {
  try {
    const { format = 'text' } = await req.json()
    const servers = await prisma.server.findMany({
      orderBy: { createdAt: 'desc' },
    })
    
    const content = prepareForExport(servers, format)
    
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': format === 'json' ? 'application/json' : 'text/plain',
        'Content-Disposition': `attachment; filename="servers.${format === 'json' ? 'json' : 'txt'}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting servers:', error)
    return NextResponse.json(
      { error: 'Error exporting servers' },
      { status: 500 }
    )
  }
}