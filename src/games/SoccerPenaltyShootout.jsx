import React, { useState, useEffect } from 'react'

export default function SoccerPenaltyShootout({ onBack }) {
  const [gameState, setGameState] = useState('opponent') // opponent, aiming, kicked, saved, scored, gameOver
  const [currentOpponent, setCurrentOpponent] = useState(null)
  const [shots, setShots] = useState(0)
  const [goals, setGoals] = useState(0)
  const [ballTarget, setBallTarget] = useState(null)
  const [goalkeeperDive, setGoalkeeperDive] = useState(null)
  const [scores, setScores] = useState(() => {
    const saved = localStorage.getItem('aidenScores-penalty')
    return saved ? JSON.parse(saved) : []
  })
  const [selectedGoalkeeper, setSelectedGoalkeeper] = useState(null)

  const opponents = [
    {
      id: 'sleepy',
      name: 'Sleepy Sam',
      emoji: '😴',
      description: 'Falls asleep between shots',
      reaction: (saved) => saved ? '💤 *yawn* woke up just in time!' : '💤 zzzzzzz...',
    },
    {
      id: 'dizzy',
      name: 'Dizzy Dan',
      emoji: '🤪',
      description: 'Gets confused which direction to block',
      reaction: (saved) => saved ? '🤪 Wait... where am I?' : '🤪 SPINNING SPINNING!',
    },
    {
      id: 'tiny',
      name: 'Tiny Tim',
      emoji: '🤏',
      description: 'Extremely short, covers basically nothing',
      reaction: (saved) => saved ? '🤏 I\'m too small!' : '🤏 *stands on tippy toes*',
    },
    {
      id: 'afraid',
      name: 'Scared Steve',
      emoji: '😨',
      description: 'Terrified of the ball',
      reaction: (saved) => saved ? '😨 I CAUGHT IT!' : '😨 THE BALL! INCOMING!',
    },
    {
      id: 'silly',
      name: 'Silly Sarah',
      emoji: '🤣',
      description: 'Never stops laughing',
      reaction: (saved) => saved ? '🤣 *hehehehe* BLOCKED!' : '🤣 *uncontrollable giggling*',
    },
  ]

  const shootPositions = [
    { id: 'topLeft', label: 'Top Left', x: 20, y: 10 },
    { id: 'topRight', label: 'Top Right', x: 80, y: 10 },
    { id: 'center', label: 'Center', x: 50, y: 30 },
    { id: 'bottomLeft', label: 'Bottom Left', x: 20, y: 80 },
    { id: 'bottomRight', label: 'Bottom Right', x: 80, y: 80 },
  ]

  useEffect(() => {
    if (gameState === 'opponent' && !selectedGoalkeeper) {
      // Randomly select an opponent for the game
      const randomOpponent = opponents[Math.floor(Math.random() * opponents.length)]
      setSelectedGoalkeeper(randomOpponent)
    }
  }, [gameState, selectedGoalkeeper])

  const startShooting = () => {
    if (shots < 5) {
      setGameState('aiming')
      setBallTarget(null)
      setGoalkeeperDive(null)
    }
  }

  const handleShot = (position) => {
    setBallTarget(position)
    setGameState('kicked')

    // Goalkeeper randomly decides which way to dive
    const allPositions = shootPositions.map(p => p.id)
    const randomDiv = allPositions[Math.floor(Math.random() * allPositions.length)]
    setGoalkeeperDive(randomDiv)

    // Determine if goal
    setTimeout(() => {
      const saved = randomDiv === position.id
      if (saved) {
        setGameState('saved')
      } else {
        setGameState('scored')
        setGoals(goals + 1)
      }

      setTimeout(() => {
        const newShots = shots + 1
        setShots(newShots)

        if (newShots >= 5) {
          setGameState('gameOver')
          const newScore = { score: goals, date: new Date().toLocaleDateString() }
          const newScores = [newScore, ...scores]
          setScores(newScores)
          localStorage.setItem('aidenScores-penalty', JSON.stringify(newScores))
        } else {
          setGameState('aiming')
        }
      }, 1500)
    }, 800)
  }

  const playAgain = () => {
    setGameState('opponent')
    setShots(0)
    setGoals(0)
    setBallTarget(null)
    setGoalkeeperDive(null)
    setSelectedGoalkeeper(null)
  }

  const topScores = scores.sort((a, b) => b.score - a.score).slice(0, 5)

  const renderGoal = () => {
    if (!selectedGoalkeeper) return null

    const width = 200
    const height = 150

    return (
      <div className="relative mx-auto bg-gradient-to-b from-blue-300 to-green-200 rounded-lg overflow-hidden border-4 border-yellow-600" style={{ width: `${width}px`, height: `${height}px` }}>
        {/* Goal Posts */}
        <div className="absolute top-2 left-2 w-1 h-12 bg-yellow-600"></div>
        <div className="absolute top-2 right-2 w-1 h-12 bg-yellow-600"></div>
        <div className="absolute top-2 left-2 right-2 h-1 bg-yellow-600"></div>

        {/* Goalkeeper */}
        <div className="absolute text-5xl transition-all duration-500" style={{
          left: '50%',
          top: '30%',
          transform: 'translateX(-50%)',
          opacity: goalkeeperDive ? 0.7 : 1,
        }}>
          {selectedGoalkeeper.emoji}
        </div>

        {/* Goalkeeper Dive Animation */}
        {goalkeeperDive && (
          <div className="absolute text-3xl transition-all duration-300" style={{
            left: goalkeeperDive === 'topLeft' ? '20%' : goalkeeperDive === 'topRight' ? '80%' : '50%',
            top: goalkeeperDive === 'center' ? '50%' : '30%',
            transform: 'translate(-50%, -50%)',
          }}>
            🧤
          </div>
        )}

        {/* Ball */}
        {ballTarget && (
          <div className="absolute text-3xl transition-all duration-500" style={{
            left: `${ballTarget.x}%`,
            top: `${ballTarget.y}%`,
            transform: 'translate(-50%, -50%)',
          }}>
            ⚽
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-400 to-purple-400 p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black text-blue-600 mb-2">
              ⚽ Penalty Shootout
            </h1>
            <p className="text-lg font-bold text-gray-600">
              Beat the goalkeeper! 5 shots, try to score!
            </p>
          </div>

          {/* Game State: Opponent Selection */}
          {gameState === 'opponent' && selectedGoalkeeper && (
            <div className="text-center mb-8">
              <p className="text-xl font-bold text-gray-700 mb-4">Your opponent today:</p>
              <div className="bg-gradient-to-br from-orange-200 to-yellow-200 rounded-2xl p-8 border-4 border-orange-400 mb-6">
                <div className="text-9xl mb-4">{selectedGoalkeeper.emoji}</div>
                <h2 className="text-3xl font-black text-orange-700 mb-2">{selectedGoalkeeper.name}</h2>
                <p className="text-lg font-semibold text-orange-600 mb-6">{selectedGoalkeeper.description}</p>
              </div>
              <button
                onClick={startShooting}
                className="bg-green-500 hover:bg-green-600 text-white text-2xl px-8 py-4 rounded-xl font-bold transition-all hover:scale-105"
              >
                Let's Play! ⚽
              </button>
            </div>
          )}

          {/* Game State: Aiming */}
          {gameState === 'aiming' && selectedGoalkeeper && (
            <div className="mb-8">
              <p className="text-center text-xl font-bold text-gray-700 mb-6">
                Shot {shots + 1} of 5 - Where do you aim?
              </p>
              <div className="mb-8">
                {renderGoal()}
              </div>

              <div className="grid grid-cols-5 gap-2 mb-6">
                {shootPositions.map((pos) => (
                  <button
                    key={pos.id}
                    onClick={() => handleShot(pos)}
                    className="bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-bold text-sm transition-all hover:scale-110 active:scale-95"
                  >
                    {pos.label}
                  </button>
                ))}
              </div>

              <div className="text-center text-lg font-bold text-gray-700">
                Goals: {goals} | Shots: {shots}
              </div>
            </div>
          )}

          {/* Game State: Kicked */}
          {gameState === 'kicked' && selectedGoalkeeper && (
            <div className="text-center mb-8">
              <p className="text-2xl font-bold text-gray-700 mb-6">Incoming! 💨</p>
              <div className="mb-8">
                {renderGoal()}
              </div>
              <div className="text-lg font-bold text-gray-700">
                Goals: {goals} | Shots: {shots}
              </div>
            </div>
          )}

          {/* Game State: Saved */}
          {gameState === 'saved' && selectedGoalkeeper && (
            <div className="text-center mb-8">
              <p className="text-2xl font-bold text-red-600 mb-6">SAVED! 🧤</p>
              <div className="bg-red-100 border-4 border-red-400 rounded-2xl p-6 mb-6">
                <p className="text-3xl font-black text-red-600">{selectedGoalkeeper.emoji}</p>
                <p className="text-xl font-bold text-red-700 mt-2">{selectedGoalkeeper.reaction(true)}</p>
              </div>
              <div className="text-lg font-bold text-gray-700">
                Goals: {goals} | Shots: {shots}/5
              </div>
            </div>
          )}

          {/* Game State: Scored */}
          {gameState === 'scored' && selectedGoalkeeper && (
            <div className="text-center mb-8">
              <p className="text-2xl font-bold text-green-600 mb-6">GOOOAAAALLL! 🎉</p>
              <div className="bg-green-100 border-4 border-green-400 rounded-2xl p-6 mb-6">
                <p className="text-3xl font-black text-green-600">{selectedGoalkeeper.emoji}</p>
                <p className="text-xl font-bold text-green-700 mt-2">{selectedGoalkeeper.reaction(false)}</p>
              </div>
              <div className="text-lg font-bold text-gray-700">
                Goals: {goals} | Shots: {shots}/5
              </div>
            </div>
          )}

          {/* Game State: Game Over */}
          {gameState === 'gameOver' && (
            <div className="text-center mb-8">
              <div className="bg-gradient-to-r from-purple-300 to-pink-300 rounded-2xl p-8 border-4 border-purple-500 mb-6">
                <p className="text-3xl font-black text-white mb-2">🎉 Game Over! 🎉</p>
                <p className="text-5xl font-black text-white">{goals} Goals!</p>
                <p className="text-xl font-bold text-white mt-2">Out of 5 Shots</p>
              </div>

              <div className="flex gap-4 justify-center mb-8">
                <button
                  onClick={playAgain}
                  className="bg-green-500 hover:bg-green-600 text-white text-xl px-8 py-4 rounded-xl font-bold transition-all hover:scale-105"
                >
                  Play Again ⚽
                </button>
                <button
                  onClick={onBack}
                  className="bg-gray-500 hover:bg-gray-600 text-white text-xl px-8 py-4 rounded-xl font-bold transition-all hover:scale-105"
                >
                  Back to Games
                </button>
              </div>
            </div>
          )}

          {/* Top Scores */}
          {topScores.length > 0 && gameState === 'gameOver' && (
            <div className="bg-orange-100 rounded-xl p-6 border-3 border-orange-300">
              <h3 className="text-xl font-bold text-orange-700 mb-4 text-center">🏆 Your Best Scores</h3>
              <div className="space-y-2">
                {topScores.map((score, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white rounded-lg p-3 border-2 border-orange-200">
                    <span className="font-bold">
                      {idx === 0 && '🥇'} {idx === 1 && '🥈'} {idx === 2 && '🥉'} {idx > 2 && `#${idx + 1}`}
                    </span>
                    <span className="text-2xl font-black text-orange-600">{score.score}/5</span>
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
