import React from 'react'

export default function Navigation({ currentPage, setCurrentPage }) {
  const navItems = [
    { id: 'home', label: '🏠 Home', emoji: '🏠' },
    { id: 'soccer', label: '⚽ Soccer', emoji: '⚽' },
    { id: 'pokemon', label: '🔴 Pokemon', emoji: '🔴' },
    { id: 'hotwheels', label: '🏎️ Hot Wheels', emoji: '🏎️' },
    { id: 'chess', label: '♟️ Chess', emoji: '♟️' },
    { id: 'games', label: '🎮 Games', emoji: '🎮' },
    { id: 'retro', label: '👾 Retro', emoji: '👾' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 shadow-2xl z-50 border-b-4 border-yellow-300">
      <div className="max-w-full mx-auto px-2 md:px-4">
        <div className="flex items-center justify-start h-20 gap-2 overflow-x-auto">
          {/* Logo */}
          <button
            onClick={() => setCurrentPage('home')}
            className="flex items-center gap-1 text-white font-bold text-lg md:text-2xl hover:scale-110 transition-transform whitespace-nowrap flex-shrink-0"
          >
            <span className="text-xl">🧪</span>
            <span className="hidden sm:inline">Aiden's Lab</span>
          </button>

          {/* Nav Items - Horizontal scrollable on mobile */}
          <div className="flex gap-1 md:gap-2 flex-1 overflow-x-auto scrollbar-hide">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`px-2 md:px-3 py-2 rounded-lg font-bold text-xs md:text-sm transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                  currentPage === item.id
                    ? 'bg-yellow-300 text-blue-700 scale-105 shadow-lg'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden text-base">{item.emoji}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </nav>
  )
}
