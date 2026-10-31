import { NextResponse } from 'next/server'
import { uploadMediaToBlob } from '@/lib/serverStorage'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const result = await uploadMediaToBlob(file, file.name)
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('POST /api/upload error:', err)
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 })
  }
}
