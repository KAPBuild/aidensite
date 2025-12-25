import React, { useState, useEffect } from 'react'

const POKEMON = [
  { id: 1, name: 'Pikachu', emoji: '⚡' },
  { id: 2, name: 'Charizard', emoji: '🔥' },
  { id: 3, name: 'Blastoise', emoji: '💧' },
  { id: 4, name: 'Venusaur', emoji: '🌿' },
  { id: 5, name: 'Arcanine', emoji: '🐕' },
  { id: 6, name: 'Dragonite', emoji: '🐉' },
  { id: 7, name: 'Lapras', emoji: '🐢' },
  { id: 8, name: 'Gyarados', emoji: '🐍' },
]

export default function MemoryGame({ onBack }) {
  const [gameStarted, setGameStarted] = useState(false)
  const [cards, setCards] = useState([])
  const [flipped, setFlipped] = useState(new Set())
  const [matched, setMatched] = useState(new Set())
  const [moves, setMoves] = useState(0)
  const [gameWon, setGameWon] = useState(false)
  const [scores, setScores] = useState(() => {
    const saved = localStorage.getItem('aidenScores-memory')
    return saved ? JSON.parse(saved) : []
  })

  // Initialize game
  const startGame = () => {
    const shuffled = [...POKEMON, ...POKEMON]
      .sort(() => Math.random() - 0.5)
      .map((pokemon, idx) => ({
        ...pokemon,
        uniqueId: idx
      }))

    setCards(shuffled)
    setFlipped(new Set())
    setMatched(new Set())
    setMoves(0)
    setGameWon(false)
    setGameStarted(true)
  }

  // Check for match
  useEffect(() => {
    if (flipped.size !== 2) return

    const [first, second] = Array.from(flipped)
    const firstCard = cards[first]
    const secondCard = cards[second]

    setMoves((prev) => prev + 1)

    if (firstCard.id === secondCard.id) {
      // Match found
      setMatched((prev) => new Set([...prev, firstCard.id]))
      setFlipped(new Set())

      // Check if won
      if (matched.size === POKEMON.length - 1) {
        setGameWon(true)
        const score = { moves, date: new Date().toLocaleDateString() }
        const newScores = [score, ...scores]
        setScores(newScores)
        localStorage.setItem('aidenScores-memory', JSON.stringify(newScores))
      }
    } else {
      // No match, flip back after delay
      setTimeout(() => setFlipped(new Set()), 600)
    }
  }, [flipped, cards, matched])

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-red-400 p-4 md:p-8 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center">
            <h1 className="text-4xl md:text-5xl font-black text-purple-600 mb-4">
              🃏 Memory Game
            </h1>
            <p className="text-lg font-bold text-gray-600 mb-8">
              Find matching pairs of Pokemon! Remember where they are!
            </p>

            <button
              onClick={startGame}
              className="btn btn-success text-3xl px-8 py-4 rounded-xl font-bold mb-8"
            >
              🎮 Start Game!
            </button>

            <div className="space-y-3 text-left">
              <p className="font-bold text-gray-700">📋 How to play:</p>
              <ul className="space-y-2 text-gray-600 font-semibold">
                <li>✓ Click cards to flip them</li>
                <li>✓ Find matching pairs</li>
                <li>✓ Try to match all pairs in fewer moves</li>
                <li>✓ Remember where the Pokemon are!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const topScores = scores.sort((a, b) => a.moves - b.moves).slice(0, 5)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-red-400 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-black text-white drop-shadow-lg">
            🃏 Memory Game
          </h1>
          <p className="text-lg font-bold text-white drop-shadow">
            Moves: {moves} | Matched: {matched.size}/{POKEMON.length}
          </p>
        </div>

        {/* Game Board */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 mb-6">
          <div className="grid grid-cols-4 gap-3 md:gap-4 mb-6">
            {cards.map((card, idx) => {
              const isFlipped = flipped.has(idx)
              const isMatched = matched.has(card.id)

              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (!gameWon && !isMatched && flipped.size < 2 && !isFlipped) {
                      setFlipped((prev) => new Set([...prev, idx]))
                    }
                  }}
                  className={`aspect-square rounded-lg text-4xl md:text-5xl font-bold transition-all duration-300 border-4 ${
                    isMatched
                      ? 'bg-green-300 border-green-500 scale-110'
                      : isFlipped
                      ? 'bg-gradient-to-br from-yellow-300 to-orange-300 border-orange-500'
                      : 'bg-gradient-to-br from-blue-400 to-purple-400 border-purple-600 hover:scale-105 cursor-pointer'
                  }`}
                  disabled={isMatched || gameWon}
                >
                  {isFlipped || isMatched ? card.emoji : '?'}
                </button>
              )
            })}
          </div>

          {/* Game Won */}
          {gameWon && (
            <div className="text-center mb-6 bg-gradient-to-r from-green-300 to-yellow-300 rounded-2xl p-8 border-4 border-green-500">
              <p className="text-4xl font-black text-white mb-2">🎉 You Won! 🎉</p>
              <p className="text-2xl font-bold text-white mb-2">{moves} Moves</p>
              <p className="text-xl font-bold text-white">
                {moves <= 12 ? '⭐ Excellent!' : moves <= 16 ? '👍 Good!' : '💪 Nice!'}
              </p>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={startGame}
              className="btn btn-secondary px-6 py-3 rounded-lg font-bold"
            >
              🔄 New Game
            </button>
            <button
              onClick={onBack}
              className="btn bg-gray-500 px-6 py-3 rounded-lg font-bold"
            >
              🎮 Back to Games
            </button>
          </div>
        </div>

        {/* Top Scores */}
        {topScores.length > 0 && (
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
            <h3 className="text-2xl font-bold text-purple-600 mb-6 text-center">🏆 Best Scores (Fewest Moves)</h3>
            <div className="space-y-2">
              {topScores.map((score, idx) => (
                <div key={idx} className="flex justify-between items-center bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4 border-3 border-purple-300">
                  <span className="font-bold text-lg">
                    {idx === 0 && '🥇'} {idx === 1 && '🥈'} {idx === 2 && '🥉'} {idx > 2 && `#${idx + 1}`}
                  </span>
                  <span className="text-2xl font-black text-purple-600">{score.moves} moves</span>
                  <span className="text-sm text-gray-500">{score.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
