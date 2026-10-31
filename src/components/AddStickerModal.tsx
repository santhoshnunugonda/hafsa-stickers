'use client'

import { useState, useRef, useCallback } from 'react'
import { Sticker, generateId, CATEGORIES } from '@/lib/stickers'

interface AddStickerModalProps {
  onAdd: (sticker: Sticker) => void
  onClose: () => void
}

const CUSTOM_CATEGORIES = CATEGORIES.filter((c) => c !== 'All')

export default function AddStickerModal({ onAdd, onClose }: AddStickerModalProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Custom')
  const [preview, setPreview] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const src = e.target?.result as string
      setPreview(src)
      if (!name) setName(file.name.replace(/\.[^/.]+$/, ''))
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleSubmit = () => {
    if (!preview) return
    const sticker: Sticker = {
      id: generateId(),
      name: name.trim() || 'My Sticker',
      src: preview,
      category,
      addedAt: Date.now(),
    }
    onAdd(sticker)
  }

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-5 flex items-center justify-between">
          <div>
            <h2 className="text-white font-black text-xl">Add New Sticker</h2>
            <p className="text-pink-100 text-sm">Upload an image to add to your collection</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-2xl w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Upload area */}
          <div
            className={`upload-area rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer min-h-[180px] ${
              dragOver ? 'drag-over' : ''
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-40 max-w-full rounded-xl object-contain"
                />
                <button
                  onClick={(e) => { e.stopPropagation(); setPreview(null) }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <div className="text-5xl mb-3">🖼️</div>
                <p className="font-semibold text-gray-600 text-center">
                  Click or drag &amp; drop image
                </p>
                <p className="text-sm text-gray-400 mt-1">PNG, JPG, GIF, WebP supported</p>
              </>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Sticker Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hafsa Vibing 😄"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CUSTOM_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    category === cat
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-pink-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!preview}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Add Sticker 🎉
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
