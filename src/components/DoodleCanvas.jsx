import React, { useRef, useState, useEffect, useCallback } from 'react'

// API URL - change this after deploying your Cloudflare Worker
const API_URL = 'https://aidensite-drawings-api.YOUR_SUBDOMAIN.workers.dev'

export default function DoodleCanvas() {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState('#000000')
  const [isRainbow, setIsRainbow] = useState(false)
  const rainbowHue = useRef(0)
  const [brushSize, setBrushSize] = useState(5)
  const [tool, setTool] = useState('pen')
  const [history, setHistory] = useState([])
  const [textInput, setTextInput] = useState('')
  const [fontSize, setFontSize] = useState(16)
  const [selectedEmoji, setSelectedEmoji] = useState('⭐')
  const [emojiSize, setEmojiSize] = useState(32)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const contextRef = useRef(null)
  const [startPos, setStartPos] = useState(null)
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1

  // Gallery state
  const [activeTab, setActiveTab] = useState('draw') // 'draw', 'gallery', 'featured'
  const [gallery, setGallery] = useState([])
  const [featuredDrawings, setFeaturedDrawings] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [uploadModal, setUploadModal] = useState(false)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadArtist, setUploadArtist] = useState('')
  const [uploadStatus, setUploadStatus] = useState(null)
  const [selectedDrawing, setSelectedDrawing] = useState(null)

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      let width, height

      if (isFullScreen) {
        // Full screen mode
        width = window.innerWidth
        height = window.innerHeight
      } else {
        // Embedded mode
        const rect = canvas.parentElement.getBoundingClientRect()
        width = rect.width - 20
        height = 400
      }

      // Set canvas display size
      canvas.style.width = width + 'px'
      canvas.style.height = height + 'px'

      // Set internal canvas resolution for sharp drawing
      canvas.width = width * dpr
      canvas.height = height * dpr

      // Scale context for high DPI displays
      const context = canvas.getContext('2d', { willReadFrequently: true })
      context.scale(dpr, dpr)
      context.fillStyle = 'white'
      context.fillRect(0, 0, width, height)
      context.lineCap = 'round'
      context.lineJoin = 'round'
      contextRef.current = context

      setHistory([canvas.toDataURL()])
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [isFullScreen, dpr])

  const getCoordinates = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()

    let clientX, clientY
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else if (e.clientX !== undefined) {
      clientX = e.clientX
      clientY = e.clientY
    } else {
      return { x: 0, y: 0 }
    }

    const x = clientX - rect.left
    const y = clientY - rect.top

    return { x, y }
  }

  const startDrawing = (e) => {
    e.preventDefault()
    const { x, y } = getCoordinates(e)

    if (tool === 'text') {
      setStartPos({ x, y })
      return
    }

    if (tool === 'emoji') {
      const context = contextRef.current
      context.font = `${emojiSize}px Arial`
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText(selectedEmoji, x, y)
    }

    contextRef.current.beginPath()
    contextRef.current.moveTo(x, y)
    setStartPos({ x, y })
    setIsDrawing(true)
  }

  const draw = (e) => {
    if (!isDrawing) return
    e.preventDefault()

    const { x, y } = getCoordinates(e)
    const context = contextRef.current

    if (tool === 'pen') {
      if (isRainbow) {
        // For rainbow, draw each segment separately so colors don't get overwritten
        rainbowHue.current = (rainbowHue.current + 3) % 360
        context.strokeStyle = `hsl(${rainbowHue.current}, 100%, 50%)`
        context.lineWidth = brushSize
        context.lineTo(x, y)
        context.stroke()
        // Start new path from current position for next segment
        context.beginPath()
        context.moveTo(x, y)
      } else {
        context.strokeStyle = color
        context.lineWidth = brushSize
        context.lineTo(x, y)
        context.stroke()
      }
    } else if (tool === 'emoji') {
      context.font = `${emojiSize}px Arial`
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText(selectedEmoji, x, y)
    }
  }

  const stopDrawing = (e) => {
    if (!isDrawing && tool !== 'text') return
    e.preventDefault()

    const { x, y } = getCoordinates(e)
    const context = contextRef.current

    if (tool === 'line' && startPos) {
      context.strokeStyle = color
      context.lineWidth = brushSize
      context.beginPath()
      context.moveTo(startPos.x, startPos.y)
      context.lineTo(x, y)
      context.stroke()
    } else if (tool === 'rectangle' && startPos) {
      context.strokeStyle = color
      context.lineWidth = brushSize
      const w = x - startPos.x
      const h = y - startPos.y
      context.strokeRect(startPos.x, startPos.y, w, h)
    } else if (tool === 'circle' && startPos) {
      context.strokeStyle = color
      context.lineWidth = brushSize
      const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2))
      context.beginPath()
      context.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI)
      context.stroke()
    }

    contextRef.current.closePath()
    setIsDrawing(false)
    setStartPos(null)
    saveToHistory()
  }

  const handleTextTool = (e) => {
    if (tool === 'text' && startPos && textInput) {
      const context = contextRef.current
      context.fillStyle = color
      context.font = `${fontSize}px Arial`
      context.fillText(textInput, startPos.x, startPos.y)
      setTextInput('')
      saveToHistory()
      setStartPos(null)
    }
  }

  const fillCanvas = (e) => {
    const { x, y } = getCoordinates(e)
    const canvas = canvasRef.current
    const context = contextRef.current

    const imageData = context.getImageData(0, 0, canvas.width / dpr, canvas.height / dpr)
    const data = imageData.data

    const targetColor = getPixelColor(imageData, Math.floor(x), Math.floor(y), canvas.width / dpr)
    const fillColor = hexToRgba(color)

    const stack = [[Math.floor(x), Math.floor(y)]]
    const visited = new Set()

    while (stack.length > 0) {
      const [px, py] = stack.pop()
      const key = `${px},${py}`

      if (visited.has(key)) continue
      if (px < 0 || px >= canvas.width / dpr || py < 0 || py >= canvas.height / dpr) continue

      const idx = (py * (canvas.width / dpr) + px) * 4
      const currentColor = [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]]

      if (colorsMatch(currentColor, targetColor)) {
        data[idx] = fillColor.r
        data[idx + 1] = fillColor.g
        data[idx + 2] = fillColor.b
        data[idx + 3] = fillColor.a

        visited.add(key)
        stack.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1])
      }
    }

    context.putImageData(imageData, 0, 0)
    saveToHistory()
  }

  const getPixelColor = (imageData, x, y, width) => {
    const idx = (y * width + x) * 4
    return [imageData.data[idx], imageData.data[idx + 1], imageData.data[idx + 2], imageData.data[idx + 3]]
  }

  const colorsMatch = (color1, color2) => {
    return color1.every((c, i) => Math.abs(c - color2[i]) < 10)
  }

  const hexToRgba = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b, a: 255 }
  }

  const saveToHistory = () => {
    setHistory([...history, canvasRef.current.toDataURL()])
  }

  const undo = () => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1)
      setHistory(newHistory)
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current
        const context = contextRef.current
        context.fillStyle = 'white'
        context.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr)
        context.drawImage(img, 0, 0)
      }
      img.src = newHistory[newHistory.length - 1]
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const context = contextRef.current
    context.fillStyle = 'white'
    context.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr)
    setHistory([canvas.toDataURL()])
  }

  const saveDrawing = () => {
    const canvas = canvasRef.current
    const link = document.createElement('a')
    link.download = `aiden-drawing-${new Date().getTime()}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  // Fetch gallery drawings
  const fetchGallery = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/drawings`)
      if (response.ok) {
        const data = await response.json()
        setGallery(data.drawings || [])
      }
    } catch (error) {
      console.error('Failed to fetch gallery:', error)
    }
    setIsLoading(false)
  }, [])

  // Fetch featured drawings
  const fetchFeatured = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/drawings/featured`)
      if (response.ok) {
        const data = await response.json()
        setFeaturedDrawings(data.drawings || [])
      }
    } catch (error) {
      console.error('Failed to fetch featured:', error)
    }
    setIsLoading(false)
  }, [])

  // Upload drawing to gallery
  const uploadToGallery = async () => {
    if (!uploadTitle.trim()) {
      setUploadStatus({ type: 'error', message: 'Please enter a title!' })
      return
    }

    setUploadStatus({ type: 'loading', message: 'Uploading...' })

    try {
      const canvas = canvasRef.current
      const imageData = canvas.toDataURL('image/png')

      const response = await fetch(`${API_URL}/drawings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData,
          title: uploadTitle.trim(),
          artist: uploadArtist.trim() || 'Anonymous'
        })
      })

      if (response.ok) {
        setUploadStatus({ type: 'success', message: 'Drawing shared to gallery!' })
        setUploadTitle('')
        setUploadArtist('')
        setTimeout(() => {
          setUploadModal(false)
          setUploadStatus(null)
          fetchGallery()
        }, 1500)
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setUploadStatus({ type: 'error', message: 'Failed to upload. Try again!' })
    }
  }

  // Like a drawing
  const likeDrawing = async (drawingId) => {
    try {
      const response = await fetch(`${API_URL}/drawings/${drawingId}/like`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        // Update local state
        setGallery(prev => prev.map(d =>
          d.id === drawingId ? { ...d, likes: data.likes } : d
        ))
        setFeaturedDrawings(prev => prev.map(d =>
          d.id === drawingId ? { ...d, likes: data.likes } : d
        ))
        if (selectedDrawing?.id === drawingId) {
          setSelectedDrawing(prev => ({ ...prev, likes: data.likes }))
        }
      }
    } catch (error) {
      console.error('Like error:', error)
    }
  }

  // View full drawing
  const viewDrawing = async (drawing) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/drawings/${drawing.id}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedDrawing(data)
      }
    } catch (error) {
      console.error('Failed to load drawing:', error)
    }
    setIsLoading(false)
  }

  // Load gallery when tab changes
  useEffect(() => {
    if (activeTab === 'gallery') {
      fetchGallery()
    } else if (activeTab === 'featured') {
      fetchFeatured()
    }
  }, [activeTab, fetchGallery, fetchFeatured])

  const ToolsSection = () => (
    <>
      {/* Tool Selection */}
      <div className="flex flex-wrap gap-2 mb-3">
        {[
          { id: 'pen', emoji: '✏️', label: 'Pen' },
          { id: 'line', emoji: '📏', label: 'Line' },
          { id: 'rectangle', emoji: '▭', label: 'Rect' },
          { id: 'circle', emoji: '●', label: 'Circle' },
          { id: 'text', emoji: '📝', label: 'Text' },
          { id: 'fill', emoji: '🪣', label: 'Fill' },
          { id: 'emoji', emoji: '😀', label: 'Emoji' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTool(t.id)}
            className={`px-2 py-1 md:px-3 md:py-2 rounded text-xs md:text-sm font-bold transition-all ${
              tool === t.id ? 'bg-purple-600 text-white scale-110 shadow-lg' : 'bg-gray-300 text-gray-800 hover:bg-gray-400'
            }`}
            title={t.label}
          >
            {t.emoji}
          </button>
        ))}
      </div>

      {/* Color & Size Controls */}
      <div className="flex flex-wrap gap-3 mb-3 items-center">
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={color}
            onChange={(e) => { setColor(e.target.value); setIsRainbow(false) }}
            className="w-8 h-8 cursor-pointer rounded border-2 border-gray-400"
          />
          {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFD700', '#FF69B4', '#00CED1', '#FF8C00'].map((c) => (
            <button
              key={c}
              onClick={() => { setColor(c); setIsRainbow(false) }}
              className={`w-5 h-5 md:w-6 md:h-6 rounded border-2 transition-all ${
                color === c && !isRainbow ? 'border-black scale-110 shadow' : 'border-gray-400 hover:border-gray-600'
              }`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
          <button
            onClick={() => setIsRainbow(true)}
            className={`w-5 h-5 md:w-6 md:h-6 rounded border-2 transition-all ${
              isRainbow ? 'border-black scale-110 shadow' : 'border-gray-400 hover:border-gray-600'
            }`}
            style={{ background: 'linear-gradient(to right, red, orange, yellow, green, blue, purple)' }}
            title="Rainbow"
          />
        </div>

        <div className="flex gap-2 items-center">
          <label className="text-gray-700 font-bold text-xs md:text-sm">Size:</label>
          <input
            type="range"
            min="1"
            max="50"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-16 md:w-24 h-2 bg-gray-400 rounded-lg"
          />
          <span className="text-gray-700 font-bold text-xs md:text-sm w-6">{brushSize}</span>
        </div>

        {tool === 'text' && (
          <div className="flex gap-2 items-center">
            <label className="text-gray-700 font-bold text-xs md:text-sm">Font:</label>
            <input
              type="range"
              min="8"
              max="72"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-16 md:w-24 h-2 bg-gray-400 rounded-lg"
            />
            <span className="text-gray-700 font-bold text-xs md:text-sm w-6">{fontSize}</span>
          </div>
        )}

        {tool === 'emoji' && (
          <div className="flex gap-2 items-center flex-wrap">
            <label className="text-gray-700 font-bold text-xs md:text-sm">Size:</label>
            <input
              type="range"
              min="16"
              max="80"
              value={emojiSize}
              onChange={(e) => setEmojiSize(Number(e.target.value))}
              className="w-16 md:w-24 h-2 bg-gray-400 rounded-lg"
            />
            <span className="text-gray-700 font-bold text-xs md:text-sm w-6">{emojiSize}</span>
            <div className="flex gap-1 flex-wrap">
              {['⭐', '❤️', '😀', '😎', '🔥', '⚽', '🏀', '🎨', '🌈', '🦄', '🐶', '🐱', '🦋', '🌸', '🎮', '🚀', '💎', '👑', '🎵', '✨', '💩', '🗿'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`w-7 h-7 md:w-8 md:h-8 rounded text-lg md:text-xl transition-all ${
                    selectedEmoji === emoji ? 'bg-purple-400 scale-110 shadow-lg' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={undo}
          className="bg-yellow-400 hover:bg-yellow-500 text-gray-800 px-2 md:px-3 py-1 rounded font-bold text-xs md:text-sm"
          title="Undo"
        >
          ↶ Undo
        </button>
        <button
          onClick={clearCanvas}
          className="bg-red-400 hover:bg-red-500 text-white px-2 md:px-3 py-1 rounded font-bold text-xs md:text-sm"
          title="Clear"
        >
          🗑️ Clear
        </button>
        <button
          onClick={saveDrawing}
          className="bg-green-400 hover:bg-green-500 text-white px-2 md:px-3 py-1 rounded font-bold text-xs md:text-sm"
          title="Save"
        >
          💾 Save
        </button>
        <button
          onClick={() => setUploadModal(true)}
          className="bg-purple-500 hover:bg-purple-600 text-white px-2 md:px-3 py-1 rounded font-bold text-xs md:text-sm"
          title="Share to Gallery"
        >
          🌐 Share
        </button>
      </div>
    </>
  )

  // Fullscreen Mode
  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center overflow-auto p-2 md:p-4">
          <canvas
            ref={canvasRef}
            onMouseDown={tool === 'fill' ? fillCanvas : startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={tool === 'fill' ? fillCanvas : startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            onTouchCancel={stopDrawing}
            className="block bg-white rounded-lg shadow-lg border-4 border-gray-600"
            style={{
              touchAction: 'none',
              cursor: tool === 'text' ? 'text' : tool === 'fill' || tool === 'emoji' ? 'pointer' : 'crosshair',
              display: 'block',
            }}
          />
        </div>

        {/* Controls Bar */}
        <div className="bg-gray-900 border-t-4 border-gray-700 p-4 overflow-y-auto max-h-32 md:max-h-none">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <ToolsSection />
            <button
              onClick={() => setIsFullScreen(false)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm md:text-base whitespace-nowrap"
            >
              Exit Fullscreen ✕
            </button>
          </div>
        </div>

        {/* Text Input Panel */}
        {tool === 'text' && startPos && (
          <div className="bg-gray-800 border-t-2 border-purple-500 p-3 flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter text..."
              className="flex-1 px-3 py-2 rounded text-sm border-2 border-purple-400"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleTextTool(e)
              }}
            />
            <button
              onClick={handleTextTool}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-bold text-sm"
            >
              Add
            </button>
          </div>
        )}
      </div>
    )
  }

  // Gallery Card Component
  const DrawingCard = ({ drawing, showFeaturedBadge = false }) => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-200 hover:border-purple-400 transition-all hover:shadow-xl">
      <div
        className="aspect-square bg-gray-100 cursor-pointer relative"
        onClick={() => viewDrawing(drawing)}
      >
        {drawing.imageData ? (
          <img src={drawing.imageData} alt={drawing.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span className="text-4xl">🖼️</span>
          </div>
        )}
        {showFeaturedBadge && drawing.likes > 0 && (
          <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
            ⭐ Featured
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-bold text-gray-800 truncate">{drawing.title}</h3>
        <p className="text-sm text-gray-500">by {drawing.artist}</p>
        <div className="flex justify-between items-center mt-2">
          <button
            onClick={() => likeDrawing(drawing.id)}
            className="flex items-center gap-1 bg-pink-100 hover:bg-pink-200 text-pink-600 px-3 py-1 rounded-full text-sm font-bold transition-all hover:scale-105"
          >
            ❤️ {drawing.likes || 0}
          </button>
          <span className="text-xs text-gray-400">
            {new Date(drawing.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  )

  // Normal Embedded Mode
  return (
    <div className="space-y-3">
      {/* Tab Navigation */}
      <div className="flex gap-2 bg-gray-100 rounded-lg p-2">
        <button
          onClick={() => setActiveTab('draw')}
          className={`flex-1 py-2 px-4 rounded-lg font-bold transition-all ${
            activeTab === 'draw'
              ? 'bg-purple-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-200'
          }`}
        >
          ✏️ Draw
        </button>
        <button
          onClick={() => setActiveTab('gallery')}
          className={`flex-1 py-2 px-4 rounded-lg font-bold transition-all ${
            activeTab === 'gallery'
              ? 'bg-purple-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-200'
          }`}
        >
          🖼️ Gallery
        </button>
        <button
          onClick={() => setActiveTab('featured')}
          className={`flex-1 py-2 px-4 rounded-lg font-bold transition-all ${
            activeTab === 'featured'
              ? 'bg-yellow-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-200'
          }`}
        >
          ⭐ Best
        </button>
      </div>

      {/* Draw Tab */}
      {activeTab === 'draw' && (
        <>
          {/* Canvas */}
          <div className="flex justify-center bg-gray-100 rounded-lg p-2">
            <canvas
              ref={canvasRef}
              onMouseDown={tool === 'fill' ? fillCanvas : startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={tool === 'fill' ? fillCanvas : startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              onTouchCancel={stopDrawing}
              className="bg-white rounded-lg shadow-md border-4 border-gray-400 block"
              style={{
                touchAction: 'none',
                cursor: tool === 'text' ? 'text' : tool === 'fill' || tool === 'emoji' ? 'pointer' : 'crosshair',
                display: 'block',
              }}
            />
          </div>

          {/* Tools */}
          <div className="bg-gray-100 rounded-lg p-4 border-2 border-gray-300">
            <ToolsSection />

            {/* Fullscreen Button */}
            <button
              onClick={() => setIsFullScreen(true)}
              className="mt-3 w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold transition-all hover:scale-105"
            >
              ⛶ Go Fullscreen
            </button>
          </div>

          {/* Text Input Panel */}
          {tool === 'text' && startPos && (
            <div className="bg-gray-100 rounded-lg p-3 flex gap-2 border-2 border-purple-400">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Enter text..."
                className="flex-1 px-3 py-2 rounded text-sm border-2 border-purple-400"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleTextTool(e)
                }}
              />
              <button
                onClick={handleTextTool}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-bold text-sm"
              >
                Add Text
              </button>
            </div>
          )}
        </>
      )}

      {/* Gallery Tab */}
      {activeTab === 'gallery' && (
        <div className="bg-gray-100 rounded-lg p-4">
          <h2 className="text-2xl font-bold text-purple-600 mb-4 text-center">🖼️ Community Gallery</h2>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="text-4xl animate-spin">🎨</div>
              <p className="text-gray-500 mt-2">Loading drawings...</p>
            </div>
          ) : gallery.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl">
              <div className="text-6xl mb-4">🎨</div>
              <p className="text-gray-500 text-lg">No drawings yet!</p>
              <p className="text-gray-400">Be the first to share your art!</p>
              <button
                onClick={() => setActiveTab('draw')}
                className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-bold"
              >
                Start Drawing
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {gallery.map(drawing => (
                <DrawingCard key={drawing.id} drawing={drawing} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Featured Tab */}
      {activeTab === 'featured' && (
        <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg p-4">
          <h2 className="text-2xl font-bold text-yellow-600 mb-4 text-center">⭐ Best Drawings</h2>
          <p className="text-center text-yellow-700 mb-4">Top drawings voted by the community!</p>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="text-4xl animate-spin">⭐</div>
              <p className="text-yellow-600 mt-2">Loading best drawings...</p>
            </div>
          ) : featuredDrawings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl">
              <div className="text-6xl mb-4">🏆</div>
              <p className="text-gray-500 text-lg">No featured drawings yet!</p>
              <p className="text-gray-400">Like drawings in the gallery to feature them here!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {featuredDrawings.map((drawing, idx) => (
                <div key={drawing.id} className="relative">
                  {idx < 3 && (
                    <div className="absolute -top-2 -left-2 z-10 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center font-black text-yellow-900 shadow-lg">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                    </div>
                  )}
                  <DrawingCard drawing={drawing} showFeaturedBadge />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {uploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-purple-600 mb-4">🌐 Share Your Drawing</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Title *</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="My Awesome Drawing"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 outline-none"
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Artist Name</label>
                <input
                  type="text"
                  value={uploadArtist}
                  onChange={(e) => setUploadArtist(e.target.value)}
                  placeholder="Anonymous"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 outline-none"
                  maxLength={30}
                />
              </div>

              {uploadStatus && (
                <div className={`p-3 rounded-lg text-center font-bold ${
                  uploadStatus.type === 'success' ? 'bg-green-100 text-green-700' :
                  uploadStatus.type === 'error' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {uploadStatus.message}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setUploadModal(false)
                    setUploadStatus(null)
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={uploadToGallery}
                  disabled={uploadStatus?.type === 'loading'}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-bold disabled:opacity-50"
                >
                  {uploadStatus?.type === 'loading' ? 'Uploading...' : '🚀 Share!'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Drawing Modal */}
      {selectedDrawing && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto shadow-2xl">
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{selectedDrawing.title}</h3>
                <p className="text-gray-500">by {selectedDrawing.artist}</p>
              </div>
              <button
                onClick={() => setSelectedDrawing(null)}
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              {selectedDrawing.imageData ? (
                <img
                  src={selectedDrawing.imageData}
                  alt={selectedDrawing.title}
                  className="w-full rounded-lg shadow-lg"
                />
              ) : (
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-4xl animate-spin">🎨</div>
                </div>
              )}
            </div>

            <div className="p-4 border-t flex justify-between items-center">
              <button
                onClick={() => likeDrawing(selectedDrawing.id)}
                className="flex items-center gap-2 bg-pink-100 hover:bg-pink-200 text-pink-600 px-6 py-2 rounded-full font-bold transition-all hover:scale-105"
              >
                ❤️ Like ({selectedDrawing.likes || 0})
              </button>
              <span className="text-gray-400">
                {new Date(selectedDrawing.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
