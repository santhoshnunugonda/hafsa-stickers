'use client'

import { useState } from 'react'
import { Sticker, isVideo } from '@/lib/stickers'

interface StickerCardProps {
  sticker: Sticker
  copied: boolean
  onCopy: () => void
  onDownload: () => void
  onEdit: () => void
  onDelete: () => void
}

export default function StickerCard({
  sticker,
  copied,
  onCopy,
  onDownload,
  onEdit,
  onDelete,
}: StickerCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [imgError, setImgError] = useState(false)
  const video = isVideo(sticker)

  return (
    <div className="sticker-card bg-white rounded-2xl shadow-sm border border-pink-50 overflow-hidden group relative">
      {/* Sticker Media */}
      <div className="aspect-square relative bg-gradient-to-br from-pink-50 to-purple-50 overflow-hidden">
        {imgError ? (
          <div className="w-full h-full flex items-center justify-center text-4xl">🖼️</div>
        ) : video ? (
          <>
            {/* Video badge */}
            <span className="absolute top-8 right-2 z-10 bg-black/70 text-white text-xs font-bold px-1.5 py-0.5 rounded-md">
              🎬 MP4
            </span>
            <video
              src={sticker.src}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImgError(true)}
            />
          </>
        ) : (
          <img
            src={sticker.src}
            alt={sticker.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        )}

        {/* Overlay actions on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          {video ? (
            /* Videos: download only */
            <button
              onClick={onDownload}
              className="bg-white hover:bg-green-50 rounded-full p-2.5 shadow-lg transition-all duration-200 tooltip"
              data-tooltip="Download MP4"
            >
              <span className="text-lg">⬇️</span>
            </button>
          ) : (
            <>
              <button
                onClick={onCopy}
                className={`${
                  copied ? 'bg-green-500 copied-animation' : 'bg-white hover:bg-pink-50'
                } rounded-full p-2.5 shadow-lg transition-all duration-200 tooltip`}
                data-tooltip={copied ? 'Copied!' : 'Copy for WhatsApp'}
              >
                <span className="text-lg">{copied ? '✅' : '📋'}</span>
              </button>
              <button
                onClick={onDownload}
                className="bg-white hover:bg-blue-50 rounded-full p-2.5 shadow-lg transition-all duration-200 tooltip"
                data-tooltip="Download"
              >
                <span className="text-lg">⬇️</span>
              </button>
            </>
          )}
        </div>

        {/* Category badge */}
        <span className="absolute top-2 left-2 bg-white/90 text-pink-600 text-xs font-semibold px-2 py-0.5 rounded-full">
          {sticker.category}
        </span>

        {/* More menu */}
        <div className="absolute top-2 right-2">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="bg-white/90 hover:bg-white rounded-full w-7 h-7 flex items-center justify-center text-gray-500 shadow-sm text-sm"
          >
            ⋮
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-8 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20 min-w-[130px]">
                <button
                  onClick={() => { onEdit(); setShowMenu(false) }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-pink-50 flex items-center gap-2"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => { onDownload(); setShowMenu(false) }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2"
                >
                  ⬇️ Download
                </button>
                <hr className="my-1 border-gray-100" />
                <button
                  onClick={() => { onDelete(); setShowMenu(false) }}
                  className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
                >
                  🗑️ Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sticker Name */}
      <div className="px-3 py-2">
        <p className="text-xs font-semibold text-gray-700 truncate">{sticker.name}</p>
      </div>

      {/* Action bar */}
      {video ? (
        <button
          onClick={onDownload}
          className="w-full py-2 text-xs font-bold bg-gradient-to-r from-purple-50 to-pink-50 text-purple-600 hover:from-purple-500 hover:to-pink-500 hover:text-white transition-all duration-200"
        >
          ⬇️ Download MP4 for WhatsApp
        </button>
      ) : (
        <button
          onClick={onCopy}
          className={`w-full py-2 text-xs font-bold transition-all duration-200 ${
            copied
              ? 'bg-green-500 text-white'
              : 'bg-gradient-to-r from-pink-50 to-purple-50 text-pink-600 hover:from-pink-500 hover:to-purple-500 hover:text-white'
          }`}
        >
          {copied ? '✅ Copied!' : '📋 Copy for WhatsApp'}
        </button>
      )}
    </div>
  )
}
