import { put, del } from '@vercel/blob'
import { randomUUID } from 'crypto'

export async function uploadPaymentInstructionImage(file: File): Promise<string> {
  // Generate unique filename with proper extension
  const fileExtension = file.name.split('.').pop() || 'jpg'
  const fileName = `payment-instructions/${randomUUID()}.${fileExtension}`
  
  try {
    // Upload to Vercel Blob
    const blob = await put(fileName, file, {
      access: 'public',
    })
    
    // Return blob URL
    return blob.url
  } catch (error) {
    console.error('Failed to upload payment instruction image to blob:', error)
    throw new Error('Failed to upload image to blob storage')
  }
}

export async function deletePaymentInstructionImage(imageUrl: string): Promise<void> {
  // Check if it's a blob URL
  if (!imageUrl.includes('blob.vercel-storage.com')) {
    return // Not a blob URL, nothing to delete
  }

  try {
    // Extract the blob key from the URL
    const url = new URL(imageUrl)
    const pathname = url.pathname
    // Remove leading slash to get the blob key
    const blobKey = pathname.startsWith('/') ? pathname.slice(1) : pathname
    
    if (blobKey) {
      await del(blobKey)
      console.log('Payment instruction image deleted from blob storage:', blobKey)
    }
  } catch (error) {
    console.warn('Failed to delete payment instruction image from blob:', error)
  }
}
