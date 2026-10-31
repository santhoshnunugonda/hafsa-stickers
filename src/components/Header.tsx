'use client'

import Image from 'next/image'

interface HeaderProps {
  search: string
  onSearchChange: (v: string) => void
  onAddClick: () => void
  stickerCount: number
}

export default function Header({
  search,
  onSearchChange,
  onAddClick,
  stickerCount,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-pink-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
        {/* Logo / Title */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-2xl">💖</span>
          <div>
            <h1 className="text-lg font-black bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent leading-tight">
              Hafsa Stickers
            </h1>
            <p className="text-xs text-gray-400 leading-tight">{stickerCount} stickers</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-sm mx-auto relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search stickers…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-full border border-pink-200 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100 text-sm bg-white"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-500 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Add button */}
        <button
          onClick={onAddClick}
          className="flex-shrink-0 flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-full font-semibold text-sm shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
        >
          <span>➕</span>
          <span className="hidden sm:inline">Add Sticker</span>
        </button>
      </div>
    </header>
  )
}

