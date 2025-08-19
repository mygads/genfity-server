import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { verifyAdminToken } from '@/lib/auth-helpers'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const adminVerification = await verifyAdminToken(request)
    if (!adminVerification.success) {
      return NextResponse.json(
        { success: false, error: adminVerification.error },
        { status: 403 }
      )
    }

    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'File must be an image' },
        { status: 400 }
      )
    }    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    // Generate unique filename with proper extension
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const uniqueFilename = `payment-instructions/${randomUUID()}.${fileExtension}`

    try {
      // Upload to Vercel Blob
      const blob = await put(uniqueFilename, file, {
        access: 'public',
      })

      // Return the blob URL
      return NextResponse.json({
        success: true,
        imageUrl: blob.url,
        filename: uniqueFilename,
        message: 'Image uploaded successfully'
      })
    } catch (uploadError) {
      console.error('Blob upload error:', uploadError)
      return NextResponse.json(
        { success: false, error: 'Failed to upload image to blob storage' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}
