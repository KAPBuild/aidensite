import React, { useRef, useEffect, useState } from 'react'

export default function RetroGames() {
  const canvasRef = useRef(null)
  const nesRef = useRef(null)
  const [gameLoaded, setGameLoaded] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [gameTitle, setGameTitle] = useState('No game loaded')
  const fileInputRef = useRef(null)

  // Initialize NES emulator
  useEffect(() => {
    const initNES = async () => {
      try {
        // Dynamically import JSNES
        const jsnes = await import('jsnes')
        const NES = jsnes.NES

        const nes = new NES({
          onFrame: (framebuffer) => {
            if (canvasRef.current) {
              const context = canvasRef.current.getContext('2d')
              const imageData = context.createImageData(256, 240)

              for (let i = 0; i < framebuffer.length; i++) {
                imageData.data[i * 4] = (framebuffer[i] >> 16) & 0xff
                imageData.data[i * 4 + 1] = (framebuffer[i] >> 8) & 0xff
                imageData.data[i * 4 + 2] = framebuffer[i] & 0xff
                imageData.data[i * 4 + 3] = 0xff
              }

              context.putImageData(imageData, 0, 0)
            }
          },
          onAudioSample: () => {
            // Audio support optional
          },
        })

        nesRef.current = nes

        // Keyboard controls
        const keyCodes = {
          38: 'up', // up arrow
          40: 'down', // down arrow
          37: 'left', // left arrow
          39: 'right', // right arrow
          65: 'a', // A key
          83: 'start', // S key
          90: 'b', // Z key
          13: 'select', // Enter
        }

        const handleKeyDown = (e) => {
          if (keyCodes[e.keyCode]) {
            nes.buttonPressed(1, keyCodes[e.keyCode])
            e.preventDefault()
          }
        }

        const handleKeyUp = (e) => {
          if (keyCodes[e.keyCode]) {
            nes.buttonReleased(1, keyCodes[e.keyCode])
            e.preventDefault()
          }
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)

        return () => {
          window.removeEventListener('keydown', handleKeyDown)
          window.removeEventListener('keyup', handleKeyUp)
        }
      } catch (error) {
        console.error('Error initializing NES emulator:', error)
        setErrorMessage('Error loading emulator. Make sure jsnes is installed.')
      }
    }

    initNES()
  }, [])

  // Handle ROM file upload
  const handleROMUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setErrorMessage('')
      const arrayBuffer = await file.arrayBuffer()

      if (nesRef.current) {
        nesRef.current.loadROM(arrayBuffer)
        setGameLoaded(true)
        setGameTitle(file.name.replace('.nes', ''))
        setIsPlaying(true)

        // Start emulation loop
        const emulationLoop = () => {
          nesRef.current.frame()
          requestAnimationFrame(emulationLoop)
        }
        requestAnimationFrame(emulationLoop)
      }
    } catch (error) {
      console.error('Error loading ROM:', error)
      setErrorMessage(`Failed to load ROM: ${error.message}`)
      setGameLoaded(false)
    }
  }

  const loadBrowserROM = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-black text-white drop-shadow-lg mb-4">
            🎮 Retro Gaming Emulator
          </h1>
          <p className="text-xl font-bold text-white drop-shadow">
            NES/SNES Emulation
          </p>
        </div>

        {/* Emulator Container */}
        <div className="bg-black rounded-3xl shadow-2xl p-6 border-8 border-gray-800 mb-8">
          {/* Canvas */}
          <div className="bg-gray-900 rounded-2xl overflow-hidden mb-6 flex justify-center">
            <canvas
              ref={canvasRef}
              width={256}
              height={240}
              className="w-full max-w-2xl h-auto"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>

          {/* Game Title */}
          <div className="bg-purple-900 rounded-lg p-4 mb-6 text-center border-2 border-purple-500">
            <p className="text-white text-lg font-bold">
              {gameLoaded ? `🎮 Playing: ${gameTitle}` : gameTitle}
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-500 rounded-lg p-4 mb-6 border-2 border-red-700">
              <p className="text-white font-bold">❌ {errorMessage}</p>
            </div>
          )}

          {/* Controls Display */}
          <div className="bg-gray-800 rounded-xl p-6 mb-6">
            <h3 className="text-white font-bold text-lg mb-4 text-center">⌨️ Controls</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-white text-sm">
                <p className="font-bold mb-3">🎮 Player 1 Controls:</p>
                <ul className="space-y-2">
                  <li><span className="bg-blue-600 px-3 py-1 rounded font-bold">↑↓←→</span> Move</li>
                  <li><span className="bg-blue-600 px-3 py-1 rounded font-bold">A</span> Button A</li>
                  <li><span className="bg-blue-600 px-3 py-1 rounded font-bold">Z</span> Button B</li>
                  <li><span className="bg-blue-600 px-3 py-1 rounded font-bold">S</span> Start</li>
                  <li><span className="bg-blue-600 px-3 py-1 rounded font-bold">Enter</span> Select</li>
                </ul>
              </div>

              <div className="text-white text-sm">
                <p className="font-bold mb-3">📝 Legal Note:</p>
                <p className="text-xs">
                  Only load ROMs for games you own or public domain/freeware games.
                  This emulator supports .NES and .SNES files.
                </p>
              </div>
            </div>
          </div>

          {/* Load ROM Button */}
          <div className="flex flex-col gap-4">
            <button
              onClick={loadBrowserROM}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-xl px-8 py-4 rounded-xl transition-all hover:scale-105 shadow-lg w-full"
            >
              📂 Load ROM File
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".nes,.snes,.bin"
              onChange={handleROMUpload}
              style={{ display: 'none' }}
            />

            {gameLoaded && (
              <button
                onClick={() => {
                  setGameLoaded(false)
                  setIsPlaying(false)
                  setGameTitle('No game loaded')
                }}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold text-lg px-8 py-3 rounded-xl transition-all hover:scale-105 w-full"
              >
                🛑 Unload Game
              </button>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border-4 border-purple-500">
          <h2 className="text-3xl font-black text-purple-600 mb-6">📚 About This Emulator</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">🎮 What is JSNES?</h3>
              <p className="text-gray-700">
                JSNES is an open-source Nintendo Entertainment System (NES) emulator written in JavaScript.
                It allows you to play classic NES games directly in your browser!
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">⚖️ Legal Games to Play</h3>
              <ul className="text-gray-700 space-y-2">
                <li>✅ Games you own (scan or download from your collection)</li>
                <li>✅ Homebrew games (freely distributed by creators)</li>
                <li>✅ Public domain games</li>
                <li>✅ Games released by their creators as freeware</li>
                <li>❌ Commercial games without permission</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">🔗 Where to Find Legal Games</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• <strong>Homebrew:</strong> itch.io (search "NES homebrew")</li>
                <li>• <strong>Public Domain:</strong> Archive.org has many classic games</li>
                <li>• <strong>Your Collection:</strong> Games you own can be dumped from cartridges</li>
              </ul>
            </div>

            <div className="bg-blue-100 border-2 border-blue-500 rounded-lg p-4">
              <p className="text-blue-900 font-semibold">
                💡 Tip: The emulator works best with original NES ROM files (.nes format).
                Have fun playing classic games!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
