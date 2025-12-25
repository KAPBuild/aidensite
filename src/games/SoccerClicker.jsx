import React, { useState, useEffect } from 'react'

export default function SoccerClicker({ onBack }) {
  const [gameStarted, setGameStarted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)
  const [clicks, setClicks] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [scores, setScores] = useState(() => {
    const saved = localStorage.getItem('aidenScores-soccer')
    return saved ? JSON.parse(saved) : []
  })

  // Game timer
  useEffect(() => {
    if (!gameStarted || gameOver) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          endGame()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [gameStarted, gameOver])

  const startGame = () => {
    setGameStarted(true)
    setTimeLeft(30)
    setClicks(0)
    setGameOver(false)
  }

  const handleClick = () => {
    if (gameStarted && !gameOver) {
      setClicks((prev) => prev + 1)
    }
  }

  const endGame = () => {
    setGameOver(true)
    setGameStarted(false)
    const newScore = { score: clicks, date: new Date().toLocaleDateString() }
    const newScores = [newScore, ...scores]
    setScores(newScores)
    localStorage.setItem('aidenScores-soccer', JSON.stringify(newScores))
  }

  const topScores = scores.sort((a, b) => b.score - a.score).slice(0, 5)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-green-300 to-yellow-300 p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black text-blue-600 mb-4">
              ⚽ Soccer Clicker
            </h1>
            <p className="text-lg font-bold text-gray-600">
              Click the soccer ball as fast as you can!
            </p>
          </div>

          {!gameStarted && !gameOver && (
            <div className="text-center mb-8">
              <button
                onClick={startGame}
                className="btn btn-success text-3xl px-8 py-4 rounded-xl font-bold"
              >
                ⚽ Start Game!
              </button>
              <p className="text-gray-600 mt-4 font-semibold">You have 30 seconds!</p>
            </div>
          )}

          {(gameStarted || gameOver) && (
            <>
              {/* Score and Time */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-blue-100 rounded-xl p-6 text-center border-3 border-blue-400">
                  <p className="text-sm font-bold text-gray-600">Clicks</p>
                  <p className="text-4xl font-black text-blue-600">{clicks}</p>
                </div>
                <div className="bg-green-100 rounded-xl p-6 text-center border-3 border-green-400">
                  <p className="text-sm font-bold text-gray-600">Time</p>
                  <p className="text-4xl font-black text-green-600">{timeLeft}s</p>
                </div>
                <div className="bg-yellow-100 rounded-xl p-6 text-center border-3 border-yellow-400">
                  <p className="text-sm font-bold text-gray-600">Rate</p>
                  <p className="text-4xl font-black text-yellow-600">
                    {timeLeft > 0 ? Math.round((clicks / (30 - timeLeft)) * 10) / 10 : 0}
                  </p>
                </div>
              </div>

              {/* Soccer Ball Button */}
              {gameStarted && (
                <div className="text-center mb-8">
                  <button
                    onClick={handleClick}
                    className="text-9xl hover:scale-125 transition-transform active:scale-105 duration-100 filter drop-shadow-lg animate-bounce"
                  >
                    ⚽
                  </button>
                  <p className="text-gray-600 font-semibold mt-4">Click as fast as you can!</p>
                </div>
              )}

              {/* Game Over Screen */}
              {gameOver && (
                <div className="text-center mb-8">
                  <div className="bg-gradient-to-r from-green-300 to-yellow-300 rounded-2xl p-8 border-4 border-green-500 mb-6">
                    <p className="text-3xl font-black text-white mb-2">🎉 Game Over! 🎉</p>
                    <p className="text-5xl font-black text-white">{clicks} Clicks!</p>
                    <p className="text-xl font-bold text-white mt-2">
                      {clicks > 50 ? '🏆 Amazing!' : clicks > 30 ? '👍 Great!' : '💪 Good try!'}
                    </p>
                  </div>

                  <button
                    onClick={startGame}
                    className="btn btn-success text-2xl px-8 py-4 rounded-xl font-bold mb-4"
                  >
                    ⚽ Play Again
                  </button>
                  <br />
                  <button
                    onClick={onBack}
                    className="btn bg-gray-500 text-xl px-8 py-4 rounded-xl font-bold"
                  >
                    🎮 Back to Games
                  </button>
                </div>
              )}
            </>
          )}

          {/* Top Scores */}
          {topScores.length > 0 && (
            <div className="bg-orange-100 rounded-xl p-6 border-3 border-orange-300">
              <h3 className="text-xl font-bold text-orange-700 mb-4 text-center">🏆 Your Best Scores</h3>
              <div className="space-y-2">
                {topScores.map((score, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white rounded-lg p-3 border-2 border-orange-200">
                    <span className="font-bold">
                      {idx === 0 && '🥇'} {idx === 1 && '🥈'} {idx === 2 && '🥉'} {idx > 2 && `#${idx + 1}`}
                    </span>
                    <span className="text-2xl font-black text-orange-600">{score.score}</span>
                    <span className="text-sm text-gray-500">{score.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
