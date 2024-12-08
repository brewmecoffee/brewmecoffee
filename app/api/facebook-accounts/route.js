import { NextResponse } from 'next/server'
import prisma from '@/utils/prisma'

export async function GET() {
  try {
    const accounts = await prisma.facebookAccount.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(accounts)
  } catch (error) {
    console.error('Error fetching accounts:', error)
    return NextResponse.json(
      { error: 'Error fetching accounts' },
      { status: 500 }
    )
  }
}

export async function POST(req) {
  try {
    const data = await req.json()
    const account = await prisma.facebookAccount.create({
      data: {
        userId: data.userId,
        password: data.password,
        email: data.email,
        emailPassword: data.emailPassword || null,
        twoFASecret: data.twoFASecret,
        tags: data.tags || '',
      },
    })
    return NextResponse.json(account)
  } catch (error) {
    console.error('Error creating account:', error)
    return NextResponse.json(
      { error: 'Error creating account' },
      { status: 500 }
    )
  }
}

export async function PUT(req) {
  try {
    const data = await req.json()
    const account = await prisma.facebookAccount.update({
      where: { id: data.id },
      data: {
        userId: data.userId,
        password: data.password,
        email: data.email,
        emailPassword: data.emailPassword || null,
        twoFASecret: data.twoFASecret,
        tags: data.tags || '',
      },
    })
    return NextResponse.json(account)
  } catch (error) {
    console.error('Error updating account:', error)
    return NextResponse.json(
      { error: 'Error updating account' },
      { status: 500 }
    )
  }
}

export async function DELETE(req) {
  try {
    const data = await req.json()
    await prisma.facebookAccount.delete({
      where: { id: data.id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json(
      { error: 'Error deleting account' },
      { status: 500 }
    )
  }
}
