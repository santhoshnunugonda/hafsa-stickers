'use client'

import { useState, useRef } from 'react'
import toast from 'react-hot-toast'
import { Sticker, CATEGORIES, uploadMediaAPI } from '@/lib/stickers'

interface EditStickerModalProps {
  sticker: Sticker
  onSave: (updated: Sticker) => void
  onClose: () => void
}

const CUSTOM_CATEGORIES = CATEGORIES.filter((c) => c !== 'All')

export default function EditStickerModal({ sticker, onSave, onClose }: EditStickerModalProps) {
  const [name, setName] = useState(sticker.name)
  const [category, setCategory] = useState(sticker.category)
  const [preview, setPreview] = useState<string>(sticker.src)
  const [previewType, setPreviewType] = useState<'image' | 'video'>(sticker.type ?? 'image')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    const isVid = file.type.startsWith('video/')
    if (!file.type.startsWith('image/') && !isVid) {
      toast.error('Please choose an image or MP4 video')
      return
    }

    setSelectedFile(file)
    setPreviewType(isVid ? 'video' : 'image')

    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSaving) return

    setIsSaving(true)
    const toastId = toast.loading('Saving changes…')

    try {
      let finalSrc = preview

      if (selectedFile) {
        try {
          const uploadResult = await uploadMediaAPI(selectedFile)
          if (uploadResult?.url) {
            finalSrc = uploadResult.url
          }
        } catch (uploadErr) {
          console.warn('Upload API failed, using preview data:', uploadErr)
        }
      }

      toast.dismiss(toastId)
      onSave({
        ...sticker,
        name: name.trim() || sticker.name,
        category,
        src: finalSrc,
        type: previewType,
      })
    } catch (err) {
      toast.dismiss(toastId)
      toast.error('Failed to save changes')
      setIsSaving(false)
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
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-5 flex items-center justify-between">
          <div>
            <h2 className="text-white font-black text-xl">Edit Sticker</h2>
            <p className="text-purple-100 text-sm">Update sticker details</p>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="text-white/80 hover:text-white text-2xl w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          {/* Current image preview */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-36 h-36 rounded-2xl overflow-hidden bg-gradient-to-br from-pink-50 to-purple-50 border-2 border-pink-100 flex items-center justify-center">
              {previewType === 'video' ? (
                <video
                  src={preview}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={preview}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-sm text-pink-500 font-semibold hover:text-pink-700 underline underline-offset-2"
            >
              🔄 Replace Image/Video
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/mp4,video/webm,video/ogg,video/quicktime"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Sticker Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CUSTOM_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    category === cat
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-purple-50'
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
              disabled={isSaving}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isSaving ? 'Saving…' : 'Save Changes ✏️'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
