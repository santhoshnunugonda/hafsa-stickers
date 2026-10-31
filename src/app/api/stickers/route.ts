import { NextResponse } from 'next/server'
import {
  getStickersFromStorage,
  addStickersBatch,
  removeStickerById,
  updateStickerInStorage,
  isBlobConfigured,
} from '@/lib/serverStorage'
import { Sticker, generateId } from '@/lib/stickers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const result = await getStickersFromStorage()
  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Accept either a single sticker or an array of stickers for batch saving
    const items: any[] = Array.isArray(body)
      ? body
      : Array.isArray(body.stickers)
      ? body.stickers
      : [body]

    const validStickers: Sticker[] = items
      .filter((item) => item && typeof item.src === 'string' && item.src.length > 5)
      .map((item, index) => ({
        id: item.id || generateId(),
        name: (item.name || 'New Sticker').trim(),
        src: item.src,
        category: item.category || 'Custom',
        addedAt: item.addedAt || Date.now() + index,
        type:
          item.type ||
          (item.src.includes('.mp4') || item.src.startsWith('data:video') ? 'video' : 'image'),
      }))

    if (validStickers.length === 0) {
      return NextResponse.json({ error: 'No valid stickers provided' }, { status: 400 })
    }

    const result = await addStickersBatch(validStickers)

    return NextResponse.json({
      success: true,
      added: validStickers.length,
      stickers: result.stickers,
      syncActive: result.syncActive,
    })
  } catch (err: any) {
    console.error('POST /api/stickers error:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const updatedSticker: Sticker = await request.json()

    if (!updatedSticker.id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const result = await updateStickerInStorage(updatedSticker)

    return NextResponse.json({
      success: true,
      stickers: result.stickers,
      syncActive: result.syncActive,
    })
  } catch (err: any) {
    console.error('PUT /api/stickers error:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id parameter is required' }, { status: 400 })
    }

    const result = await removeStickerById(id)

    return NextResponse.json({
      success: true,
      stickers: result.stickers,
      syncActive: result.syncActive,
    })
  } catch (err: any) {
    console.error('DELETE /api/stickers error:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
