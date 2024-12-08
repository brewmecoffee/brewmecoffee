import { NextResponse } from 'next/server'
import prisma from '@/utils/prisma'
import { encrypt } from '@/utils/crypto'

export async function GET() {
  try {
    const credentials = await prisma.credential.findMany({
      orderBy: { updatedAt: 'desc' },
    })

    // Parse customFields for each credential
    const parsedCredentials = credentials.map((cred) => ({
      ...cred,
      customFields: JSON.parse(cred.customFields),
    }))

    return NextResponse.json(parsedCredentials)
  } catch (error) {
    console.error('Error fetching credentials:', error)
    return NextResponse.json(
      { error: 'Error fetching credentials' },
      { status: 500 }
    )
  }
}

export async function POST(req) {
  try {
    const data = await req.json()
    const credential = await prisma.credential.create({
      data: {
        service: data.service,
        serviceType: data.serviceType,
        username: data.username,
        email: data.email,
        password: encrypt(data.password), // Encrypt password before saving
        customFields: JSON.stringify(data.customFields || {}),
      },
    })

    return NextResponse.json({
      ...credential,
      customFields: JSON.parse(credential.customFields),
    })
  } catch (error) {
    console.error('Error creating credential:', error)
    return NextResponse.json(
      { error: 'Error creating credential' },
      { status: 500 }
    )
  }
}

export async function PUT(req) {
  try {
    const data = await req.json()

    // Always encrypt password before saving
    const encryptedPassword = encrypt(data.password)

    const credential = await prisma.credential.update({
      where: { id: data.id },
      data: {
        service: data.service,
        serviceType: data.serviceType,
        username: data.username,
        email: data.email,
        password: encryptedPassword,
        customFields: JSON.stringify(data.customFields || {}),
      },
    })

    return NextResponse.json({
      ...credential,
      customFields: JSON.parse(credential.customFields),
    })
  } catch (error) {
    console.error('Error updating credential:', error)
    return NextResponse.json(
      { error: 'Error updating credential' },
      { status: 500 }
    )
  }
}

export async function DELETE(req) {
  try {
    const data = await req.json()
    await prisma.credential.delete({
      where: { id: data.id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting credential:', error)
    return NextResponse.json(
      { error: 'Error deleting credential' },
      { status: 500 }
    )
  }
}
