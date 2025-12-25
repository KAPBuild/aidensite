import React, { useState, useRef, useEffect } from 'react'
import DoodleCanvas from './DoodleCanvas'

export default function HomePage() {
  const [showGreeting, setShowGreeting] = useState(true)

  useEffect(() => {
    // Auto-hide greeting after 8 seconds
    const timer = setTimeout(() => setShowGreeting(false), 8000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-300 via-blue-300 to-purple-400 p-4">
      {/* Christmas Greeting */}
      {showGreeting && (
        <div className="fixed inset-0 flex items-center justify-center z-40 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 md:p-12 text-center max-w-2xl mx-4 shadow-2xl animate-pulse border-4 border-yellow-300">
            <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-green-500 mb-4">
              🎄 Merry Christmas Bro! 🎄
            </h1>
            <p className="text-2xl md:text-3xl font-bold text-purple-600 mb-4">
              - Uncle Nick 🎅
            </p>
            <p className="text-lg text-blue-600 font-semibold">
              Welcome to your awesome new lab! 🧪
            </p>
            <div className="mt-8 text-4xl animate-bounce">
              ⚽ 🎨 🔴 🏎️ ♟️ 🎮
            </div>
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
