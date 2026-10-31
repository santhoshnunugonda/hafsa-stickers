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
    <div className="sticker-card bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden group relative flex flex-col justify-between">
      {/* Sticker Media */}
      <div className="aspect-square relative bg-gradient-to-br from-pink-50 to-purple-50 overflow-hidden">
        {imgError ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-pink-50/60 border border-pink-100">
            <span className="text-3xl mb-1">🖼️</span>
            <p className="text-[11px] font-semibold text-gray-600 truncate max-w-full">
              {sticker.name}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">Image failed to load</p>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="mt-2 text-xs font-bold text-red-500 hover:text-red-700 bg-white shadow-sm border border-red-200 px-3 py-1 rounded-full transition-transform hover:scale-105"
            >
              🗑️ Remove
            </button>
          </div>
        ) : video ? (
          <>
            <span className="absolute top-2 right-10 z-10 bg-black/75 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-sm">
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

        {/* Overlay actions on desktop hover */}
        {!imgError && (
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
            {video ? (
              <button
                onClick={onDownload}
                className="bg-white hover:bg-green-50 rounded-full p-2.5 shadow-lg transition-transform hover:scale-110 tooltip"
                data-tooltip="Download MP4"
              >
                <span className="text-lg">⬇️</span>
              </button>
            ) : (
              <>
                <button
                  onClick={onCopy}
                  className={`${
                    copied ? 'bg-green-500 text-white' : 'bg-white hover:bg-pink-50'
                  } rounded-full p-2.5 shadow-lg transition-transform hover:scale-110 tooltip`}
                  data-tooltip={copied ? 'Copied!' : 'Copy for WhatsApp'}
                >
                  <span className="text-lg">{copied ? '✅' : '📋'}</span>
                </button>
                <button
                  onClick={onDownload}
                  className="bg-white hover:bg-blue-50 rounded-full p-2.5 shadow-lg transition-transform hover:scale-110 tooltip"
                  data-tooltip="Download"
                >
                  <span className="text-lg">⬇️</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* Category badge */}
        <span className="absolute top-2 left-2 bg-white/90 text-pink-600 text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm backdrop-blur-sm">
          {sticker.category}
        </span>

        {/* More menu */}
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="bg-white/90 hover:bg-white rounded-full w-7 h-7 flex items-center justify-center text-gray-600 shadow-sm text-sm"
          >
            ⋮
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-8 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20 min-w-[130px]">
                <button
                  onClick={() => {
                    onEdit()
                    setShowMenu(false)
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-pink-50 flex items-center gap-2"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => {
                    onDownload()
                    setShowMenu(false)
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-blue-50 flex items-center gap-2"
                >
                  ⬇️ Download
                </button>
                <hr className="my-1 border-gray-100" />
                <button
                  onClick={() => {
                    onDelete()
                    setShowMenu(false)
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 flex items-center gap-2"
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
        <p className="text-xs font-semibold text-gray-700 truncate" title={sticker.name}>
          {sticker.name}
        </p>
      </div>

      {/* Action button bar */}
      {imgError ? (
        <button
          onClick={onDelete}
          className="w-full py-2.5 text-xs font-bold bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200"
        >
          🗑️ Remove Broken Sticker
        </button>
      ) : video ? (
        <button
          onClick={onDownload}
          className="w-full py-2.5 text-xs font-bold bg-gradient-to-r from-purple-50 to-pink-50 text-purple-600 hover:from-purple-500 hover:to-pink-500 hover:text-white transition-all duration-200"
        >
          ⬇️ Download MP4
        </button>
      ) : (
        <button
          onClick={onCopy}
          className={`w-full py-2.5 text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
            copied
              ? 'bg-green-500 text-white'
              : 'bg-gradient-to-r from-pink-50 to-purple-50 text-pink-600 hover:from-pink-500 hover:to-purple-500 hover:text-white'
          }`}
        >
          <span>{copied ? '✅' : '📋'}</span>
          <span>{copied ? 'Copied!' : 'Copy for WhatsApp'}</span>
        </button>
      )}
    </div>
  )
}
