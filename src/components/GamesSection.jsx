import React, { useState } from 'react'
import SoccerPenaltyShootout from '../games/SoccerPenaltyShootout'
import BasketballGame from '../games/BasketballGame'
import DemonHunter from '../games/DemonHunter'

export default function GamesSection() {
  const [selectedGame, setSelectedGame] = useState(null)

  if (selectedGame) {
    return (
      <>
        {selectedGame === 'penalty' && <SoccerPenaltyShootout onBack={() => setSelectedGame(null)} />}
        {selectedGame === 'basketball' && <BasketballGame onBack={() => setSelectedGame(null)} />}
        {selectedGame === 'demonhunter' && <DemonHunter onBack={() => setSelectedGame(null)} />}
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-300 via-blue-300 to-purple-400 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg mb-2">
            🎮 Games
          </h1>
          <p className="text-lg md:text-xl font-bold text-white drop-shadow">
            Have fun and try to beat your high scores!
          </p>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <GameCard
            emoji="👹"
            title="Demon Hunter"
            description="Fight waves of demons and upgrade your weapons!"
            onClick={() => setSelectedGame('demonhunter')}
            color="from-red-600 to-purple-600"
          />
          <GameCard
            emoji="⚽"
            title="Penalty Shootout"
            description="Test your shooting skills against hilarious AI goalkeepers!"
            onClick={() => setSelectedGame('penalty')}
            color="from-blue-400 to-green-400"
          />
          <GameCard
            emoji="🏀"
            title="Basketball 3-Point"
            description="Score as many 3-pointers as you can before time runs out!"
            onClick={() => setSelectedGame('basketball')}
            color="from-orange-400 to-yellow-400"
          />
        </div>

        {/* Leaderboards */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
          <h2 className="text-2xl font-bold text-blue-600 mb-6 text-center">📊 Your Scores</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Leaderboard gameType="penalty" title="⚽ Penalty Shootout" />
            <Leaderboard gameType="basketball" title="🏀 Basketball 3-Point" />
            <Leaderboard gameType="demonhunter" title="👹 Demon Hunter" />
          </div>
        </div>
      </div>
    </div>
  )
}

function GameCard({ emoji, title, description, onClick, color }) {
  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-br ${color} rounded-2xl shadow-2xl p-8 text-white hover:shadow-3xl hover:scale-105 transition-all duration-300 border-4 border-white`}
    >
      <div className="text-6xl mb-4">{emoji}</div>
      <h3 className="text-3xl font-black mb-3">{title}</h3>
      <p className="text-lg font-semibold mb-6">{description}</p>
      <div className="inline-block bg-white text-blue-600 px-6 py-2 rounded-lg font-bold text-lg hover:scale-110 transition-transform">
        Play Now ▶
      </div>
    </button>
  )
}

function Leaderboard({ gameType, title }) {
  const [scores, setScores] = React.useState(() => {
    const saved = localStorage.getItem(`aidenScores-${gameType}`)
    return saved ? JSON.parse(saved) : []
  })

  const topScores = scores.sort((a, b) => b.score - a.score).slice(0, 5)

  return (
    <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl p-6 border-3 border-orange-300">
      <h3 className="text-xl font-bold text-orange-700 mb-4 text-center">{title}</h3>

      {topScores.length === 0 ? (
        <p className="text-center text-gray-600 font-semibold py-8">No scores yet! Play to add some! 🎯</p>
      ) : (
        <div className="space-y-2">
          {topScores.map((entry, idx) => (
            <div key={idx} className="flex justify-between items-center bg-white rounded-lg p-3 border-2 border-orange-200">
              <span className="font-bold text-lg">
                {idx === 0 && '🥇'}
                {idx === 1 && '🥈'}
                {idx === 2 && '🥉'}
                {idx > 2 && `#${idx + 1}`}
              </span>
              <span className="text-2xl font-black text-orange-600">{entry.score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
