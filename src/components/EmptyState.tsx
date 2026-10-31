'use client'

interface EmptyStateProps {
  search: string
  onAddClick: () => void
  onClearSearch: () => void
}

export default function EmptyState({ search, onAddClick, onClearSearch }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-7xl mb-5 float-animation">
        {search ? '🔍' : '🎨'}
      </div>
      <h3 className="text-xl font-bold text-gray-700 mb-2">
        {search ? `No stickers for "${search}"` : 'No stickers yet!'}
      </h3>
      <p className="text-gray-400 mb-6 max-w-xs">
        {search
          ? 'Try a different search term or add a new sticker.'
          : 'Start building your Hafsa sticker collection!'}
      </p>
      <div className="flex gap-3">
        {search && (
          <button
            onClick={onClearSearch}
            className="px-5 py-2.5 rounded-full border border-pink-200 text-pink-600 font-semibold text-sm hover:bg-pink-50 transition-colors"
          >
            Clear Search
          </button>
        )}
        <button
          onClick={onAddClick}
          className="px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-sm shadow-md hover:shadow-lg hover:scale-105 transition-all"
        >
          ➕ Add First Sticker
        </button>
      </div>
    </div>
  )
}
