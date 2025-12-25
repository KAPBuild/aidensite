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
  const [gameStatus, setGameStatus] = useState('')
  const [aiThinking, setAiThinking] = useState(false)
  const [lastMove, setLastMove] = useState(null)
  const [aiMessage, setAiMessage] = useState('')
  const [moveCount, setMoveCount] = useState(0)

  // Save stats
  useEffect(() => {
    if (stats) {
      localStorage.setItem('aidenChessStats', JSON.stringify(stats))
    }
  }, [stats])

  // Character data
  const characters = {
    silly: {
      name: 'Silly Sam',
      emoji: '🤪',
      color: 'from-yellow-400 to-orange-400',
      description: 'A goofy chess player who makes hilarious moves!',
      quote: 'Why win when you can have fun?',
      reactions: {
        win: ['I won! 🎉', 'Lucky me! 🍀', 'Yahoo! 🎪'],
        lose: ['Oof! Better luck next time! 😄', 'You got me! Well played! 👏', 'Wow, nice move! 🎯'],
        move: ['Hehe! 🤣', 'Random is good! 🎲', 'Take that! 💨', 'Whoopsie! 🎭'],
      },
    },
    clever: {
      name: 'Clever Carl',
      emoji: '🤓',
      color: 'from-green-400 to-emerald-400',
      description: 'A smart chess player who thinks ahead!',
      quote: 'Every move has a purpose...',
      reactions: {
        win: ['Checkmate! 🎯', 'My calculations were correct! 📊', 'A brilliant game! ♟️'],
        lose: ['Impressive! 🤝', 'You outsmarted me! 🧠', 'Well played, indeed! 👌'],
        move: ['Let me think... 🤔', 'Interesting move... 📖', 'I see your strategy... 👁️'],
      },
    },
    master: {
      name: 'Chess Master Max',
      emoji: '🧠',
      color: 'from-purple-500 to-indigo-500',
      description: 'A legendary chess master with incredible skill!',
      quote: 'I see 20 moves ahead... always.',
      reactions: {
        win: ['Checkmate! As predicted! ⚡', 'Your king never stood a chance! 👑', 'I am unstoppable! 💎'],
        lose: ['Impossible! 😱', 'You defeated me?! 🤯', 'I underestimated you... 🙏'],
        move: ['Executing flawless strategy... ♟️', 'Calculating... 🧮', 'The pieces dance to my will... 💫'],
      },
    },
  }

  // Initialize game
  const startGame = (difficulty) => {
    setGameMode(difficulty)
    setGame(new Chess())
    setSelectedSquare(null)
    setGameStatus('')
    setAiThinking(false)
    setMoveCount(0)
    setAiMessage('')
    setLastMove(null)
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
      promotion: 'q',
    }

    const result = game.move(moveObj, { sloppy: true })
    if (result) {
      setLastMove({ from, to })
      setMoveCount(moveCount + 1)
      setGame(new Chess(game.fen()))
      setSelectedSquare(null)
      checkGameStatus()

      if (!game.isGameOver()) {
        setAiThinking(true)
        const char = characters[gameMode]
        const reactions = char.reactions.move
        setAiMessage(reactions[Math.floor(Math.random() * reactions.length)])

        setTimeout(() => {
          makeAIMove()
        }, 1200)
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
      move = moves[Math.floor(Math.random() * moves.length)]
    } else if (gameMode === 'clever') {
      const captures = moves.filter(m => game.get(m.to))
      move = captures.length > 0 ? captures[Math.floor(Math.random() * captures.length)] : moves[Math.floor(Math.random() * moves.length)]
    } else {
      // Master mode - prioritize captures, checks, and strategic moves
      const captures = moves.filter(m => game.get(m.to))
      const checks = moves.filter(m => {
        game.move(m)
        const isCheck = game.isCheck()
        game.undo()
        return isCheck
      })
      move = captures.length > 0 ? captures[0] : checks.length > 0 ? checks[0] : moves[Math.floor(Math.random() * moves.length)]
    }

    if (move) {
      game.move(move)
      setGame(new Chess(game.fen()))
      setLastMove({ from: move.from, to: move.to })
      checkGameStatus()
    }

    setAiThinking(false)
  }

  // Check game status
  const checkGameStatus = () => {
    if (game.isCheckmate()) {
      if (game.turn() === 'w') {
        setGameStatus('checkmate-ai-wins')
        const char = characters[gameMode]
        const reactions = char.reactions.win
        setAiMessage(reactions[Math.floor(Math.random() * reactions.length)])
        setStats(prev => ({ ...prev, [gameMode]: (prev[gameMode] || 0) + 1 }))
      } else {
        setGameStatus('checkmate-player-wins')
        setAiMessage('Amazing! You won! 🏆')
      }
    } else if (game.isDraw()) {
      setGameStatus('draw')
      setAiMessage("It's a draw! 🤝")
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
    const isLastMove = lastMove && (lastMove.from === square || lastMove.to === square)

    let bgColor = isLight ? '#f0d9b5' : '#baca44'

    if (isLastMove) {
      bgColor = '#bdd1e7'
    } else if (isSelected) {
      bgColor = '#7fc97f'
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
      wK: '♔',
      wQ: '♕',
      wR: '♖',
      wB: '♗',
      wN: '♘',
      wP: '♙',
      bK: '♚',
      bQ: '♛',
      bR: '♜',
      bB: '♝',
      bN: '♞',
      bP: '♟',
    }
    return pieces[piece] || ''
  }

  // Loading screen
  if (!gameMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 p-4 md:p-8 flex items-center justify-center">
        <div className="max-w-4xl w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-black text-purple-600 mb-4">♟️ Chess Battle!</h1>
            <p className="text-xl font-bold text-gray-700 mb-8">Choose your opponent and prepare for an epic match! 🎯</p>

            {/* Opponent Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {['silly', 'clever', 'master'].map(mode => {
                const char = characters[mode]
                return (
                  <button
                    key={mode}
                    onClick={() => startGame(mode)}
                    className={`bg-gradient-to-br ${char.color} hover:shadow-2xl hover:scale-105 transition-all rounded-2xl p-8 text-white border-4 border-white shadow-xl`}
                  >
                    <div className="text-7xl mb-4">{char.emoji}</div>
                    <h3 className="text-3xl font-black mb-2">{char.name}</h3>
                    <p className="text-lg font-semibold mb-4">{char.description}</p>
                    <p className="text-sm italic opacity-90 mb-6">"{char.quote}"</p>
                    <div className="bg-white bg-opacity-20 rounded-lg p-3">
                      <p className="text-2xl font-bold">{stats[mode] || 0}</p>
                      <p className="text-sm">Wins</p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Stats Summary */}
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-8 border-4 border-purple-300">
              <h3 className="text-2xl font-black text-purple-700 mb-6">📊 Your Championship Stats</h3>
              <div className="grid grid-cols-3 gap-4">
                {['silly', 'clever', 'master'].map(mode => (
                  <div key={mode} className="bg-white rounded-xl p-4 border-2 border-purple-200">
                    <p className="text-3xl font-bold text-purple-600">{stats[mode] || 0}</p>
                    <p className="text-sm font-bold text-gray-600">{characters[mode].name} Wins</p>
                  </div>
                ))}
              </div>
              <p className="text-lg font-bold text-purple-700 mt-6">Total Wins: {Object.values(stats).reduce((a, b) => a + b, 0)}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const char = characters[gameMode]

  // Game board
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with Characters */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* Player Info */}
          <div className="bg-white rounded-2xl p-4 text-center shadow-xl border-4 border-blue-400">
            <p className="text-3xl mb-2">👤</p>
            <h3 className="font-bold text-lg text-blue-600">You</h3>
            <p className="text-2xl font-black text-blue-600">♟️</p>
            <p className={`text-sm font-bold mt-2 ${game?.turn() === 'w' ? 'text-green-600 animate-pulse' : 'text-gray-500'}`}>
              {game?.turn() === 'w' ? 'Your Turn!' : 'AI Turn'}
            </p>
          </div>

          {/* Game Status */}
          <div className="bg-gradient-to-br from-yellow-200 to-orange-200 rounded-2xl p-4 text-center shadow-xl border-4 border-yellow-400">
            <p className="text-4xl mb-2">⚔️</p>
            <h3 className="font-bold text-lg text-orange-700 mb-2">Move #{moveCount + 1}</h3>
            {gameStatus === 'check' && <p className="text-orange-700 font-bold">⚠️ Check!</p>}
            {!gameStatus && aiThinking && <p className="text-orange-700 font-bold animate-bounce">Thinking... 🤔</p>}
            {gameStatus && <p className="text-lg font-black text-orange-700">Game Over!</p>}
          </div>

          {/* AI Info */}
          <div className={`bg-gradient-to-br ${char.color} rounded-2xl p-4 text-center shadow-xl border-4 border-white text-white`}>
            <p className="text-3xl mb-2">{char.emoji}</p>
            <h3 className="font-bold text-lg">{char.name}</h3>
            <p className="text-2xl font-black">♚</p>
            <p className={`text-sm font-bold mt-2 ${game?.turn() === 'b' ? 'text-yellow-200 animate-pulse' : 'text-white/60'}`}>
              {game?.turn() === 'b' ? 'Playing...' : 'Waiting'}
            </p>
          </div>
        </div>

        {/* Chess Board Section */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
          {/* AI Message Bubble */}
          {aiMessage && (
            <div className={`bg-gradient-to-br ${char.color} text-white rounded-2xl p-6 mb-6 text-center text-2xl font-bold animate-bounce border-4 border-white`}>
              {aiMessage}
            </div>
          )}

          {/* Chess Board */}
          <div className="flex justify-center mb-8">
            <div className="inline-block border-8 border-gray-800 shadow-2xl">
              {Array(8)
                .fill(0)
                .map((_, rank) => (
                  <div key={rank} className="flex">
                    {Array(8)
                      .fill(0)
                      .map((_, file) => {
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
                            className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center text-6xl md:text-7xl cursor-pointer hover:opacity-80 transition-opacity font-bold border border-gray-400"
                          >
                            {piece && getPieceEmoji(piece)}
                            {isValid && !piece && <div className="w-4 h-4 bg-red-600 rounded-full" />}
                          </div>
                        )
                      })}
                  </div>
                ))}
            </div>
          </div>

          {/* Game Status Messages */}
          {gameStatus === 'checkmate-player-wins' && (
            <div className="text-center mb-6 bg-green-200 rounded-xl p-6 border-4 border-green-500 shadow-lg">
              <p className="text-4xl font-black text-green-700 animate-bounce">🎉 YOU WIN! 🎉</p>
              <p className="text-xl font-bold text-green-600 mt-2">Checkmate! You're a chess champion!</p>
            </div>
          )}
          {gameStatus === 'checkmate-ai-wins' && (
            <div className="text-center mb-6 bg-red-200 rounded-xl p-6 border-4 border-red-500 shadow-lg">
              <p className="text-2xl font-bold text-red-700">
                {gameMode === 'silly' ? 'Silly Sam got lucky! 🍀' : gameMode === 'clever' ? 'Clever Carl wins! 🤓' : 'Chess Master Max wins! 👑'}
              </p>
              <p className="text-lg font-bold text-red-600 mt-2">Try again! You're getting closer! 💪</p>
            </div>
          )}
          {gameStatus === 'draw' && (
            <div className="text-center mb-6 bg-yellow-200 rounded-xl p-6 border-4 border-yellow-500 shadow-lg">
              <p className="text-2xl font-bold text-yellow-700">It's a Draw! 🤝</p>
              <p className="text-lg font-bold text-yellow-600 mt-2">Great effort! You held your own!</p>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => startGame(gameMode)}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-110 border-4 border-green-700 shadow-lg"
            >
              🔄 New Game
            </button>
            <button
              onClick={() => setGameMode(null)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-110 border-4 border-blue-700 shadow-lg"
            >
              🏠 Back to Opponents
            </button>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 text-center">
          <p className="text-lg font-bold text-gray-700">💡 Tip: Click on your white pieces to move them, then click where you want them to go!</p>
        </div>
      </div>
    </div>
  )
}
