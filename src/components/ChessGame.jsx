import React, { useState, useEffect } from 'react'
import { Chess } from 'chess.js'

export default function ChessGame() {
  const [gameMode, setGameMode] = useState(null) // null, 'silly', 'clever', 'master'
  const [game, setGame] = useState(null)
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('aidenChessStats')
    return saved ? JSON.parse(saved) : { silly: 0, clever: 0, master: 0 }
  })
  const [gameStatus, setGameStatus] = useState('') // '', 'checking', 'checkmate', 'draw'
  const [aiThinking, setAiThinking] = useState(false)

  // Save stats
  useEffect(() => {
    if (stats) {
      localStorage.setItem('aidenChessStats', JSON.stringify(stats))
    }
  }, [stats])

  // Initialize game
  const startGame = (difficulty) => {
    setGameMode(difficulty)
    setGame(new Chess())
    setSelectedSquare(null)
    setGameStatus('')
    setAiThinking(false)
  }

  // Get valid moves for a square
  const getValidMoves = (square) => {
    if (!game) return []
    return game.moves({ square, verbose: true }).map(m => m.to)
  }

  // Make move
  const makeMove = (from, to) => {
    if (!game) return

    const moveObj = {
      from,
      to,
      promotion: 'q' // Always promote to queen
    }

    const result = game.move(moveObj, { sloppy: true })
    if (result) {
      setGame(new Chess(game.fen()))
      setSelectedSquare(null)
      checkGameStatus()

      // AI move
      if (!game.isGameOver()) {
        setAiThinking(true)
        setTimeout(() => {
          makeAIMove()
        }, 800)
      }
    }
  }

  // AI Move logic
  const makeAIMove = () => {
    if (!game || game.isGameOver()) {
      setAiThinking(false)
      return
    }

    const moves = game.moves({ verbose: true })
    let move

    if (gameMode === 'silly') {
      // Random move
      move = moves[Math.floor(Math.random() * moves.length)]
    } else {
      // Simple AI: prioritize captures, then random
      const captures = moves.filter(m => game.get(m.to))
      move = captures.length > 0 ? captures[0] : moves[Math.floor(Math.random() * moves.length)]
    }

    if (move) {
      game.move(move)
      setGame(new Chess(game.fen()))
      checkGameStatus()
    }

    setAiThinking(false)
  }

  // Check game status
  const checkGameStatus = () => {
    if (game.isCheckmate()) {
      if (game.turn() === 'w') {
        setGameStatus('checkmate-ai-wins')
        setStats(prev => ({ ...prev, [gameMode]: (prev[gameMode] || 0) + 1 }))
      } else {
        setGameStatus('checkmate-player-wins')
      }
    } else if (game.isDraw()) {
      setGameStatus('draw')
    } else if (game.isCheck()) {
      setGameStatus('check')
    }
  }

  // Get square style
  const getSquareStyle = (file, rank) => {
    const square = String.fromCharCode(97 + file) + (8 - rank)
    const isLight = (file + rank) % 2 === 0
    const isSelected = square === selectedSquare
    const isValid = selectedSquare && getValidMoves(selectedSquare).includes(square)

    let bgColor = isLight ? '#f0d9b5' : '#baca44'

    if (isSelected) {
      bgColor = '#baca44'
    } else if (isValid) {
      bgColor = '#cdd26a'
    }

    return bgColor
  }

  const getPiece = (file, rank) => {
    const square = String.fromCharCode(97 + file) + (8 - rank)
    const piece = game?.get(square)
    return piece ? piece.color + piece.type.toUpperCase() : null
  }

  const getPieceEmoji = (piece) => {
    const pieces = {
      'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
      'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟'
    }
    return pieces[piece] || ''
  }

  const getBotName = (mode) => {
    const bots = { silly: 'Silly Sam 🤪', clever: 'Clever Carl 🤓', master: 'Chess Master Max 🧠' }
    return bots[mode] || 'Chess Bot'
  }

  // Loading screen
  if (!gameMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 p-4 md:p-8 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center">
            <h1 className="text-4xl md:text-5xl font-black text-purple-600 mb-8">
              ♟️ Chess Battle!
            </h1>
            <p className="text-lg font-bold text-gray-700 mb-8">
              Choose your opponent and prepare for battle! 🎯
            </p>

            <div className="space-y-4 mb-8">
              <BotButton
                name="Silly Sam 🤪"
                description="Makes silly moves - Easy to beat!"
                onClick={() => startGame('silly')}
              />
              <BotButton
                name="Clever Carl 🤓"
                description="Plays pretty good - Medium difficulty"
                onClick={() => startGame('clever')}
              />
              <BotButton
                name="Chess Master Max 🧠"
                description="Really smart - Hard to beat!"
                onClick={() => startGame('master')}
              />
            </div>

            {/* Stats */}
            <div className="bg-purple-100 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-purple-700 mb-4">📊 Your Stats</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <p className="text-2xl font-bold text-blue-600">{stats.silly}</p>
                  <p className="text-sm font-bold text-gray-600">Silly Wins</p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-2xl font-bold text-green-600">{stats.clever}</p>
                  <p className="text-sm font-bold text-gray-600">Clever Wins</p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-2xl font-bold text-red-600">{stats.master}</p>
                  <p className="text-sm font-bold text-gray-600">Master Wins</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Game board
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl md:text-4xl font-black text-white drop-shadow-lg mb-2">
            ♟️ vs {getBotName(gameMode)}
          </h2>
          <p className="text-lg font-bold text-white drop-shadow">
            {game?.turn() === 'w' ? 'Your turn!' : aiThinking ? 'AI is thinking... 🤔' : 'AI is moving...'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 mb-6">
          {/* Chess Board */}
          <div className="flex justify-center mb-6">
            <div className="inline-block border-4 border-gray-800">
              {Array(8).fill(0).map((_, rank) => (
                <div key={rank} className="flex">
                  {Array(8).fill(0).map((_, file) => {
                    const square = String.fromCharCode(97 + file) + (8 - rank)
                    const piece = getPiece(file, rank)
                    const validMoves = selectedSquare ? getValidMoves(selectedSquare) : []
                    const isValid = validMoves.includes(square)

                    return (
                      <div
                        key={square}
                        onClick={() => {
                          if (game.turn() === 'b' || aiThinking) return

                          if (selectedSquare && isValid) {
                            makeMove(selectedSquare, square)
                          } else if (piece && piece[0] === 'w') {
                            setSelectedSquare(square)
                          }
                        }}
                        style={{ backgroundColor: getSquareStyle(file, rank) }}
                        className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center text-4xl md:text-5xl cursor-pointer hover:opacity-80 transition-opacity font-bold"
                      >
                        {piece && getPieceEmoji(piece)}
                        {isValid && !piece && <div className="w-3 h-3 bg-gray-600 rounded-full" />}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Game Status */}
          {gameStatus === 'checkmate-player-wins' && (
            <div className="text-center mb-6 bg-green-200 rounded-lg p-4 border-4 border-green-500">
              <p className="text-3xl font-black text-green-700 animate-bounce">🎉 YOU WIN! 🎉</p>
              <p className="text-lg font-bold text-green-600 mt-2">Checkmate! Amazing job!</p>
            </div>
          )}
          {gameStatus === 'checkmate-ai-wins' && (
            <div className="text-center mb-6 bg-red-200 rounded-lg p-4 border-4 border-red-500">
              <p className="text-2xl font-bold text-red-700">Checkmate! Try again! 💪</p>
            </div>
          )}
          {gameStatus === 'draw' && (
            <div className="text-center mb-6 bg-yellow-200 rounded-lg p-4 border-4 border-yellow-500">
              <p className="text-2xl font-bold text-yellow-700">It's a Draw! Nice effort! 🤝</p>
            </div>
          )}
          {gameStatus === 'check' && (
            <div className="text-center mb-6 bg-orange-200 rounded-lg p-4 border-4 border-orange-500">
              <p className="text-xl font-bold text-orange-700">⚠️ Your King is in Check!</p>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => startGame(gameMode)}
              className="btn btn-secondary px-6 py-3 rounded-lg font-bold"
            >
              🔄 New Game
            </button>
            <button
              onClick={() => setGameMode(null)}
              className="btn bg-gray-500 px-6 py-3 rounded-lg font-bold"
            >
              🏠 Back to Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function BotButton({ name, description, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl p-4 font-bold text-lg transition-all hover:shadow-lg hover:scale-105 text-left border-4 border-purple-300"
    >
      <div className="text-2xl mb-1">{name}</div>
      <div className="text-sm opacity-90">{description}</div>
    </button>
  )
}
