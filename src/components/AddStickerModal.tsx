'use client'

import { useState, useRef } from 'react'
import toast from 'react-hot-toast'
import { Sticker, generateId, CATEGORIES, uploadMediaAPI } from '@/lib/stickers'

interface AddStickerModalProps {
  onAdd: (sticker: Sticker) => void
  onClose: () => void
}

const CUSTOM_CATEGORIES = CATEGORIES.filter((c) => c !== 'All')

export default function AddStickerModal({ onAdd, onClose }: AddStickerModalProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Custom')
  const [preview, setPreview] = useState<string | null>(null)
  const [fileType, setFileType] = useState<'image' | 'video'>('image')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    const isVid = file.type.startsWith('video/')
    if (!file.type.startsWith('image/') && !isVid) {
      toast.error('Please choose an image or MP4 video')
      return
    }

    setSelectedFile(file)
    setFileType(isVid ? 'video' : 'image')
    if (!name) {
      setName(file.name.replace(/\.[^/.]+$/, ''))
    }

    // Local instant preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!preview || isUploading) return

    setIsUploading(true)
    const toastId = toast.loading('Adding sticker…')

    try {
      let finalSrc = preview

      // If a real file was picked, upload it to the server/Blob
      if (selectedFile) {
        try {
          const uploadResult = await uploadMediaAPI(selectedFile)
          if (uploadResult?.url) {
            finalSrc = uploadResult.url
          }
        } catch (uploadErr) {
          console.warn('Upload API failed, using local preview data:', uploadErr)
        }
      }

      const sticker: Sticker = {
        id: generateId(),
        name: name.trim() || 'My Sticker',
        src: finalSrc,
        category,
        addedAt: Date.now(),
        type: fileType,
      }

      toast.dismiss(toastId)
      onAdd(sticker)
    } catch (err: any) {
      toast.dismiss(toastId)
      toast.error('Failed to add sticker')
      setIsUploading(false)
    }
  }

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-5 flex items-center justify-between">
          <div>
            <h2 className="text-white font-black text-xl">Add New Sticker</h2>
            <p className="text-pink-100 text-sm">Upload an image or MP4 video sticker</p>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="text-white/80 hover:text-white text-2xl w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Upload area */}
          <div
            className={`upload-area rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer min-h-[180px] ${
              dragOver ? 'drag-over' : ''
            }`}
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setDragOver(true)
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setDragOver(false)
            }}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            {preview ? (
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                {fileType === 'video' ? (
                  <video
                    src={preview}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="max-h-40 max-w-full rounded-xl object-contain"
                  />
                ) : (
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-40 max-w-full rounded-xl object-contain"
                  />
                )}
                <span className="absolute -top-2 -left-2 bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {fileType === 'video' ? '🎬 MP4' : '🖼️ Image'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPreview(null)
                    setSelectedFile(null)
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <div className="text-5xl mb-3">🖼️🎬</div>
                <p className="font-semibold text-gray-600 text-center">
                  Click or drag &amp; drop
                </p>
                <p className="text-sm text-gray-400 mt-1">PNG, JPG, GIF, WebP, <strong>MP4</strong>, WebM</p>
              </>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/mp4,video/webm,video/ogg,video/quicktime"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          {/* Video tip */}
          {fileType === 'video' && (
            <div className="bg-purple-50 rounded-xl p-3 flex gap-2 items-start text-xs text-purple-700">
              <span className="text-base">💡</span>
              <span>Video stickers can be <strong>downloaded</strong> and sent as videos in WhatsApp.</span>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Sticker Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hafsa Dancing 💃"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
            <div className="flex flex-wrap gap-2">
              {CUSTOM_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
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
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!preview || isUploading}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {isUploading ? 'Uploading…' : 'Add Sticker 🎉'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
