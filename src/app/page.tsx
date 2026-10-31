// Hafsa Stickers - Cloud Synced with Vercel Blob
'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  Sticker,
  DEFAULT_STICKERS,
  CATEGORIES,
  fetchStickersAPI,
  createStickerAPI,
  createStickersBatchAPI,
  updateStickerAPI,
  deleteStickerAPI,
  uploadMediaAPI,
  saveLocalStickers,
  loadLocalStickers,
  mergeStickers,
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
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncActive, setSyncActive] = useState(false)

  // Load stickers safely from server API and merge with local cache
  const loadStickers = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsSyncing(true)
    try {
      const local = loadLocalStickers()
      const data = await fetchStickersAPI()

      const serverStickers = Array.isArray(data.stickers) ? data.stickers : []
      const merged = mergeStickers(serverStickers, local)

      if (merged.length > 0) {
        setStickers(merged)
        saveLocalStickers(merged)
      }

      setSyncActive(data.syncActive)

      // Always auto-upload any local stickers that server didn't have yet in one atomic batch
      const serverIds = new Set(serverStickers.map((s) => s.id))
      const missingOnServer = local.filter((s) => !serverIds.has(s.id) && s.src)
      if (missingOnServer.length > 0) {
        const batchResult = await createStickersBatchAPI(missingOnServer)
        if (Array.isArray(batchResult.stickers) && batchResult.stickers.length > 0) {
          setStickers(batchResult.stickers)
          saveLocalStickers(batchResult.stickers)
        }
      }

      if (isManualRefresh) toast.success('Stickers refreshed from cloud! 🔄')
    } catch (err) {
      console.error('Failed to load stickers:', err)
      if (isManualRefresh) toast.error('Failed to refresh stickers')
    } finally {
      if (isManualRefresh) setIsSyncing(false)
      setMounted(true)
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadStickers()
  }, [loadStickers])

  // Real-time polling every 12 seconds so updates on mobile appear on desktop & vice versa
  useEffect(() => {
    const interval = setInterval(() => {
      // Background silent sync
      fetchStickersAPI().then((data) => {
        if (Array.isArray(data.stickers) && data.stickers.length > 0) {
          setStickers((prev) => {
            const merged = mergeStickers(data.stickers, prev)
            if (JSON.stringify(prev) !== JSON.stringify(merged)) {
              saveLocalStickers(merged)
              return merged
            }
            return prev
          })
          setSyncActive(data.syncActive)
        }
      }).catch(() => {})
    }, 12000)

    return () => clearInterval(interval)
  }, [])

  const filteredStickers = stickers.filter((s) => {
    const matchCat = activeCategory === 'All' || s.category === activeCategory
    const matchSearch =
      search === '' || s.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  // Copy with mobile-safe fallback
  const handleCopy = async (sticker: Sticker) => {
    if (isVideo(sticker)) {
      toast('⬇️ Video sticker — tap Download to save and send!', { icon: '🎬' })
      handleDownload(sticker)
      return
    }

    try {
      await copyImageToClipboard(sticker.src)
      setCopiedId(sticker.id)
      toast.success('📋 Copied! Paste it in WhatsApp ✅')
      setTimeout(() => setCopiedId(null), 2500)
    } catch (err: any) {
      // Mobile browsers often block direct clipboard write of images
      console.warn('Clipboard write failed, downloading instead:', err)
      await handleDownload(sticker)
      toast('📱 Image downloaded! You can now send it in WhatsApp.', {
        icon: '💬',
        duration: 3500,
      })
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

  const handleDelete = async (id: string) => {
    // Optimistic UI update
    setStickers((prev) => prev.filter((s) => s.id !== id))
    toast.success('🗑️ Sticker removed')

    // Server update
    await deleteStickerAPI(id)
  }

  const handleAdd = async (newSticker: Sticker) => {
    // Deduplicate: ensure this sticker is added only ONCE
    setStickers((prev) => [newSticker, ...prev.filter((s) => s.id !== newSticker.id)])
    setShowAddModal(false)
    toast.success('🎉 Sticker added to all devices!')

    // Server update
    const result = await createStickerAPI(newSticker)
    if (result?.syncActive !== undefined) {
      setSyncActive(result.syncActive)
    }
  }

  const handleEdit = async (updated: Sticker) => {
    // Optimistic UI update
    setStickers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
    setEditSticker(null)
    toast.success('✏️ Sticker updated!')

    // Server update
    await updateStickerAPI(updated)
  }

  // Drag-and-drop on outer page (only active when modal is closed)
  const [dragOver, setDragOver] = useState(false)
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    // Ignore if modal is open to prevent duplicate triggers
    if (showAddModal || editSticker) return

    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type.startsWith('image/') || f.type.startsWith('video/')
    )
    if (files.length === 0) {
      toast.error('Please drop image or MP4 video files only')
      return
    }

    const toastId = toast.loading(`Uploading ${files.length} sticker${files.length > 1 ? 's' : ''} to cloud…`)
    const uploadedBatch: Sticker[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const isVid = file.type.startsWith('video/')
      try {
        const uploadResult = await uploadMediaAPI(file)
        if (uploadResult?.url) {
          uploadedBatch.push({
            id: generateId(),
            name: file.name.replace(/\.[^/.]+$/, ''),
            src: uploadResult.url,
            category: 'Custom',
            addedAt: Date.now() + i,
            type: isVid ? 'video' : 'image',
          })
        }
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err)
      }
    }

    if (uploadedBatch.length > 0) {
      // Optimistically update UI
      setStickers((prev) => {
        const newIds = new Set(uploadedBatch.map((s) => s.id))
        return [...uploadedBatch, ...prev.filter((s) => !newIds.has(s.id))]
      })

      // Batch save to backend database
      await createStickersBatchAPI(uploadedBatch)
      toast.dismiss(toastId)
      toast.success(`🎉 ${uploadedBatch.length} stickers added & synced across all devices!`)
    } else {
      toast.dismiss(toastId)
      toast.error('Failed to upload stickers. Please try again.')
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 float-animation">🐒</div>
          <p className="text-pink-500 font-semibold text-lg">Loading Hafsa Stickers…</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen"
      onDragOver={(e) => {
        if (!showAddModal && !editSticker) {
          e.preventDefault()
          setDragOver(true)
        }
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Drag overlay on main page */}
      {dragOver && !showAddModal && !editSticker && (
        <div className="fixed inset-0 z-40 bg-pink-500/20 backdrop-blur-sm border-4 border-dashed border-pink-400 flex items-center justify-center pointer-events-none">
          <div className="text-center bg-white rounded-3xl p-10 shadow-2xl">
            <div className="text-6xl mb-3">📂</div>
            <p className="text-2xl font-bold text-pink-600">Drop stickers here!</p>
            <p className="text-gray-500 mt-1">Images &amp; MP4 videos will sync to all devices</p>
          </div>
        </div>
      )}

      <Header
        search={search}
        onSearchChange={setSearch}
        onAddClick={() => setShowAddModal(true)}
        onRefreshClick={() => loadStickers(true)}
        stickerCount={stickers.length}
        isSyncing={isSyncing}
        syncActive={syncActive}
      />

      <main className="max-w-7xl mx-auto px-4 pb-16 pt-6">
        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${
                activeCategory === cat
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-200 scale-105'
                  : 'bg-white text-gray-600 hover:bg-pink-50 border border-pink-100 hover:border-pink-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Stats bar */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs sm:text-sm text-gray-500">
            {filteredStickers.length === 0
              ? 'No stickers found'
              : `${filteredStickers.length} sticker${filteredStickers.length === 1 ? '' : 's'}`}
            {search && ` for "${search}"`}
          </p>
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
              className="aspect-square rounded-2xl border-2 border-dashed border-pink-200 hover:border-pink-400 bg-pink-50/40 hover:bg-pink-50 flex flex-col items-center justify-center gap-2 transition-all duration-200 group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">➕</span>
              <span className="text-xs text-pink-500 font-semibold">Add Sticker</span>
            </button>
          </div>
        )}

        {/* WhatsApp usage tip */}
        <div className="mt-10 bg-white rounded-3xl border border-green-100 p-5 sm:p-6 flex flex-col sm:flex-row items-start gap-4 shadow-sm">
          <div className="text-4xl flex-shrink-0">💬</div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-800 text-base mb-1">How to use in WhatsApp</h3>
            <div className="grid sm:grid-cols-2 gap-3 text-xs sm:text-sm text-gray-600 mt-2">
              <div className="bg-green-50/60 p-3 rounded-xl border border-green-100">
                <p className="font-bold text-green-800 mb-1">💻 On Computer (WhatsApp Web):</p>
                <p>Click <strong>Copy</strong> → switch to WhatsApp Web chat → press <kbd className="bg-white px-1.5 py-0.5 rounded text-xs border font-mono">Ctrl+V</kbd> to paste &amp; send!</p>
              </div>
              <div className="bg-pink-50/60 p-3 rounded-xl border border-pink-100">
                <p className="font-bold text-pink-800 mb-1">📱 On Mobile Phone:</p>
                <p>Tap <strong>Copy</strong> (or <strong>Download</strong>) → send as a photo/video directly into your WhatsApp chats!</p>
              </div>
            </div>
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
