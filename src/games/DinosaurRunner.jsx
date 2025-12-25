import React, { useState, useEffect, useRef } from 'react'

export default function DinosaurRunner({ onBack }) {
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [dinosaurY, setDinosaurY] = useState(300)
  const [isJumping, setIsJumping] = useState(false)
  const [velocityY, setVelocityY] = useState(0)
  const [obstacles, setObstacles] = useState([])
  const [scores, setScores] = useState(() => {
    const saved = localStorage.getItem('aidenScores-dinosaur')
    return saved ? JSON.parse(saved) : []
  })
  const gameLoopRef = useRef(null)
  const obstacleCounterRef = useRef(0)

  const GROUND_Y = 300
  const GRAVITY = 0.6
  const JUMP_STRENGTH = -12
  const DINO_SIZE = 40

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver) return

    gameLoopRef.current = setInterval(() => {
      // Update dinosaur position (gravity)
      setDinosaurY((prevY) => {
        let newY = prevY + velocityY
        setVelocityY((prevVel) => {
          let newVel = prevVel + GRAVITY
          if (newY >= GROUND_Y) {
            newY = GROUND_Y
            newVel = 0
            setIsJumping(false)
          }
          return newVel
        })
        return newY
      })

      // Update obstacles
      setObstacles((prevObstacles) => {
        const updated = prevObstacles
          .map((obs) => ({ ...obs, x: obs.x - 8 }))
          .filter((obs) => obs.x > -50)

        // Check collisions
        updated.forEach((obs) => {
          if (
            dinosaurY + DINO_SIZE > obs.y &&
            dinosaurY < obs.y + 40 &&
            300 + DINO_SIZE > obs.x &&
            300 < obs.x + 40
          ) {
            setGameOver(true)
            setGameStarted(false)
          }
        })

        return updated
      })

      // Spawn obstacles
      obstacleCounterRef.current++
      if (obstacleCounterRef.current > 80 - Math.min(score / 100, 30)) {
        setObstacles((prev) => [
          ...prev,
          { id: Date.now(), x: 800, y: GROUND_Y, type: Math.random() > 0.5 ? 'cactus' : 'bird' },
        ])
        obstacleCounterRef.current = 0
      }

      // Increment score
      setScore((prev) => prev + 1)
    }, 30)

    return () => clearInterval(gameLoopRef.current)
  }, [gameStarted, gameOver, velocityY, dinosaurY])

  const handleJump = () => {
    if (gameStarted && !gameOver && !isJumping && dinosaurY >= GROUND_Y) {
      setIsJumping(true)
      setVelocityY(JUMP_STRENGTH)
    }
  }

  const startGame = () => {
    setGameStarted(true)
    setGameOver(false)
    setScore(0)
    setDinosaurY(GROUND_Y)
    setVelocityY(0)
    setObstacles([])
    setIsJumping(false)
    obstacleCounterRef.current = 0
  }

  const playAgain = () => {
    startGame()
  }

  const endGame = () => {
    const newScore = { score: Math.floor(score / 10), date: new Date().toLocaleDateString() }
    const newScores = [newScore, ...scores]
    setScores(newScores)
    localStorage.setItem('aidenScores-dinosaur', JSON.stringify(newScores))
  }

  useEffect(() => {
    if (gameOver && gameStarted === false) {
      endGame()
    }
  }, [gameOver, gameStarted])

  // Keyboard control
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.code === 'Space' || e.code === 'ArrowUp') && gameStarted && !gameOver) {
        e.preventDefault()
        handleJump()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameStarted, gameOver, dinosaurY])

  // Touch control
  useEffect(() => {
    const handleTouchStart = () => {
      if (gameStarted && !gameOver) {
        handleJump()
      }
    }

    window.addEventListener('touchstart', handleTouchStart)
    return () => window.removeEventListener('touchstart', handleTouchStart)
  }, [gameStarted, gameOver, dinosaurY])

  const topScores = scores.sort((a, b) => b.score - a.score).slice(0, 5)

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-300 to-green-200 p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-4xl w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black text-green-600 mb-4">
              🦖 Dinosaur Runner
            </h1>
            <p className="text-lg font-bold text-gray-600">
              Tap or press Space to jump! Avoid obstacles!
            </p>
          </div>

          {/* Game Area */}
          {!gameStarted && !gameOver && (
            <div className="text-center mb-8">
              <div className="bg-gradient-to-b from-blue-300 to-green-200 rounded-2xl border-4 border-gray-800 overflow-hidden mb-6" style={{
                height: '400px',
                position: 'relative',
              }}>
                {/* Sky */}
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-blue-300 to-blue-200"></div>
                {/* Ground */}
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-b from-green-300 to-green-400"></div>

                {/* Dinosaur */}
                <div className="absolute text-6xl" style={{ left: '300px', top: '300px' }}>
                  🦖
                </div>

                {/* Message */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <p className="text-4xl font-black text-white drop-shadow-lg">Ready?</p>
                </div>
              </div>

              <button
                onClick={startGame}
                className="bg-green-500 hover:bg-green-600 text-white text-2xl px-8 py-4 rounded-xl font-bold transition-all hover:scale-105"
              >
                Start Game! 🏃
              </button>
            </div>
          )}

          {/* Game Active */}
          {(gameStarted || gameOver) && (
            <>
              {/* Score */}
              <div className="text-center mb-4">
                <p className="text-3xl font-black text-gray-700">
                  Score: {Math.floor(score / 10)}
                </p>
              </div>

              {/* Game Canvas */}
              <div className="bg-gradient-to-b from-blue-300 to-green-200 rounded-2xl border-4 border-gray-800 overflow-hidden mb-6" style={{
                height: '400px',
                position: 'relative',
              }}>
                {/* Sky */}
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-blue-300 to-blue-200"></div>
                {/* Ground */}
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-b from-green-300 to-green-400"></div>

                {/* Ground line */}
                <div className="absolute" style={{ top: `${GROUND_Y}px`, left: 0, right: 0, height: '2px', backgroundColor: '#333' }}></div>

                {/* Dinosaur */}
                <div className="absolute text-5xl transition-all" style={{
                  left: '50px',
                  top: `${dinosaurY}px`,
                  transition: 'none',
                }}>
                  🦖
                </div>

                {/* Obstacles */}
                {obstacles.map((obs) => (
                  <div
                    key={obs.id}
                    className="absolute text-4xl"
                    style={{
                      left: `${obs.x}px`,
                      top: `${obs.y}px`,
                    }}
                  >
                    {obs.type === 'cactus' ? '🌵' : '🦅'}
                  </div>
                ))}

                {/* Game Over Overlay */}
                {gameOver && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white rounded-2xl p-8 text-center border-4 border-red-500">
                      <p className="text-4xl font-black text-red-600 mb-4">💀 Game Over!</p>
                      <p className="text-3xl font-black text-gray-700">{Math.floor(score / 10)} Points</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              {gameStarted && !gameOver && (
                <div className="text-center mb-6">
                  <button
                    onClick={handleJump}
                    className="text-6xl hover:scale-125 transition-transform active:scale-110 duration-100 filter drop-shadow-lg"
                  >
                    👆
                  </button>
                  <p className="text-gray-600 font-semibold mt-4">Tap to jump!</p>
                </div>
              )}

              {/* Game Over Buttons */}
              {gameOver && (
                <div className="flex flex-col gap-4">
                  <button
                    onClick={playAgain}
                    className="bg-green-500 hover:bg-green-600 text-white text-2xl px-8 py-4 rounded-xl font-bold transition-all hover:scale-105"
                  >
                    Play Again 🦖
                  </button>
                  <button
                    onClick={onBack}
                    className="bg-gray-500 hover:bg-gray-600 text-white text-xl px-8 py-4 rounded-xl font-bold"
                  >
                    Back to Games
                  </button>
                </div>
              )}
            </>
          )}

          {/* Top Scores */}
          {topScores.length > 0 && gameOver && (
            <div className="bg-green-100 rounded-xl p-6 border-3 border-green-300 mt-8">
              <h3 className="text-xl font-bold text-green-700 mb-4 text-center">🏆 Your Best Scores</h3>
              <div className="space-y-2">
                {topScores.map((sc, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white rounded-lg p-3 border-2 border-green-200">
                    <span className="font-bold">
                      {idx === 0 && '🥇'} {idx === 1 && '🥈'} {idx === 2 && '🥉'} {idx > 2 && `#${idx + 1}`}
                    </span>
                    <span className="text-2xl font-black text-green-600">{sc.score}</span>
                    <span className="text-sm text-gray-500">{sc.date}</span>
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
