'use client'

import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import {
  Sticker,
  DEFAULT_STICKERS,
  CATEGORIES,
  loadStickers,
  saveStickers,
  generateId,
  copyImageToClipboard,
  downloadSticker,
  isVideo,
} from '@/lib/stickers'
import StickerCard from '@/components/StickerCard'
import AddStickerModal from '@/components/AddStickerModal'
import EditStickerModal from '@/components/EditStickerModal'
import Header from '@/components/Header'
import EmptyState from '@/components/EmptyState'

export default function Home() {
  const [stickers, setStickers] = useState<Sticker[]>([])
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editSticker, setEditSticker] = useState<Sticker | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    setStickers(loadStickers())
    setMounted(true)
  }, [])

  // Save to localStorage whenever stickers change
  useEffect(() => {
    if (mounted) saveStickers(stickers)
  }, [stickers, mounted])

  const filteredStickers = stickers.filter((s) => {
    const matchCat = activeCategory === 'All' || s.category === activeCategory
    const matchSearch =
      search === '' || s.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const handleCopy = async (sticker: Sticker) => {
    if (isVideo(sticker)) {
      toast('⬇️ Video sticker — use Download to save it!', { icon: '🎬' })
      return
    }
    try {
      await copyImageToClipboard(sticker.src)
      setCopiedId(sticker.id)
      toast.success('📋 Copied! Paste it in WhatsApp ✅')
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error('Copy failed — try downloading instead')
    }
  }

  const handleDownload = async (sticker: Sticker) => {
    try {
      await downloadSticker(sticker.src, sticker.name, sticker.type)
      toast.success('⬇️ Downloaded!')
    } catch {
      toast.error('Download failed')
    }
  }

  const handleDelete = (id: string) => {
    setStickers((prev) => prev.filter((s) => s.id !== id))
    toast.success('🗑️ Sticker removed')
  }

  const handleAdd = (sticker: Sticker) => {
    setStickers((prev) => [sticker, ...prev])
    setShowAddModal(false)
    toast.success('🎉 Sticker added!')
  }

  const handleEdit = (updated: Sticker) => {
    setStickers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
    setEditSticker(null)
    toast.success('✏️ Sticker updated!')
  }

  const handleReset = () => {
    setStickers(DEFAULT_STICKERS)
    saveStickers(DEFAULT_STICKERS)
    toast.success('🔄 Reset to defaults!')
  }

  // Drag-and-drop file upload on main page
  const [dragOver, setDragOver] = useState(false)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type.startsWith('image/') || f.type.startsWith('video/')
    )
    if (files.length === 0) {
      toast.error('Please drop image or video files only')
      return
    }
    files.forEach((file) => {
      const isVid = file.type.startsWith('video/')
      const reader = new FileReader()
      reader.onload = (ev) => {
        const src = ev.target?.result as string
        const newSticker: Sticker = {
          id: generateId(),
          name: file.name.replace(/\.[^/.]+$/, ''),
          src,
          category: 'Custom',
          addedAt: Date.now(),
          type: isVid ? 'video' : 'image',
        }
        setStickers((prev) => [newSticker, ...prev])
        toast.success(`🎉 "${newSticker.name}" added!`)
      }
      reader.readAsDataURL(file)
    })
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 float-animation">💖</div>
          <p className="text-pink-500 font-medium">Loading Hafsa Stickers…</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {dragOver && (
        <div className="fixed inset-0 z-50 bg-pink-500/20 border-4 border-dashed border-pink-400 flex items-center justify-center">
          <div className="text-center bg-white rounded-2xl p-10 shadow-2xl">
            <div className="text-6xl mb-3">📂</div>
            <p className="text-2xl font-bold text-pink-600">Drop stickers here!</p>
            <p className="text-gray-500 mt-1">Images & MP4 videos will be added automatically</p>
          </div>
        </div>
      )}

      <Header
        search={search}
        onSearchChange={setSearch}
        onAddClick={() => setShowAddModal(true)}
        stickerCount={stickers.length}
      />

      <main className="max-w-7xl mx-auto px-4 pb-16 pt-6">
        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                activeCategory === cat
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-200'
                  : 'bg-white text-gray-600 hover:bg-pink-50 border border-pink-100 hover:border-pink-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Stats bar */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            {filteredStickers.length === 0
              ? 'No stickers found'
              : `${filteredStickers.length} sticker${filteredStickers.length === 1 ? '' : 's'}`}
            {search && ` for "${search}"`}
          </p>
          <button
            onClick={handleReset}
            className="text-xs text-gray-400 hover:text-pink-500 transition-colors underline underline-offset-2"
          >
            Reset to defaults
          </button>
        </div>

        {/* Sticker Grid */}
        {filteredStickers.length === 0 ? (
          <EmptyState
            search={search}
            onAddClick={() => setShowAddModal(true)}
            onClearSearch={() => setSearch('')}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredStickers.map((sticker) => (
              <StickerCard
                key={sticker.id}
                sticker={sticker}
                copied={copiedId === sticker.id}
                onCopy={() => handleCopy(sticker)}
                onDownload={() => handleDownload(sticker)}
                onEdit={() => setEditSticker(sticker)}
                onDelete={() => handleDelete(sticker.id)}
              />
            ))}
            {/* Add new sticker tile */}
            <button
              onClick={() => setShowAddModal(true)}
              className="aspect-square rounded-2xl border-2 border-dashed border-pink-200 hover:border-pink-400 bg-pink-50/50 hover:bg-pink-50 flex flex-col items-center justify-center gap-2 transition-all duration-200 group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">➕</span>
              <span className="text-xs text-pink-400 font-medium">Add Sticker</span>
            </button>
          </div>
        )}

        <div className="mt-10 bg-white rounded-2xl border border-green-100 p-5 flex items-start gap-4 shadow-sm">
          <div className="text-3xl flex-shrink-0">💬</div>
          <div>
            <h3 className="font-bold text-gray-800 mb-1">How to use in WhatsApp</h3>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li><strong>Image stickers:</strong> Click <strong>Copy</strong> → open WhatsApp Web → press <kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">Ctrl+V</kbd></li>
              <li><strong>Video stickers 🎬:</strong> Click <strong>Download MP4</strong> → send as a video in WhatsApp mobile</li>
            </ol>
            <p className="text-xs text-gray-400 mt-2">
              💡 Tip: WhatsApp Web supports pasting images directly. For videos, send from your phone.
            </p>
          </div>
        </div>
      </main>

      {/* Modals */}
      {showAddModal && (
        <AddStickerModal
          onAdd={handleAdd}
          onClose={() => setShowAddModal(false)}
        />
      )}
      {editSticker && (
        <EditStickerModal
          sticker={editSticker}
          onSave={handleEdit}
          onClose={() => setEditSticker(null)}
        />
      )}
    </div>
  )
}

