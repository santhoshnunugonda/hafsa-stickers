'use client'

interface HeaderProps {
  search: string
  onSearchChange: (v: string) => void
  onAddClick: () => void
  onRefreshClick: () => void
  stickerCount: number
  isSyncing: boolean
  syncActive: boolean
}

export default function Header({
  search,
  onSearchChange,
  onAddClick,
  onRefreshClick,
  stickerCount,
  isSyncing,
  syncActive,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-pink-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Logo / Title */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-2xl animate-bounce">🐒</span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent leading-tight">
                Hafsa Stickers
              </h1>
              {syncActive && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
                  Cloud Synced
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 leading-tight">
              {stickerCount} stickers across all devices
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-sm min-w-[200px] relative order-last sm:order-none w-full sm:w-auto">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search stickers…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-full border border-pink-200 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100 text-sm bg-white"
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

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Refresh sync button */}
          <button
            onClick={onRefreshClick}
            disabled={isSyncing}
            className="p-2 rounded-full border border-pink-200 text-gray-600 hover:text-pink-500 hover:bg-pink-50 transition-colors tooltip"
            data-tooltip="Refresh from cloud"
            title="Refresh stickers from cloud"
          >
            <span className={`text-sm inline-block ${isSyncing ? 'animate-spin' : ''}`}>🔄</span>
          </button>

          {/* Add button */}
          <button
            onClick={onAddClick}
            className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-full font-semibold text-sm shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
          >
            <span>➕</span>
            <span className="hidden sm:inline">Add Sticker</span>
          </button>
        </div>
      </div>
    </header>
  )
}
