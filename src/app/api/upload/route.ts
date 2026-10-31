import { NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { put } from '@vercel/blob'
import { getBlobToken } from '@/lib/serverStorage'

export const dynamic = 'force-dynamic'

export async function POST(request: Request): Promise<NextResponse> {
  const token = getBlobToken()
  const contentType = request.headers.get('content-type') || ''

  // 1. Direct client-upload token generation (for @vercel/blob/client upload)
  if (contentType.includes('application/json')) {
    if (!token) {
      return NextResponse.json(
        { error: 'BLOB_READ_WRITE_TOKEN is not configured on server' },
        { status: 400 }
      )
    }

    try {
      const body = (await request.json()) as HandleUploadBody
      const jsonResponse = await handleUpload({
        body,
        request,
        token,
        onBeforeGenerateToken: async () => {
          return {
            allowedContentTypes: [
              'image/jpeg',
              'image/png',
              'image/gif',
              'image/webp',
              'image/svg+xml',
              'video/mp4',
              'video/webm',
              'video/quicktime',
              'video/ogg',
            ],
            maximumSizeInBytes: 60 * 1024 * 1024, // 60MB
          }
        },
        onUploadCompleted: async ({ blob }) => {
          console.log('Blob direct upload finished:', blob.url)
        },
      })
      return NextResponse.json(jsonResponse)
    } catch (err: any) {
      console.error('handleUpload error:', err)
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
  }

  // 2. Fallback FormData file upload
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (token) {
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const blob = await put(`stickers/${Date.now()}-${safeName}`, file, {
        access: 'public',
        token,
      })
      return NextResponse.json({ url: blob.url, syncActive: true })
    }

    // Local fallback: convert to base64
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const mimeType = file.type || 'image/png'
    const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`
    return NextResponse.json({ url: dataUrl, syncActive: false })
  } catch (err: any) {
    console.error('POST /api/upload error:', err)
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 })
  }
}
