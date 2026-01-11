import React, { useState, useRef, useEffect } from 'react'
import DoodleCanvas from './DoodleCanvas'

export default function HomePage() {
  const [showGreeting, setShowGreeting] = useState(() => {
    // Only show greeting if visits < 2
    const visits = localStorage.getItem('aidenVisits') || '0'
    return parseInt(visits) < 2
  })

  useEffect(() => {
    if (showGreeting) {
      // Auto-hide greeting after 5 seconds on first visit
      const timer = setTimeout(() => setShowGreeting(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [showGreeting])

  const handleCloseGreeting = () => {
    // Increment visit counter and hide greeting
    const currentVisits = parseInt(localStorage.getItem('aidenVisits') || '0')
    localStorage.setItem('aidenVisits', String(currentVisits + 1))
    setShowGreeting(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-300 via-blue-300 to-purple-400 p-4">
      {/* Welcome Greeting */}
      {showGreeting && (
        <div className="fixed inset-0 flex items-center justify-center z-40 bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 md:p-12 text-center max-w-md mx-auto shadow-2xl relative">
            {/* Close Button */}
            <button
              onClick={handleCloseGreeting}
              className="absolute top-4 right-4 bg-gray-400 hover:bg-gray-500 text-white w-8 h-8 rounded-full font-bold text-lg transition-all hover:scale-110 flex items-center justify-center"
              title="Close"
            >
              ✕
            </button>

            <div className="text-8xl mb-6 animate-bounce">
              ⚽
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
              Hello, welcome to my site
            </h1>

            <button
              onClick={handleCloseGreeting}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 py-3 rounded-xl transition-all hover:scale-105"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Title */}
        <div className="text-center mb-8 pt-4">
          <h2 className="text-3xl md:text-5xl font-black text-white drop-shadow-lg mb-2">
            🎨 Welcome to Aiden's Lab
          </h2>
          <p className="text-lg md:text-xl text-white font-bold drop-shadow">
            Your creative digital playground!
          </p>
        </div>

        {/* Main Drawing Canvas */}
        <div className="bg-white rounded-2xl shadow-2xl p-4 md:p-8 mb-8">
          <h3 className="text-2xl md:text-3xl font-bold text-blue-600 mb-4 text-center">
            🖌️ Doodle Canvas - Create Your Masterpiece!
          </h3>
          <DoodleCanvas />
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <FeatureCard emoji="⚽" title="Messi Zone" description="Learn about soccer and Messi!" />
          <FeatureCard emoji="🔴" title="Pokemon Tracker" description="Track your collection!" />
          <FeatureCard emoji="🏎️" title="Hot Wheels" description="Showcase your cars!" />
          <FeatureCard emoji="♟️" title="Chess Battle" description="Play with funny AI!" />
          <FeatureCard emoji="🎮" title="Games" description="Fun mini-games!" />
          <FeatureCard emoji="🎨" title="Draw Here" description="Use the canvas above!" />
        </div>

        {/* Info Section */}
        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 md:p-8 text-center">
          <p className="text-lg md:text-xl font-bold text-gray-700">
            💡 Tip: Explore all the sections using the navigation at the top!
          </p>
          <p className="text-md text-gray-600 mt-3">
            Have fun, be creative, and enjoy your awesome new lab! 🚀
          </p>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ emoji, title, description }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 text-center border-4 border-blue-300">
      <div className="text-4xl md:text-5xl mb-3">{emoji}</div>
      <h4 className="text-lg md:text-xl font-bold text-blue-600 mb-2">{title}</h4>
      <p className="text-gray-600 text-sm md:text-base">{description}</p>
    </div>
  )
}
