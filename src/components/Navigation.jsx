import React from 'react'

export default function Navigation({ currentPage, setCurrentPage }) {
  const navItems = [
    { id: 'home', label: '🏠 Home', emoji: '🏠' },
    { id: 'soccer', label: '⚽ Soccer', emoji: '⚽' },
    { id: 'pokemon', label: '🔴 Pokemon', emoji: '🔴' },
    { id: 'hotwheels', label: '🏎️ Hot Wheels', emoji: '🏎️' },
    { id: 'chess', label: '♟️ Chess', emoji: '♟️' },
    { id: 'games', label: '🎮 Games', emoji: '🎮' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 shadow-2xl z-50 border-b-4 border-yellow-300">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <button
            onClick={() => setCurrentPage('home')}
            className="flex items-center gap-2 text-white font-bold text-2xl hover:scale-110 transition-transform"
          >
            🧪 Aiden's Lab
          </button>

          {/* Nav Items */}
          <div className="flex gap-2 flex-wrap justify-center flex-1 mx-4 md:gap-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`px-3 md:px-4 py-2 rounded-lg font-bold text-sm md:text-base transition-all duration-200 whitespace-nowrap ${
                  currentPage === item.id
                    ? 'bg-yellow-300 text-blue-700 scale-110 shadow-lg'
                    : 'bg-white/20 text-white hover:bg-white/30 hover:scale-105'
                }`}
              >
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{item.emoji}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
