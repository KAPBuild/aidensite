import React, { useState, useEffect } from 'react'

export default function BasketballGame({ onBack }) {
  const [gameStarted, setGameStarted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [ballPosition, setBallPosition] = useState(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [scores, setScores] = useState(() => {
    const saved = localStorage.getItem('aidenScores-basketball')
    return saved ? JSON.parse(saved) : []
  })
  const [difficulty, setDifficulty] = useState('normal')

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

  const startGame = (selectedDifficulty) => {
    setDifficulty(selectedDifficulty)
    setGameStarted(true)
    setTimeLeft(30)
    setScore(0)
    setGameOver(false)
  }

  const handleShot = () => {
    if (gameStarted && !gameOver && !isAnimating) {
      setIsAnimating(true)

      // Determine if shot goes in based on difficulty
      let shotSuccess = false
      if (difficulty === 'easy') {
        shotSuccess = Math.random() < 0.7 // 70% success
      } else if (difficulty === 'normal') {
        shotSuccess = Math.random() < 0.5 // 50% success
      } else {
        shotSuccess = Math.random() < 0.3 // 30% success
      }

      // Animate ball
      const randomX = Math.random() * 200 - 100
      const randomY = Math.random() * 150 - 75
      setBallPosition({ x: randomX, y: randomY })

      setTimeout(() => {
        if (shotSuccess) {
          setScore((prev) => prev + 3)
        }
        setBallPosition(null)
        setIsAnimating(false)
      }, 600)
    }
  }

  const endGame = () => {
    setGameOver(true)
    setGameStarted(false)
    const newScore = { score: score, date: new Date().toLocaleDateString(), difficulty }
    const newScores = [newScore, ...scores]
    setScores(newScores)
    localStorage.setItem('aidenScores-basketball', JSON.stringify(newScores))
  }

  const playAgain = (selectedDifficulty) => {
    startGame(selectedDifficulty)
  }

  const topScores = scores.sort((a, b) => b.score - a.score).slice(0, 5)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-yellow-300 to-red-400 p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black text-orange-600 mb-4">
              🏀 Basketball 3-Point
            </h1>
            <p className="text-lg font-bold text-gray-600">
              Shoot as many 3-pointers as you can in 30 seconds!
            </p>
          </div>

          {/* Difficulty Selection */}
          {!gameStarted && !gameOver && (
            <div className="text-center mb-8">
              <p className="text-lg font-bold text-gray-700 mb-6">Choose Difficulty:</p>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { level: 'easy', emoji: '🟢', label: 'Easy', desc: '70% shots go in' },
                  { level: 'normal', emoji: '🟡', label: 'Normal', desc: '50% shots go in' },
                  { level: 'hard', emoji: '🔴', label: 'Hard', desc: '30% shots go in' },
                ].map((opt) => (
                  <button
                    key={opt.level}
                    onClick={() => startGame(opt.level)}
                    className="bg-gradient-to-br from-blue-300 to-blue-500 hover:from-blue-400 hover:to-blue-600 text-white rounded-xl p-4 font-bold transition-all hover:scale-105 border-3 border-blue-600"
                  >
                    <div className="text-3xl mb-2">{opt.emoji}</div>
                    <div className="text-lg">{opt.label}</div>
                    <div className="text-sm">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Game Active */}
          {(gameStarted || gameOver) && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-orange-100 rounded-xl p-6 text-center border-3 border-orange-400">
                  <p className="text-sm font-bold text-gray-600">Score</p>
                  <p className="text-4xl font-black text-orange-600">{score}</p>
                </div>
                <div className="bg-yellow-100 rounded-xl p-6 text-center border-3 border-yellow-400">
                  <p className="text-sm font-bold text-gray-600">Time</p>
                  <p className="text-4xl font-black text-yellow-600">{timeLeft}s</p>
                </div>
              </div>

              {/* Basketball Court */}
              {gameStarted && (
                <div className="text-center mb-8">
                  <div className="relative mx-auto bg-gradient-to-b from-amber-600 to-amber-700 rounded-lg overflow-hidden border-4 border-white mb-6" style={{
                    width: '280px',
                    height: '350px',
                  }}>
                    {/* Court Lines */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-white"></div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white"></div>
                    <div className="absolute top-0 bottom-0 left-0 w-1 bg-white"></div>
                    <div className="absolute top-0 bottom-0 right-0 w-1 bg-white"></div>

                    {/* Half court line */}
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-white transform -translate-y-1/2"></div>

                    {/* Basket */}
                    <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
                      <div className="text-4xl animate-bounce">🏀</div>
                    </div>

                    {/* Backboard */}
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-16 h-20 bg-white bg-opacity-30 border-2 border-white rounded-lg"></div>

                    {/* Shot Animation */}
                    {ballPosition && (
                      <div className="absolute" style={{
                        left: '50%',
                        top: '50%',
                        transform: `translate(calc(-50% + ${ballPosition.x}px), calc(-50% + ${ballPosition.y}px))`,
                        transition: 'all 0.6s ease-out',
                      }}>
                        <div className="text-4xl">🎯</div>
                      </div>
                    )}

                    {/* Swish effect when scoring */}
                    {isAnimating && !ballPosition && (
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="text-5xl animate-ping">✨</div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleShot}
                    disabled={isAnimating}
                    className="text-6xl hover:scale-125 transition-transform active:scale-110 duration-100 filter drop-shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    👆
                  </button>
                  <p className="text-gray-600 font-semibold mt-4">Tap to shoot!</p>
                </div>
              )}

              {/* Game Over Screen */}
              {gameOver && (
                <div className="text-center mb-8">
                  <div className="bg-gradient-to-r from-orange-300 to-yellow-300 rounded-2xl p-8 border-4 border-orange-500 mb-6">
                    <p className="text-3xl font-black text-white mb-2">🏆 Game Over! 🏆</p>
                    <p className="text-5xl font-black text-white">{score} Points!</p>
                    <p className="text-xl font-bold text-white mt-2">
                      {score > 45 ? '🔥 LEGENDARY!' : score > 30 ? '⭐ AMAZING!' : score > 15 ? '👍 Great!' : '💪 Keep trying!'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 mb-6">
                    {['easy', 'normal', 'hard'].map((level) => (
                      <button
                        key={level}
                        onClick={() => playAgain(level)}
                        className="bg-green-500 hover:bg-green-600 text-white text-lg px-6 py-3 rounded-xl font-bold transition-all hover:scale-105"
                      >
                        {level === 'easy' ? '🟢' : level === 'normal' ? '🟡' : '🔴'} Play Again ({level.charAt(0).toUpperCase() + level.slice(1)})
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={onBack}
                    className="btn bg-gray-500 text-white text-lg px-8 py-3 rounded-xl font-bold w-full"
                  >
                    🎮 Back to Games
                  </button>
                </div>
              )}
            </>
          )}

          {/* Top Scores */}
          {topScores.length > 0 && gameOver && (
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
