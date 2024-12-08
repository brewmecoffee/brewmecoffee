import { NextResponse } from 'next/server'
import prisma from '@/utils/prisma'
import { decrypt } from '@/utils/crypto'

export async function GET(req, { params }) {
  try {
    const { id } = params

    const credential = await prisma.credential.findUnique({
      where: { id: parseInt(id) },
    })

    if (!credential) {
      return NextResponse.json(
        { error: 'Credential not found' },
        { status: 404 }
      )
    }

    let decryptedPassword
    try {
      decryptedPassword = decrypt(credential.password)
    } catch (error) {
      console.error('Error decrypting password:', error)
      decryptedPassword = '*** Failed to decrypt password ***'
    }

    const customFields = JSON.parse(credential.customFields || '{}')

    // Format the credential into readable text
    const textContent = [
      `Credential Details for ${credential.service} (${credential.serviceType})`,
      '----------------------------------------',
      `Service: ${credential.service}`,
      `Type: ${credential.serviceType}`,
      credential.username ? `Username: ${credential.username}` : null,
      credential.email ? `Email: ${credential.email}` : null,
      `Password: ${decryptedPassword}`,
      // Add custom fields if they exist
      ...Object.entries(customFields).map(([key, value]) => `${key}: ${value}`),
      `Created: ${new Date(credential.createdAt).toLocaleString()}`,
      `Last Updated: ${new Date(credential.updatedAt).toLocaleString()}`,
    ]
      .filter(Boolean)
      .join('\n')

    // Generate filename
    const sanitizedService = credential.service
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `credential-${sanitizedService}-${timestamp}.txt`

    // Set headers for file download
    const headers = new Headers()
    headers.set('Content-Type', 'text/plain')
    headers.set('Content-Disposition', `attachment; filename="${filename}"`)

    return new NextResponse(textContent, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error('Error exporting credential:', error)
    return NextResponse.json(
      { error: 'Error exporting credential' },
      { status: 500 }
    )
  }
}
