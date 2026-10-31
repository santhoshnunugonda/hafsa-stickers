export interface Sticker {
  id: string
  name: string
  src: string
  category: string
  addedAt: number
  isDefault?: boolean
  type?: 'image' | 'video'
}

export function isVideo(sticker: Sticker): boolean {
  if (sticker.type === 'video') return true
  if (sticker.src.startsWith('data:video')) return true
  return /\.(mp4|webm|mov|ogg)(\?|$)/i.test(sticker.src)
}

export const DEFAULT_STICKERS: Sticker[] = [
  {
    id: 'default-1',
    name: 'Hafsa & Friend 🖤',
    src: '/stickers/sticker1.png',
    category: 'Friends',
    addedAt: 1730400000000,
    isDefault: true,
    type: 'image',
  },
  {
    id: 'default-2',
    name: 'Hafsa Pout 😙',
    src: '/stickers/sticker2.png',
    category: 'Expressions',
    addedAt: 1730400001000,
    isDefault: true,
    type: 'image',
  },
  {
    id: 'default-3',
    name: 'Playing Together 🤝',
    src: '/stickers/sticker3.png',
    category: 'Fun',
    addedAt: 1730400002000,
    isDefault: true,
    type: 'image',
  },
  {
    id: 'default-4',
    name: 'Sporty Hafsa 🏸',
    src: '/stickers/sticker4.png',
    category: 'Sports',
    addedAt: 1730400003000,
    isDefault: true,
    type: 'image',
  },
  {
    id: 'default-5',
    name: 'Hafsa Video Sticker 🎬',
    src: '/stickers/sticker-video1.mp4',
    category: 'Fun',
    addedAt: 1730400004000,
    isDefault: true,
    type: 'video',
  },
]

export const CATEGORIES = ['All', 'Friends', 'Expressions', 'Fun', 'Sports', 'Custom']

export function generateId(): string {
  return `sticker-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// API CLIENT FUNCTIONS
export async function fetchStickersAPI(): Promise<{ stickers: Sticker[]; syncActive: boolean }> {
  try {
    const res = await fetch(`/api/stickers?t=${Date.now()}`, {
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data.stickers) && data.stickers.length > 0) {
        return data
      }
    }
  } catch (err) {
    console.warn('API fetch failed, falling back to local storage:', err)
  }

  return { stickers: loadLocalStickers(), syncActive: false }
}

export async function createStickerAPI(sticker: Sticker): Promise<{ sticker: Sticker; syncActive: boolean }> {
  try {
    const res = await fetch('/api/stickers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sticker),
    })
    if (res.ok) {
      return await res.json()
    }
  } catch (err) {
    console.warn('API create failed:', err)
  }
  return { sticker, syncActive: false }
}

export async function updateStickerAPI(sticker: Sticker): Promise<{ sticker: Sticker; syncActive: boolean }> {
  try {
    const res = await fetch('/api/stickers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sticker),
    })
    if (res.ok) {
      return await res.json()
    }
  } catch (err) {
    console.warn('API update failed:', err)
  }
  return { sticker, syncActive: false }
}

export async function deleteStickerAPI(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/stickers?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    return res.ok
  } catch (err) {
    console.warn('API delete failed:', err)
    return false
  }
}

export async function uploadMediaAPI(file: File): Promise<{ url: string; syncActive: boolean }> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    throw new Error('Upload failed')
  }

  return await res.json()
}

// LOCAL STORAGE CACHE / FALLBACK
export function loadLocalStickers(): Sticker[] {
  if (typeof window === 'undefined') return DEFAULT_STICKERS
  try {
    const saved = localStorage.getItem('hafsa-stickers')
    if (saved) {
      const parsed = JSON.parse(saved) as Sticker[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_STICKERS
}

export function saveLocalStickers(stickers: Sticker[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('hafsa-stickers', JSON.stringify(stickers))
  } catch {
    // ignore
  }
}

// COPY TO CLIPBOARD
export async function copyImageToClipboard(src: string): Promise<void> {
  if (src.startsWith('data:video') || /\.(mp4|webm|mov|ogg)(\?|$)/i.test(src)) {
    throw new Error('VIDEO_COPY_NOT_SUPPORTED')
  }

  // Fetch the image from URL (data URL, public path, or Blob CDN)
  const res = await fetch(src)
  const blob = await res.blob()
  const pngBlob = await convertToPng(blob)

  if (!navigator.clipboard || !navigator.clipboard.write) {
    throw new Error('CLIPBOARD_API_UNAVAILABLE')
  }

  await navigator.clipboard.write([
    new ClipboardItem({ 'image/png': pngBlob }),
  ])
}

async function convertToPng(blob: Blob): Promise<Blob> {
  if (blob.type === 'image/png') {
    return blob
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    const url = URL.createObjectURL(blob)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth || 400
      canvas.height = img.naturalHeight || 400
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        return reject(new Error('No canvas context'))
      }
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      canvas.toBlob((b) => {
        if (b) resolve(b)
        else reject(new Error('Canvas toBlob failed'))
      }, 'image/png')
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image decode error'))
    }
    img.src = url
  })
}

// DOWNLOAD STICKER
export async function downloadSticker(src: string, name: string, type?: 'image' | 'video'): Promise<void> {
  const isVid = type === 'video' || /\.(mp4|webm|mov)(\?|$)/i.test(src) || src.startsWith('data:video')
  const ext = isVid ? 'mp4' : 'png'
  const res = await fetch(src)
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name.replace(/[^a-z0-9]/gi, '_')}.${ext}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
