import { put, list } from '@vercel/blob'
import { Sticker, DEFAULT_STICKERS } from './stickers'

const DB_FILENAME = 'stickers-db.json'

// In-memory fallback if Blob token is not configured yet
let memoryStickers: Sticker[] = [...DEFAULT_STICKERS]

export function isBlobConfigured(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN
}

export async function getStickersFromStorage(): Promise<{ stickers: Sticker[]; syncActive: boolean }> {
  if (!isBlobConfigured()) {
    return { stickers: memoryStickers, syncActive: false }
  }

  try {
    const { blobs } = await list({ prefix: DB_FILENAME })
    const dbBlob = blobs.find((b) => b.pathname === DB_FILENAME) || blobs[0]

    if (dbBlob) {
      const response = await fetch(`${dbBlob.url}?t=${Date.now()}`, {
        cache: 'no-store',
      })
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data) && data.length > 0) {
          return { stickers: data, syncActive: true }
        }
      }
    }

    // If no db file exists in Blob yet, initialize it with DEFAULT_STICKERS
    await saveStickersToStorage(DEFAULT_STICKERS)
    return { stickers: DEFAULT_STICKERS, syncActive: true }
  } catch (err) {
    console.error('Error fetching from Vercel Blob:', err)
    return { stickers: memoryStickers, syncActive: false }
  }
}

export async function saveStickersToStorage(stickers: Sticker[]): Promise<boolean> {
  // Always update in-memory cache
  memoryStickers = [...stickers]

  if (!isBlobConfigured()) {
    return false
  }

  try {
    await put(DB_FILENAME, JSON.stringify(stickers, null, 2), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json',
    })
    return true
  } catch (err) {
    console.error('Error saving to Vercel Blob:', err)
    return false
  }
}

export async function uploadMediaToBlob(
  file: File,
  filename: string
): Promise<{ url: string; syncActive: boolean }> {
  if (isBlobConfigured()) {
    try {
      const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
      const blob = await put(`stickers/${Date.now()}-${safeName}`, file, {
        access: 'public',
      })
      return { url: blob.url, syncActive: true }
    } catch (err) {
      console.error('Vercel Blob upload failed, falling back:', err)
    }
  }

  // Fallback: convert file to Base64 data URL
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const mimeType = file.type || 'image/png'
  const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`
  return { url: dataUrl, syncActive: false }
}

