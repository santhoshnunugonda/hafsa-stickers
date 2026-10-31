export interface Sticker {
  id: string
  name: string
  src: string // data URL or public path
  category: string
  addedAt: number
  isDefault?: boolean
}

export const DEFAULT_STICKERS: Sticker[] = [
  {
    id: 'default-1',
    name: 'Hafsa & Friend 🖤',
    src: '/stickers/sticker1.png',
    category: 'Friends',
    addedAt: Date.now() - 4000,
    isDefault: true,
  },
  {
    id: 'default-2',
    name: 'Hafsa Pout 😙',
    src: '/stickers/sticker2.png',
    category: 'Expressions',
    addedAt: Date.now() - 3000,
    isDefault: true,
  },
  {
    id: 'default-3',
    name: 'Playing Together 🤝',
    src: '/stickers/sticker3.png',
    category: 'Fun',
    addedAt: Date.now() - 2000,
    isDefault: true,
  },
  {
    id: 'default-4',
    name: 'Sporty Hafsa 🏸',
    src: '/stickers/sticker4.png',
    category: 'Sports',
    addedAt: Date.now() - 1000,
    isDefault: true,
  },
]

export const CATEGORIES = ['All', 'Friends', 'Expressions', 'Fun', 'Sports', 'Custom']

export function generateId(): string {
  return `sticker-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function loadStickers(): Sticker[] {
  if (typeof window === 'undefined') return DEFAULT_STICKERS
  try {
    const saved = localStorage.getItem('hafsa-stickers')
    if (saved) {
      const parsed = JSON.parse(saved) as Sticker[]
      // Merge: keep defaults that haven't been deleted + user stickers
      return parsed
    }
  } catch {
    // ignore
  }
  return DEFAULT_STICKERS
}

export function saveStickers(stickers: Sticker[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('hafsa-stickers', JSON.stringify(stickers))
  } catch {
    // ignore
  }
}

export async function copyImageToClipboard(src: string): Promise<void> {
  // For data URLs (user-uploaded)
  if (src.startsWith('data:')) {
    const res = await fetch(src)
    const blob = await res.blob()
    const pngBlob = await convertToPng(blob)
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': pngBlob }),
    ])
    return
  }

  // For public paths (default stickers)
  const res = await fetch(src)
  const blob = await res.blob()
  const pngBlob = await convertToPng(blob)
  await navigator.clipboard.write([
    new ClipboardItem({ 'image/png': pngBlob }),
  ])
}

async function convertToPng(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('No canvas context'))
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      canvas.toBlob((b) => {
        if (b) resolve(b)
        else reject(new Error('Canvas toBlob failed'))
      }, 'image/png')
    }
    img.onerror = reject
    img.src = url
  })
}

export async function downloadSticker(src: string, name: string): Promise<void> {
  const res = await fetch(src)
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name.replace(/[^a-z0-9]/gi, '_')}.png`
  a.click()
  URL.revokeObjectURL(url)
}
