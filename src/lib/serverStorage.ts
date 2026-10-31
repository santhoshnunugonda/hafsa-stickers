import { put, list } from '@vercel/blob'
import { Sticker, DEFAULT_STICKERS, mergeStickers, generateId } from './stickers'

const DB_FILENAME = 'stickers-db.json'
const FALLBACK_BLOB_TOKEN = 'vercel_blob_rw_tVTpiADiCkaIAIIW_IJmxMc1JXmD4NL9rbBmgtB7SEQp5Ad'
const FALLBACK_STORE_ID = 'store_tVTpiADiCkaIAIIW'

// In-memory fallback
let memoryStickers: Sticker[] = [...DEFAULT_STICKERS]

// Mutex queue to prevent race conditions during concurrent writes
let writeQueue: Promise<any> = Promise.resolve()

export function getBlobToken(): string {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN
  if (process.env.VERCEL_BLOB_READ_WRITE_TOKEN) return process.env.VERCEL_BLOB_READ_WRITE_TOKEN
  if (process.env.blob_read_write_token) return process.env.blob_read_write_token

  // Find any environment variable containing both BLOB and TOKEN
  for (const [key, value] of Object.entries(process.env)) {
    if (key.toUpperCase().includes('BLOB') && key.toUpperCase().includes('TOKEN') && value) {
      return value
    }
  }

  return FALLBACK_BLOB_TOKEN
}

export function isBlobConfigured(): boolean {
  return true
}

export async function getStickersFromStorage(): Promise<{ stickers: Sticker[]; syncActive: boolean }> {
  if (!isBlobConfigured()) {
    return { stickers: memoryStickers, syncActive: false }
  }

  try {
    const token = getBlobToken()
    const listOptions = token ? { token } : undefined
    const { blobs } = await list(listOptions)
    const dbBlob = blobs.find((b) => b.pathname === DB_FILENAME)

    if (dbBlob) {
      const response = await fetch(`${dbBlob.url}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      })
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          // Always ensure default stickers are present in the list
          const merged = mergeStickers(data, DEFAULT_STICKERS)
          memoryStickers = merged
          return { stickers: merged, syncActive: true }
        }
      }
    }

    // Initialize with default stickers if db doesn't exist
    await saveStickersToStorage(DEFAULT_STICKERS)
    return { stickers: DEFAULT_STICKERS, syncActive: true }
  } catch (err) {
    console.error('Error fetching from Vercel Blob:', err)
    return { stickers: memoryStickers, syncActive: false }
  }
}

export async function saveStickersToStorage(stickers: Sticker[]): Promise<boolean> {
  memoryStickers = [...stickers]

  if (!isBlobConfigured()) {
    return false
  }

  try {
    const token = getBlobToken()
    const putOptions: any = {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
      contentType: 'application/json',
    }
    if (token) putOptions.token = token

    await put(DB_FILENAME, JSON.stringify(stickers, null, 2), putOptions)
    return true
  } catch (err) {
    console.error('Error saving to Vercel Blob:', err)
    return false
  }
}

// Atomic batch addition to prevent race conditions when uploading multiple stickers
export async function addStickersBatch(
  newStickers: Sticker[]
): Promise<{ stickers: Sticker[]; syncActive: boolean }> {
  return new Promise((resolve, reject) => {
    writeQueue = writeQueue.then(async () => {
      try {
        const { stickers } = await getStickersFromStorage()
        const newIds = new Set(newStickers.map((s) => s.id))
        const remaining = stickers.filter((s) => !newIds.has(s.id))
        const combined = [...newStickers, ...remaining]

        const saved = await saveStickersToStorage(combined)
        resolve({ stickers: combined, syncActive: saved && isBlobConfigured() })
      } catch (err) {
        reject(err)
      }
    })
  })
}

export async function removeStickerById(
  id: string
): Promise<{ stickers: Sticker[]; syncActive: boolean }> {
  return new Promise((resolve, reject) => {
    writeQueue = writeQueue.then(async () => {
      try {
        const { stickers } = await getStickersFromStorage()
        const updated = stickers.filter((s) => s.id !== id)
        const saved = await saveStickersToStorage(updated)
        resolve({ stickers: updated, syncActive: saved && isBlobConfigured() })
      } catch (err) {
        reject(err)
      }
    })
  })
}

export async function updateStickerInStorage(
  updatedSticker: Sticker
): Promise<{ stickers: Sticker[]; syncActive: boolean }> {
  return new Promise((resolve, reject) => {
    writeQueue = writeQueue.then(async () => {
      try {
        const { stickers } = await getStickersFromStorage()
        const updated = stickers.map((s) => (s.id === updatedSticker.id ? updatedSticker : s))
        const saved = await saveStickersToStorage(updated)
        resolve({ stickers: updated, syncActive: saved && isBlobConfigured() })
      } catch (err) {
        reject(err)
      }
    })
  })
}

export async function uploadMediaToBlob(
  file: File,
  filename: string
): Promise<{ url: string; syncActive: boolean }> {
  if (isBlobConfigured()) {
    try {
      const token = getBlobToken()
      const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
      const putOptions: any = { access: 'public' }
      if (token) putOptions.token = token

      const blob = await put(`stickers/${Date.now()}-${safeName}`, file, putOptions)
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
