import { NextResponse } from 'next/server'
import {
  getStickersFromStorage,
  saveStickersToStorage,
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
    const { name, src, category, type } = body

    if (!src) {
      return NextResponse.json({ error: 'src is required' }, { status: 400 })
    }

    const { stickers } = await getStickersFromStorage()

    const newSticker: Sticker = {
      id: body.id || generateId(),
      name: (name || 'New Sticker').trim(),
      src,
      category: category || 'Custom',
      addedAt: Date.now(),
      type: type || (src.includes('.mp4') || src.startsWith('data:video') ? 'video' : 'image'),
    }

    // Deduplicate: remove any item that might already have this id
    const filtered = stickers.filter((s) => s.id !== newSticker.id)
    const updatedList = [newSticker, ...filtered]

    const saved = await saveStickersToStorage(updatedList)

    return NextResponse.json({
      sticker: newSticker,
      syncActive: saved && isBlobConfigured(),
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

    const { stickers } = await getStickersFromStorage()
    const updatedList = stickers.map((s) => (s.id === updatedSticker.id ? updatedSticker : s))

    const saved = await saveStickersToStorage(updatedList)

    return NextResponse.json({
      sticker: updatedSticker,
      syncActive: saved && isBlobConfigured(),
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

    const { stickers } = await getStickersFromStorage()
    const updatedList = stickers.filter((s) => s.id !== id)

    const saved = await saveStickersToStorage(updatedList)

    return NextResponse.json({
      success: true,
      syncActive: saved && isBlobConfigured(),
    })
  } catch (err: any) {
    console.error('DELETE /api/stickers error:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
